'use client';

import React, { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { DocumentUploader } from '@/components/DocumentUploader';
import { PresetSelector } from '@/components/PresetSelector';
import { SummaryViewer } from '@/components/SummaryViewer';
import { HistoryVault } from '@/components/HistoryVault';
import { ExtractionResult } from '@/domain/models/document';
import { SummaryPreset, SummaryPersona, KeyPoint, ImprovementSuggestion } from '@/domain/models/summary';
import { HistoryEntry } from '@/domain/models/history';
import {
  FileText,
  Zap,
  ShieldCheck,
  Sparkles,
  Layers,
  ArrowRight,
  BookOpen,
} from 'lucide-react';

export default function HomePage() {
  const [extractionResult, setExtractionResult] = useState<ExtractionResult | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<SummaryPreset>('medium');
  const [selectedPersona, setSelectedPersona] = useState<SummaryPersona>('general');
  const [extractKeyPoints, setExtractKeyPoints] = useState<boolean>(true);
  const [extractSuggestions, setExtractSuggestions] = useState<boolean>(true);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [, setSummaryData] = useState<{
    summaryMarkdown: string;
    keyPoints: KeyPoint[];
    suggestions: ImprovementSuggestion[];
  } | null>(null);

  const handleExtractionComplete = (result: ExtractionResult) => {
    setExtractionResult(result);
    setSummaryData(null);
  };

  const handleResetAll = () => {
    setExtractionResult(null);
    setSummaryData(null);
  };

  const handleSummaryComplete = (result: {
    summaryMarkdown: string;
    keyPoints: KeyPoint[];
    suggestions: ImprovementSuggestion[];
  }) => {
    setSummaryData(result);
  };

  const handleRestoreHistoryEntry = (entry: HistoryEntry) => {
    setExtractionResult({
      success: true,
      text: entry.documentText,
      metadata: entry.documentMeta as any,
      meta: entry.documentMeta as any,
    });
    setSelectedPreset(entry.preset);
    if (entry.persona) {
      setSelectedPersona(entry.persona);
    }
    setSummaryData({
      summaryMarkdown: entry.summaryMarkdown,
      keyPoints: entry.keyPoints,
      suggestions: entry.suggestions,
    });
  };

  return (
    <div className="relative min-h-screen flex flex-col bg-background text-foreground selection:bg-emerald-500/20 overflow-x-hidden">
      {/* Ambient Radial Background Glow Highlights */}
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="fixed top-1/3 right-10 w-96 h-96 bg-teal-500/5 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="fixed bottom-10 left-10 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Top Navigation Bar */}
      <Navbar
        onResetAll={handleResetAll}
        onOpenHistory={() => setIsHistoryOpen(true)}
        hasActiveDocument={!!extractionResult}
      />

      {/* Main Dashboard Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Two-Column Responsive Working Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Extraction Workspace */}
          <div className="lg:col-span-6 space-y-6">
            <div className="flex items-center justify-between pb-1">
              <h2 className="text-lg font-extrabold text-foreground flex items-center gap-2.5 tracking-tight">
                <div className="p-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-2xs">
                  <FileText className="h-4 w-4" />
                </div>
                <span>1. Ingest Document</span>
              </h2>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-2xs">
                Tri-Tier OCR Active
              </span>
            </div>

            <DocumentUploader
              onExtractionComplete={handleExtractionComplete}
              onReset={handleResetAll}
            />
          </div>

          {/* Right Column: AI Analysis & Summary Workspace */}
          <div className="lg:col-span-6 space-y-6">
            <div className="flex items-center justify-between pb-1">
              <h2 className="text-lg font-extrabold text-foreground flex items-center gap-2.5 tracking-tight">
                <div className="p-1.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 shadow-2xs">
                  <Zap className="h-4 w-4" />
                </div>
                <span>2. AI Summarization & Analysis</span>
              </h2>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 shadow-2xs">
                SSE Stream Active
              </span>
            </div>

            {extractionResult ? (
              <div className="space-y-6 animate-in fade-in duration-300">
                {/* Length Preset & Persona Selector */}
                <div className="rounded-3xl border border-border/80 bg-card/80 backdrop-blur-md p-6 space-y-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Layers className="h-3.5 w-3.5 text-emerald-500" />
                      Configure Summary Fidelity & Persona
                    </span>
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                      {selectedPreset === 'short'
                        ? '~150 words'
                        : selectedPreset === 'medium'
                        ? '~400 words'
                        : '~900 words'}
                    </span>
                  </div>
                  <PresetSelector
                    value={selectedPreset}
                    onChange={setSelectedPreset}
                    persona={selectedPersona}
                    onPersonaChange={setSelectedPersona}
                    extractKeyPoints={extractKeyPoints}
                    onExtractKeyPointsChange={setExtractKeyPoints}
                    extractSuggestions={extractSuggestions}
                    onExtractSuggestionsChange={setExtractSuggestions}
                  />
                </div>

                {/* Real-time Streaming Summary Viewer */}
                <SummaryViewer
                  documentText={extractionResult.text}
                  documentMetadata={extractionResult.metadata || extractionResult.meta}
                  preset={selectedPreset}
                  persona={selectedPersona}
                  extractKeyPoints={extractKeyPoints}
                  extractSuggestions={extractSuggestions}
                  onComplete={(md, kp, sug) => handleSummaryComplete({ summaryMarkdown: md, keyPoints: kp, suggestions: sug })}
                />
              </div>
            ) : (
              /* Empty State Placeholder */
              <div className="rounded-3xl border-2 border-dashed border-border/80 bg-card/40 backdrop-blur-xs p-10 text-center flex flex-col items-center justify-center space-y-4 min-h-[380px] shadow-2xs">
                <div className="p-4 rounded-3xl bg-muted/80 text-muted-foreground border border-border/80 shadow-inner">
                  <BookOpen className="h-8 w-8" />
                </div>
                <div className="space-y-1.5 max-w-sm">
                  <h3 className="font-bold text-base text-foreground tracking-tight">Awaiting Document Ingestion</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Upload or drag a PDF or image into the left panel to begin text extraction and stream intelligent multi-fidelity summaries.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 font-semibold pt-1">
                  <span>Supported formats on left</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Local History Vault Sheet / Modal */}
      <HistoryVault
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        onRestoreEntry={handleRestoreHistoryEntry}
      />

      {/* Footer */}
      <footer className="border-t border-border/60 bg-card/40 backdrop-blur-md py-6 text-center text-xs text-muted-foreground space-y-1 mt-auto">
        <p className="flex items-center justify-center gap-1.5">
          <ShieldCheck className="h-4 w-4 text-emerald-500" />
          <span>Privacy-First Architecture: Documents processed ephemerally in memory. Zero persistent disk storage.</span>
        </p>
        <p className="text-[11px] opacity-75">DocuSense AI • Next.js 15 App Router & Hexagonal Architecture</p>
      </footer>
    </div>
  );
}
