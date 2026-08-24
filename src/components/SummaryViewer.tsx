'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  FileText,
  Sparkles,
  TrendingUp,
  Lightbulb,
  Copy,
  Check,
  RotateCcw,
  Square,
  ShieldAlert,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import { SummaryPreset, KeyPoint, ImprovementSuggestion, SummaryPersona } from '@/domain/models/summary';
import { DocumentMetadata } from '@/domain/models/document';
import { ExportMenu } from '@/components/ExportMenu';
import { AudioSummaryPlayer } from '@/components/AudioSummaryPlayer';
import { DocumentChat } from '@/components/DocumentChat';
import { HistoryStorage } from '@/components/HistoryVault';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import { toast } from 'sonner';

export interface SummaryViewerProps {
  documentText: string;
  documentMetadata?: DocumentMetadata;
  preset: SummaryPreset;
  persona?: SummaryPersona;
  extractKeyPoints?: boolean;
  extractSuggestions?: boolean;
  autoStart?: boolean;
  onComplete?: (summaryMarkdown: string, keyPoints: KeyPoint[], suggestions: ImprovementSuggestion[]) => void;
  className?: string;
}

export function SummaryViewer({
  documentText,
  documentMetadata,
  preset,
  persona = 'general',
  extractKeyPoints = true,
  extractSuggestions = true,
  autoStart = false,
  onComplete,
  className = '',
}: SummaryViewerProps) {
  const [summaryMarkdown, setSummaryMarkdown] = useState<string>('');
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('markdown');
  const [copied, setCopied] = useState<boolean>(false);
  const [copiedCardId, setCopiedCardId] = useState<string | null>(null);
  const [streamingDurationSeconds, setStreamingDurationSeconds] = useState<number>(0);

  const [parsedKeyPoints, setParsedKeyPoints] = useState<KeyPoint[]>([]);
  const [parsedSuggestions, setParsedSuggestions] = useState<ImprovementSuggestion[]>([]);

  const abortControllerRef = useRef<AbortController | null>(null);
  const contentEndRef = useRef<HTMLDivElement>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-scroll to bottom of stream
  useEffect(() => {
    if (isStreaming && contentEndRef.current) {
      contentEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [summaryMarkdown, isStreaming]);

  // Handle stream parser for incoming chunks
  const parseStreamChunks = useCallback((chunkText: string) => {
    setSummaryMarkdown((prev) => {
      const updated = prev + chunkText;

      // Extract key takeaways if embedded in XML / markdown blocks
      const kpMatch = updated.match(/<key_points>([\s\S]*?)<\/key_points>/i) ||
                      updated.match(/## Key (Takeaways|Points)([\s\S]*?)(?=##|$)/i);
      if (kpMatch && kpMatch[1]) {
        const rawBullets = kpMatch[1]
          .split('\n')
          .filter((line) => line.trim().startsWith('-') || line.trim().startsWith('*') || /^\d+\./.test(line.trim()))
          .map((line, idx) => {
            const clean = line.replace(/^[-*\d.]+\s*/, '').trim();
            return {
              id: `kp-${idx}`,
              title: clean.slice(0, 40),
              description: clean,
              category: (clean.toLowerCase().includes('risk')
                ? 'risk'
                : clean.toLowerCase().includes('metric') || /\d+%|\$[\d,]+/.test(clean)
                ? 'metric'
                : clean.toLowerCase().includes('strategic')
                ? 'strategic'
                : 'takeaway') as KeyPoint['category'],
            };
          })
          .filter((k) => k.description.length > 5);

        if (rawBullets.length > 0) {
          setParsedKeyPoints(rawBullets);
        }
      }

      // Extract improvement suggestions if present
      const sugMatch = updated.match(/<suggestions>([\s\S]*?)<\/suggestions>/i) ||
                       updated.match(/## (Improvement Suggestions|Critique)([\s\S]*?)(?=##|$)/i);
      if (sugMatch && sugMatch[1]) {
        const rawSuggs: ImprovementSuggestion[] = sugMatch[1]
          .split('\n')
          .filter((line) => line.trim().startsWith('-') || line.trim().startsWith('*') || /^\d+\./.test(line.trim()))
          .map((line, idx) => {
            const clean = line.replace(/^[-*\d.]+\s*/, '').trim();
            return {
              id: `sug-${idx}`,
              title: clean.slice(0, 40),
              suggestion: clean,
              severity: (clean.toLowerCase().includes('high') || clean.toLowerCase().includes('critical')
                ? 'high'
                : clean.toLowerCase().includes('medium')
                ? 'medium'
                : 'low') as ImprovementSuggestion['severity'],
              category: (clean.toLowerCase().includes('structure')
                ? 'structure'
                : clean.toLowerCase().includes('complete')
                ? 'completeness'
                : clean.toLowerCase().includes('action')
                ? 'actionable'
                : 'clarity') as ImprovementSuggestion['category'],
            };
          })
          .filter((s) => s.suggestion.length > 5);

        if (rawSuggs.length > 0) {
          setParsedSuggestions(rawSuggs);
        }
      }

      return updated;
    });
  }, []);

  // Main SSE streaming execution
  const startSummarization = useCallback(async () => {
    if (!documentText || documentText.trim().length === 0) {
      toast.error('No document text available to summarize.');
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setIsStreaming(true);
    setIsCompleted(false);
    setErrorMessage(null);
    setSummaryMarkdown('');
    setParsedKeyPoints([]);
    setParsedSuggestions([]);
    setStreamingDurationSeconds(0);
    setActiveTab('markdown');

    const startTime = Date.now();
    timerIntervalRef.current = setInterval(() => {
      setStreamingDurationSeconds(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    try {
      const response = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: documentText,
          documentText,
          length: preset,
          preset,
          persona,
          extractKeyPoints,
          extractSuggestions,
          documentMeta: documentMetadata,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        const errText = typeof errJson.error === 'string' ? errJson.error : `Request failed with status ${response.status}`;
        throw new Error(errText);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('Streaming response body is unavailable.');

      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data:')) {
            const dataStr = trimmed.replace(/^data:\s*/, '');
            if (dataStr === '[DONE]') continue;

            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.chunk) {
                parseStreamChunks(parsed.chunk);
              }
              if (parsed.keyPoints && Array.isArray(parsed.keyPoints)) {
                setParsedKeyPoints(parsed.keyPoints);
              }
              if (parsed.suggestions && Array.isArray(parsed.suggestions)) {
                setParsedSuggestions(parsed.suggestions);
              }
              if (parsed.error) {
                throw new Error(parsed.error);
              }
            } catch {
              // Plain text stream fallback
              if (dataStr) parseStreamChunks(dataStr);
            }
          }
        }
      }

      setIsCompleted(true);
      toast.success('Document synthesis complete!');
    } catch (err: unknown) {
      const errObj = err as { name?: string; message?: string };
      if (errObj.name === 'AbortError') {
        toast.info('Summarization stream stopped by user.');
      } else {
        const msg = errObj.message || 'An unexpected error occurred during summarization.';
        setErrorMessage(msg);
        toast.error(msg);
      }
    } finally {
      setIsStreaming(false);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
  }, [documentText, preset, persona, extractKeyPoints, extractSuggestions, parseStreamChunks]);

  // Persist to local history upon completion
  useEffect(() => {
    if (isCompleted && summaryMarkdown && summaryMarkdown.length > 50) {
      try {
        HistoryStorage.save({
          filename: (documentMetadata as any)?.filename || (documentMetadata as any)?.name || 'Document Summary',
          documentText,
          summaryMarkdown,
          preset,
          persona,
          keyPoints: parsedKeyPoints,
          suggestions: parsedSuggestions,
          metadata: documentMetadata,
        });
      } catch (e) {
        console.warn('Failed to auto-save to history vault:', e);
      }
      onComplete?.(summaryMarkdown, parsedKeyPoints, parsedSuggestions);
    }
  }, [isCompleted, summaryMarkdown, preset, persona, parsedKeyPoints, parsedSuggestions, documentMetadata, onComplete]);

  const handleStopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const handleCopySummary = async () => {
    if (!summaryMarkdown) return;
    try {
      await navigator.clipboard.writeText(summaryMarkdown);
      setCopied(true);
      toast.success('Summary copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy summary to clipboard.');
    }
  };

  const handleCopyCard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCardId(id);
      toast.success('Copied takeaway to clipboard!');
      setTimeout(() => setCopiedCardId(null), 2000);
    } catch {
      toast.error('Failed to copy.');
    }
  };

  // Auto-start on mount if requested
  useEffect(() => {
    if (autoStart && documentText && !isStreaming && !isCompleted && !summaryMarkdown) {
      startSummarization();
    }
  }, [autoStart, documentText]);

  // Word metrics calculation
  const wordCount = summaryMarkdown ? summaryMarkdown.split(/\s+/).filter(Boolean).length : 0;
  const estimatedReadTime = Math.max(1, Math.ceil(wordCount / 200));

  // Category badge helpers
  const getKeyPointCategoryBadge = (cat?: KeyPoint['category']) => {
    switch (cat) {
      case 'strategic':
        return 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20';
      case 'metric':
        return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
      case 'risk':
        return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
      case 'operational':
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
      default:
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
    }
  };

  const getSuggestionSeverityBadge = (severity?: ImprovementSuggestion['severity']) => {
    switch (severity) {
      case 'high':
        return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30';
      case 'medium':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30';
      default:
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30';
    }
  };

  return (
    <div className={`w-full rounded-3xl border border-border/80 bg-card/80 backdrop-blur-md p-6 md:p-7 shadow-sm space-y-6 animate-in fade-in duration-300 ${className}`}>
      {/* Header Toolbar: Preset Identity, Metrics & Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-border/60">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-2xs">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base text-foreground tracking-tight">AI Intelligence Summary</h3>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 uppercase tracking-wider shadow-2xs">
                {preset} Mode
              </span>
              {persona && persona !== 'general' && (
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20 uppercase tracking-wider shadow-2xs">
                  {persona} Focus
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
              {isStreaming ? (
                <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  Streaming tokens ({streamingDurationSeconds}s elapsed)...
                </span>
              ) : isCompleted ? (
                <span className="flex items-center gap-2 font-mono">
                  <span>{wordCount.toLocaleString()} words</span>
                  <span>•</span>
                  <span>~{estimatedReadTime} min read</span>
                  <span>•</span>
                  <span>Synthesized in {streamingDurationSeconds}s</span>
                </span>
              ) : (
                <span>Ready to synthesize with Gemini AI streaming</span>
              )}
            </div>
          </div>
        </div>

        {/* Toolbar Buttons */}
        <div className="flex items-center gap-2">
          {isStreaming ? (
            <button
              type="button"
              onClick={handleStopStreaming}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-destructive/40 bg-destructive/10 text-xs font-semibold text-destructive hover:bg-destructive/20 transition-all cursor-pointer shadow-2xs"
            >
              <Square className="h-3.5 w-3.5 fill-current" />
              Stop Generating
            </button>
          ) : (
            <>
              {summaryMarkdown && <AudioSummaryPlayer text={summaryMarkdown} />}

              {summaryMarkdown && (
                <ExportMenu
                  summaryMarkdown={summaryMarkdown}
                  documentMetadata={documentMetadata}
                  preset={preset}
                  keyPoints={parsedKeyPoints}
                  suggestions={parsedSuggestions}
                />
              )}

              {summaryMarkdown && (
                <button
                  type="button"
                  onClick={handleCopySummary}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border/80 bg-card/60 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-all shadow-2xs cursor-pointer"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              )}

              {summaryMarkdown && (
                <button
                  type="button"
                  onClick={startSummarization}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-sm shadow-emerald-500/20 cursor-pointer"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Regenerate
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div className="flex items-start justify-between rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-destructive animate-in fade-in duration-200 shadow-sm">
          <div className="flex items-start gap-3">
            <ShieldAlert className="h-5 w-5 mt-0.5 shrink-0" />
            <div className="space-y-1">
              <h4 className="font-semibold text-sm">Summarization Error</h4>
              <p className="text-xs text-destructive/90">{errorMessage}</p>
            </div>
          </div>
          <button
            onClick={startSummarization}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-all cursor-pointer shadow-xs"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Retry
          </button>
        </div>
      )}

      {/* State 1: Initial Idle State (Before generation started) */}
      {!summaryMarkdown && !isStreaming && !errorMessage && (
        <div className="py-12 text-center space-y-4">
          <div className="p-4 w-fit mx-auto rounded-3xl bg-gradient-to-tr from-emerald-500/15 via-teal-500/10 to-cyan-500/5 text-emerald-500 border border-emerald-500/25 shadow-md shadow-emerald-500/10">
            <Sparkles className="h-8 w-8" />
          </div>
          <div className="space-y-1.5 max-w-md mx-auto">
            <h4 className="text-base font-bold text-foreground tracking-tight">
              Ready to Generate {preset.toUpperCase()} Summary
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Click the button below to stream an AI summary with key takeaways and actionable improvement critiques.
            </p>
          </div>
          <button
            type="button"
            onClick={startSummarization}
            className="inline-flex items-center gap-2 py-3 px-7 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-bold text-sm transition-all duration-300 shadow-md shadow-emerald-500/25 cursor-pointer hover:scale-102"
          >
            <Sparkles className="h-4 w-4" />
            Start AI Summarization Stream
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* State 2 & 3: Streaming or Completed Content */}
      {(summaryMarkdown || isStreaming) && (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-4">
          <TabsList className="grid w-full grid-cols-3 bg-muted/60 p-1 rounded-2xl border border-border/60">
            <TabsTrigger value="markdown" className="flex items-center gap-1.5 text-xs font-bold py-2 rounded-xl">
              <FileText className="h-3.5 w-3.5" />
              <span>Full Summary</span>
            </TabsTrigger>
            <TabsTrigger value="keypoints" className="flex items-center gap-1.5 text-xs font-bold py-2 rounded-xl">
              <TrendingUp className="h-3.5 w-3.5" />
              <span>Key Takeaways</span>
              {parsedKeyPoints.length > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px]">
                  {parsedKeyPoints.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="suggestions" className="flex items-center gap-1.5 text-xs font-bold py-2 rounded-xl">
              <Lightbulb className="h-3.5 w-3.5" />
              <span>Improvement Suggestions</span>
              {parsedSuggestions.length > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px]">
                  {parsedSuggestions.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Dynamic Markdown Stream View */}
          <TabsContent value="markdown" className="space-y-4 outline-none">
            <div className="relative rounded-2xl border border-border/80 bg-card/90 backdrop-blur-sm p-6 md:p-8 min-h-[260px] max-h-[580px] overflow-y-auto leading-relaxed select-text font-sans shadow-inner">
              {summaryMarkdown ? (
                <div className="prose prose-sm dark:prose-invert max-w-none space-y-4 text-foreground/90">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeSanitize]}
                    components={{
                      h1: ({ children }) => (
                        <h1 className="text-xl font-extrabold tracking-tight text-foreground pb-2 border-b border-border/60 mb-4 mt-2">
                          {children}
                        </h1>
                      ),
                      h2: ({ children }) => (
                        <h2 className="text-base font-bold text-emerald-600 dark:text-emerald-400 mt-6 mb-2.5 flex items-center gap-2">
                          {children}
                        </h2>
                      ),
                      h3: ({ children }) => (
                        <h3 className="text-sm font-semibold text-foreground mt-4 mb-1.5">
                          {children}
                        </h3>
                      ),
                      p: ({ children }) => (
                        <p className="text-sm text-foreground/90 leading-relaxed mb-3.5">
                          {children}
                        </p>
                      ),
                      ul: ({ children }) => (
                        <ul className="list-disc pl-5 space-y-2 text-sm text-foreground/90 my-3">
                          {children}
                        </ul>
                      ),
                      ol: ({ children }) => (
                        <ol className="list-decimal pl-5 space-y-2 text-sm text-foreground/90 my-3">
                          {children}
                        </ol>
                      ),
                      li: ({ children }) => (
                        <li className="text-sm leading-relaxed">{children}</li>
                      ),
                      blockquote: ({ children }) => (
                        <blockquote className="border-l-4 border-emerald-500 pl-4 py-2 italic bg-emerald-500/5 rounded-r-xl text-sm text-muted-foreground my-4">
                          {children}
                        </blockquote>
                      ),
                      table: ({ children }) => (
                        <div className="overflow-x-auto my-4 rounded-xl border border-border/80 shadow-xs">
                          <table className="w-full text-xs text-left">{children}</table>
                        </div>
                      ),
                      thead: ({ children }) => (
                        <thead className="bg-muted/70 text-muted-foreground uppercase text-[11px] font-bold border-b border-border/80">
                          {children}
                        </thead>
                      ),
                      tbody: ({ children }) => (
                        <tbody className="divide-y divide-border/60">{children}</tbody>
                      ),
                      tr: ({ children }) => (
                        <tr className="hover:bg-muted/30 transition-colors">{children}</tr>
                      ),
                      th: ({ children }) => <th className="p-3 font-semibold">{children}</th>,
                      td: ({ children }) => <td className="p-3">{children}</td>,
                      strong: ({ children }) => (
                        <strong className="font-bold text-foreground">{children}</strong>
                      ),
                    }}
                  >
                    {summaryMarkdown}
                  </ReactMarkdown>

                  {/* Pulsing Streaming Caret Indicator */}
                  {isStreaming && (
                    <span className="inline-block w-2.5 h-4 ml-1 bg-emerald-500 animate-pulse align-middle rounded-xs" />
                  )}
                  <div ref={contentEndRef} />
                </div>
              ) : (
                /* Shimmering Skeleton Loader while waiting for initial tokens */
                <div className="space-y-4 py-2 animate-pulse">
                  <div className="h-6 bg-muted rounded-xl w-3/4" />
                  <div className="space-y-2.5 pt-2">
                    <div className="h-4 bg-muted/70 rounded-lg w-full" />
                    <div className="h-4 bg-muted/70 rounded-lg w-5/6" />
                    <div className="h-4 bg-muted/70 rounded-lg w-4/6" />
                  </div>
                  <div className="h-5 bg-muted rounded-xl w-1/2 pt-2" />
                  <div className="space-y-2.5">
                    <div className="h-4 bg-muted/70 rounded-lg w-full" />
                    <div className="h-4 bg-muted/70 rounded-lg w-11/12" />
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Tab 2: Structured Key Takeaways Cards */}
          <TabsContent value="keypoints" className="space-y-3 outline-none">
            {parsedKeyPoints.length > 0 ? (
              <div className="grid grid-cols-1 gap-3 max-h-[580px] overflow-y-auto pr-1">
                {parsedKeyPoints.map((kp) => (
                  <div
                    key={kp.id}
                    className="p-4 rounded-2xl border border-border/80 bg-card/90 backdrop-blur-xs space-y-2 transition-all hover:border-emerald-500/40 hover:shadow-sm"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border shadow-2xs ${getKeyPointCategoryBadge(
                          kp.category
                        )}`}
                      >
                        {kp.category || 'takeaway'}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopyCard(kp.description, kp.id)}
                        className="p-1 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors cursor-pointer"
                        title="Copy takeaway"
                      >
                        {copiedCardId === kp.id ? (
                          <Check className="h-3.5 w-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-foreground/90 leading-relaxed font-medium">
                      {kp.description}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-10 text-center rounded-2xl border border-dashed border-border/80 bg-muted/20 text-muted-foreground text-xs space-y-2">
                <CheckCircle2 className="h-6 w-6 mx-auto opacity-50 text-emerald-500" />
                <p>
                  {isStreaming
                    ? 'Extracting key takeaways from live stream...'
                    : 'Key takeaways will appear here once summarized.'}
                </p>
              </div>
            )}
          </TabsContent>

          {/* Tab 3: Structured Actionable Suggestions */}
          <TabsContent value="suggestions" className="space-y-3 outline-none">
            {parsedSuggestions.length > 0 ? (
              <div className="grid grid-cols-1 gap-3 max-h-[580px] overflow-y-auto pr-1">
                {parsedSuggestions.map((sug) => (
                  <div
                    key={sug.id}
                    className="p-4 rounded-2xl border border-border/80 bg-card/90 backdrop-blur-xs space-y-2 transition-all hover:border-amber-500/40 hover:shadow-sm"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shadow-2xs">
                        Category: {sug.category}
                      </span>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border shadow-2xs ${getSuggestionSeverityBadge(
                            sug.severity
                          )}`}
                        >
                          Impact: {sug.severity}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyCard(sug.suggestion, sug.id)}
                          className="p-1 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors cursor-pointer"
                          title="Copy suggestion"
                        >
                          {copiedCardId === sug.id ? (
                            <Check className="h-3.5 w-3.5 text-emerald-500" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-foreground/90 leading-relaxed font-medium">
                      {sug.suggestion}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-10 text-center rounded-2xl border border-dashed border-border/80 bg-muted/20 text-muted-foreground text-xs space-y-2">
                <Lightbulb className="h-6 w-6 mx-auto opacity-50 text-amber-500" />
                <p>
                  {isStreaming
                    ? 'Analyzing document and generating critiques from live stream...'
                    : 'Actionable improvement suggestions will appear here once summarized.'}
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}

      {/* Interactive Document Q&A Assistant */}
      {documentText && documentText.trim().length > 0 && (
        <div className="pt-3 border-t border-border/60">
          <DocumentChat
            documentText={documentText}
            documentName={
              (documentMetadata as any)?.filename ||
              (documentMetadata as any)?.name ||
              'Ingested Document'
            }
          />
        </div>
      )}
    </div>
  );
}
