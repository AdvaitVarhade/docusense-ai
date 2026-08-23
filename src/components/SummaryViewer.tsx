'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import {
  Sparkles,
  Copy,
  Check,
  RotateCcw,
  Square,
  FileText,
  Lightbulb,
  CheckCircle2,
  TrendingUp,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';
import { SummaryPreset, KeyPoint, ImprovementSuggestion } from '@/domain/models/summary';
import { DocumentMetadata, DocumentMeta } from '@/domain/models/document';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { ExportMenu } from '@/components/ExportMenu';

export interface SummaryViewerProps {
  documentText: string;
  documentMetadata?: DocumentMetadata | DocumentMeta;
  preset: SummaryPreset;
  extractKeyPoints?: boolean;
  extractSuggestions?: boolean;
  autoStart?: boolean;
  onSummaryComplete?: (result: {
    summaryMarkdown: string;
    keyPoints: KeyPoint[];
    suggestions: ImprovementSuggestion[];
  }) => void;
  onError?: (error: string) => void;
  onReset?: () => void;
  className?: string;
}

export function SummaryViewer({
  documentText,
  documentMetadata,
  preset = 'medium',
  extractKeyPoints = true,
  extractSuggestions = true,
  autoStart = false,
  onSummaryComplete,
  onError,
  onReset,
  className = '',
}: SummaryViewerProps) {
  const [summaryMarkdown, setSummaryMarkdown] = useState<string>('');
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('markdown');
  const [copied, setCopied] = useState<boolean>(false);
  const [streamingDurationSeconds, setStreamingDurationSeconds] = useState<number>(0);
  const [parsedKeyPoints, setParsedKeyPoints] = useState<KeyPoint[]>([]);
  const [parsedSuggestions, setParsedSuggestions] = useState<ImprovementSuggestion[]>([]);

  const abortControllerRef = useRef<AbortController | null>(null);
  const streamStartTimeRef = useRef<number>(0);
  const durationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const contentEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of stream while generating
  useEffect(() => {
    if (isStreaming && contentEndRef.current) {
      contentEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [summaryMarkdown, isStreaming]);

  // Robust Markdown Parser: Extracts structured Key Points & Suggestions from streamed markdown
  const extractStructuredSections = useCallback((markdown: string) => {
    const keyPoints: KeyPoint[] = [];
    const suggestions: ImprovementSuggestion[] = [];

    // Extract Key Takeaways section
    const takeawaysMatch = markdown.match(/##\s+(?:Key Takeaways|Key Points|Core Takeaways)([\s\S]*?)(?:##|$)/i);
    if (takeawaysMatch && takeawaysMatch[1]) {
      const lines = takeawaysMatch[1]
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.startsWith('-') || l.startsWith('*') || /^\d+\./.test(l));

      lines.forEach((line, idx) => {
        const cleanText = line.replace(/^[-*]|\d+\.\s*/, '').trim();
        if (cleanText) {
          let category: KeyPoint['category'] = 'takeaway';
          if (/metric|percent|%|\d+x|\$|reduction|growth|speedup|epoch/i.test(cleanText)) category = 'metric';
          else if (/risk|bottleneck|decoherence|vulnerability|limit/i.test(cleanText)) category = 'risk';
          else if (/strategic|roadmap|architecture|governance|milestone/i.test(cleanText)) category = 'strategic';
          else if (/operational|deployment|latency|throughput|container/i.test(cleanText)) category = 'operational';

          keyPoints.push({
            id: `kp-${idx + 1}`,
            title: cleanText.length > 60 ? cleanText.slice(0, 60) + '...' : cleanText,
            description: cleanText,
            category,
          });
        }
      });
    }

    // Extract Improvement Suggestions section
    const suggestionsMatch = markdown.match(/##\s+(?:Improvement Suggestions|Recommendations|Critique)([\s\S]*?)(?:##|$)/i);
    if (suggestionsMatch && suggestionsMatch[1]) {
      const lines = suggestionsMatch[1]
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.startsWith('-') || l.startsWith('*') || /^\d+\./.test(l));

      lines.forEach((line, idx) => {
        const cleanText = line.replace(/^[-*]|\d+\.\s*/, '').trim();
        if (cleanText) {
          let category: ImprovementSuggestion['category'] = 'clarity';
          let severity: ImprovementSuggestion['severity'] = 'medium';

          if (/clarity|readable|jargon|ambiguous/i.test(cleanText)) category = 'clarity';
          else if (/structure|hierarchy|organization|section|appendix/i.test(cleanText)) category = 'structure';
          else if (/complete|missing|unsubstantiated|baseline|benchmark/i.test(cleanText)) {
            category = 'completeness';
            severity = 'high';
          } else if (/action|recommend|implement|standardize|pipeline/i.test(cleanText)) category = 'actionable';

          suggestions.push({
            id: `sug-${idx + 1}`,
            title: cleanText.length > 50 ? cleanText.slice(0, 50) + '...' : cleanText,
            suggestion: cleanText,
            category,
            severity,
          });
        }
      });
    }

    setParsedKeyPoints(keyPoints);
    setParsedSuggestions(suggestions);
    return { keyPoints, suggestions };
  }, []);

  // Main SSE Streaming Trigger
  const startSummarization = useCallback(async () => {
    if (!documentText || documentText.trim().length === 0) {
      toast.error('No document text provided for summarization.');
      return;
    }

    // Reset state
    setSummaryMarkdown('');
    setErrorMessage(null);
    setIsStreaming(true);
    setIsCompleted(false);
    setStreamingDurationSeconds(0);
    setActiveTab('markdown');

    abortControllerRef.current = new AbortController();
    streamStartTimeRef.current = Date.now();

    // Start elapsed duration ticker
    durationTimerRef.current = setInterval(() => {
      setStreamingDurationSeconds(Math.floor((Date.now() - streamStartTimeRef.current) / 1000));
    }, 500);

    let accumulatedText = '';

    try {
      const response = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: documentText,
          length: preset,
          extractKeyPoints,
          extractSuggestions,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || `Summarization failed with status ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Readable stream not supported or empty response body.');
      }

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
          if (!trimmed || trimmed.startsWith(':')) continue; // SSE comment or heartbeat

          if (trimmed.startsWith('data:')) {
            const dataContent = trimmed.slice(5).trim();

            if (dataContent === '[DONE]') {
              break;
            }

            try {
              const parsed = JSON.parse(dataContent);
              if (parsed.chunk) {
                accumulatedText += parsed.chunk;
                setSummaryMarkdown(accumulatedText);
              } else if (parsed.text) {
                accumulatedText += parsed.text;
                setSummaryMarkdown(accumulatedText);
              }
            } catch {
              // Fallback: If not JSON, treat dataContent as plain text chunk
              accumulatedText += dataContent;
              setSummaryMarkdown(accumulatedText);
            }
          }
        }
      }

      // Finalize completed stream
      setIsCompleted(true);
      const { keyPoints, suggestions } = extractStructuredSections(accumulatedText);
      onSummaryComplete?.({
        summaryMarkdown: accumulatedText,
        keyPoints,
        suggestions,
      });
      const words = accumulatedText.split(/\s+/).filter(Boolean).length;
      toast.success(`Generated ${preset} summary (${words} words)!`);
    } catch (err: unknown) {
      const errObj = err as { name?: string; message?: string };
      if (errObj.name === 'AbortError') {
        toast.info('Summarization stopped by user.');
        setIsCompleted(true);
        extractStructuredSections(accumulatedText);
      } else {
        const msg = errObj.message || 'Failed to generate AI summary.';
        setErrorMessage(msg);
        onError?.(msg);
        toast.error(msg);
      }
    } finally {
      setIsStreaming(false);
      if (durationTimerRef.current) {
        clearInterval(durationTimerRef.current);
      }
      abortControllerRef.current = null;
    }
  }, [documentText, preset, extractKeyPoints, extractSuggestions, extractStructuredSections, onSummaryComplete, onError]);

  // Stop Streaming Handler
  const handleStopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  // 1-Click Copy Handler
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
    <div className={`w-full rounded-2xl border border-border bg-card p-6 shadow-sm space-y-6 animate-in fade-in duration-300 ${className}`}>
      {/* Header Toolbar: Preset Identity, Metrics & Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base text-foreground">AI Intelligence Summary</h3>
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 uppercase tracking-wider">
                {preset} Mode
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
              {isStreaming ? (
                <span className="flex items-center gap-1.5 text-primary font-medium">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                  </span>
                  Streaming tokens ({streamingDurationSeconds}s elapsed)...
                </span>
              ) : isCompleted ? (
                <span className="flex items-center gap-2">
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
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-destructive/40 bg-destructive/10 text-xs font-medium text-destructive hover:bg-destructive/20 transition-colors cursor-pointer"
            >
              <Square className="h-3.5 w-3.5 fill-current" />
              Stop Generating
            </button>
          ) : (
            <>
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
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              )}

              {summaryMarkdown && (
                <button
                  type="button"
                  onClick={startSummarization}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-all shadow-sm shadow-primary/20 cursor-pointer"
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
        <div className="flex items-start justify-between rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-destructive animate-in fade-in duration-200">
          <div className="flex items-start gap-3">
            <ShieldAlert className="h-5 w-5 mt-0.5 shrink-0" />
            <div className="space-y-1">
              <h4 className="font-semibold text-sm">Summarization Error</h4>
              <p className="text-xs text-destructive/90">{errorMessage}</p>
            </div>
          </div>
          <button
            onClick={startSummarization}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Retry
          </button>
        </div>
      )}

      {/* State 1: Initial Idle State (Before generation started) */}
      {!summaryMarkdown && !isStreaming && !errorMessage && (
        <div className="py-10 text-center space-y-4">
          <div className="p-4 w-fit mx-auto rounded-full bg-primary/10 text-primary border border-primary/20">
            <Sparkles className="h-8 w-8" />
          </div>
          <div className="space-y-1.5 max-w-md mx-auto">
            <h4 className="text-base font-semibold text-foreground">
              Ready to Generate {preset.toUpperCase()} Summary
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Click the button below to stream an AI summary with key takeaways and actionable improvement critiques.
            </p>
          </div>
          <button
            type="button"
            onClick={startSummarization}
            className="inline-flex items-center gap-2 py-2.5 px-6 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-all shadow-md shadow-primary/25 cursor-pointer"
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
          <TabsList className="grid w-full grid-cols-3 bg-muted/60 p-1 rounded-xl">
            <TabsTrigger value="markdown" className="flex items-center gap-1.5 text-xs font-semibold">
              <FileText className="h-3.5 w-3.5" />
              <span>Full Summary</span>
            </TabsTrigger>
            <TabsTrigger value="keypoints" className="flex items-center gap-1.5 text-xs font-semibold">
              <TrendingUp className="h-3.5 w-3.5" />
              <span>Key Takeaways</span>
              {parsedKeyPoints.length > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full bg-primary/20 text-primary text-[10px]">
                  {parsedKeyPoints.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="suggestions" className="flex items-center gap-1.5 text-xs font-semibold">
              <Lightbulb className="h-3.5 w-3.5" />
              <span>Improvement Suggestions</span>
              {parsedSuggestions.length > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full bg-primary/20 text-primary text-[10px]">
                  {parsedSuggestions.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Dynamic Markdown Stream View */}
          <TabsContent value="markdown" className="space-y-4 outline-none">
            <div className="relative rounded-xl border border-border bg-card/80 p-6 min-h-[260px] max-h-[580px] overflow-y-auto leading-relaxed select-text font-sans">
              {summaryMarkdown ? (
                <div className="prose prose-sm dark:prose-invert max-w-none space-y-4">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeSanitize]}
                    components={{
                      h1: ({ children }) => (
                        <h1 className="text-xl font-extrabold tracking-tight text-foreground pb-2 border-b border-border mb-3 mt-1">
                          {children}
                        </h1>
                      ),
                      h2: ({ children }) => (
                        <h2 className="text-base font-bold text-foreground mt-5 mb-2 flex items-center gap-2 text-primary">
                          {children}
                        </h2>
                      ),
                      h3: ({ children }) => (
                        <h3 className="text-sm font-semibold text-foreground mt-3 mb-1">
                          {children}
                        </h3>
                      ),
                      p: ({ children }) => (
                        <p className="text-sm text-foreground/90 leading-relaxed mb-3">
                          {children}
                        </p>
                      ),
                      ul: ({ children }) => (
                        <ul className="list-disc pl-5 space-y-1.5 text-sm text-foreground/90 my-2">
                          {children}
                        </ul>
                      ),
                      ol: ({ children }) => (
                        <ol className="list-decimal pl-5 space-y-1.5 text-sm text-foreground/90 my-2">
                          {children}
                        </ol>
                      ),
                      li: ({ children }) => (
                        <li className="text-sm leading-relaxed">{children}</li>
                      ),
                      blockquote: ({ children }) => (
                        <blockquote className="border-l-4 border-primary pl-4 py-1 italic bg-muted/30 rounded-r-lg text-sm text-muted-foreground my-3">
                          {children}
                        </blockquote>
                      ),
                      table: ({ children }) => (
                        <div className="overflow-x-auto my-4 rounded-lg border border-border">
                          <table className="w-full text-xs text-left">{children}</table>
                        </div>
                      ),
                      thead: ({ children }) => (
                        <thead className="bg-muted/60 text-muted-foreground uppercase text-[11px] font-semibold border-b border-border">
                          {children}
                        </thead>
                      ),
                      tbody: ({ children }) => (
                        <tbody className="divide-y divide-border">{children}</tbody>
                      ),
                      tr: ({ children }) => (
                        <tr className="hover:bg-muted/30 transition-colors">{children}</tr>
                      ),
                      th: ({ children }) => <th className="p-2.5 font-semibold">{children}</th>,
                      td: ({ children }) => <td className="p-2.5">{children}</td>,
                      strong: ({ children }) => (
                        <strong className="font-semibold text-foreground">{children}</strong>
                      ),
                    }}
                  >
                    {summaryMarkdown}
                  </ReactMarkdown>

                  {/* Pulsing Streaming Caret Indicator */}
                  {isStreaming && (
                    <span className="inline-block w-2.5 h-4 ml-1 bg-primary animate-pulse align-middle rounded-sm" />
                  )}
                  <div ref={contentEndRef} />
                </div>
              ) : (
                /* Shimmering Skeleton Loader while waiting for initial tokens */
                <div className="space-y-4 py-2 animate-pulse">
                  <div className="h-6 bg-muted rounded-md w-3/4" />
                  <div className="space-y-2 pt-2">
                    <div className="h-4 bg-muted/70 rounded w-full" />
                    <div className="h-4 bg-muted/70 rounded w-5/6" />
                    <div className="h-4 bg-muted/70 rounded w-4/6" />
                  </div>
                  <div className="h-5 bg-muted rounded w-1/2 pt-2" />
                  <div className="space-y-2">
                    <div className="h-4 bg-muted/70 rounded w-full" />
                    <div className="h-4 bg-muted/70 rounded w-11/12" />
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
                    className="p-4 rounded-xl border border-border bg-card/90 space-y-2 transition-all hover:border-primary/40 shadow-xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${getKeyPointCategoryBadge(
                          kp.category
                        )}`}
                      >
                        {kp.category || 'takeaway'}
                      </span>
                    </div>
                    <p className="text-xs text-foreground/90 leading-relaxed font-medium">
                      {kp.description}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center rounded-xl border border-dashed border-border bg-muted/20 text-muted-foreground text-xs space-y-2">
                <CheckCircle2 className="h-6 w-6 mx-auto opacity-50" />
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
                    className="p-4 rounded-xl border border-border bg-card/90 space-y-2 transition-all hover:border-primary/40 shadow-xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                        Category: {sug.category}
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getSuggestionSeverityBadge(
                          sug.severity
                        )}`}
                      >
                        Impact: {sug.severity}
                      </span>
                    </div>
                    <p className="text-xs text-foreground/90 leading-relaxed font-medium">
                      {sug.suggestion}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center rounded-xl border border-dashed border-border bg-muted/20 text-muted-foreground text-xs space-y-2">
                <Lightbulb className="h-6 w-6 mx-auto opacity-50" />
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
    </div>
  );
}
