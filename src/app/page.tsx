'use client';

import React, { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { DocumentUploader } from '@/components/DocumentUploader';
import { PresetSelector } from '@/components/PresetSelector';
import { SummaryViewer } from '@/components/SummaryViewer';
import { ExtractionResult } from '@/domain/models/document';
import { SummaryPreset, KeyPoint, ImprovementSuggestion } from '@/domain/models/summary';
import {
  Sparkles,
  FileText,
  Zap,
  Layers,
  Download,
  ShieldCheck,
  BookOpen,
} from 'lucide-react';

export default function HomePage() {
  const [extractionResult, setExtractionResult] = useState<ExtractionResult | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<SummaryPreset>('medium');
  const [extractKeyPoints, setExtractKeyPoints] = useState<boolean>(true);
  const [extractSuggestions, setExtractSuggestions] = useState<boolean>(true);
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

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground selection:bg-primary/20">
      {/* Top Navigation Bar */}
      <Navbar onResetAll={handleResetAll} hasActiveDocument={!!extractionResult} />

      {/* Main Dashboard Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
        {/* Hero Section */}
        <section className="text-center space-y-4 max-w-3xl mx-auto pt-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold">
            <Sparkles className="h-3.5 w-3.5" />
            <span>AI-Powered Document Intelligence & Streaming Engine</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground">
            Transform Dense Documents into{' '}
            <span className="bg-gradient-to-r from-primary to-violet-600 bg-clip-text text-transparent">
              Actionable Intelligence
            </span>
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            Upload digital PDFs, scanned contracts, receipts, and images. Extract clean layout-aware text with
            multi-tier OCR and stream smart multi-fidelity summaries with key takeaways in seconds.
          </p>
        </section>

        {/* Two-Column Responsive Working Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Extraction Workspace */}
          <div className="lg:col-span-6 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                <span>1. Ingest Document</span>
              </h2>
              <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-muted text-muted-foreground">
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
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                <span>2. AI Summarization & Analysis</span>
              </h2>
              <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-muted text-muted-foreground">
                SSE Stream Active
              </span>
            </div>

            {extractionResult ? (
              <div className="space-y-6 animate-in fade-in duration-300">
                {/* Length Preset Selector & Feature Toggles */}
                <div className="rounded-2xl border border-border bg-card p-5 space-y-3 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Configure Summary Fidelity
                    </span>
                    <span className="text-xs font-medium text-primary">
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
                  extractKeyPoints={extractKeyPoints}
                  extractSuggestions={extractSuggestions}
                  onSummaryComplete={handleSummaryComplete}
                />
              </div>
            ) : (
              /* Empty State Placeholder */
              <div className="rounded-2xl border border-dashed border-border bg-card/40 p-10 text-center flex flex-col items-center justify-center space-y-4 min-h-[360px]">
                <div className="p-4 rounded-full bg-muted text-muted-foreground border border-border">
                  <BookOpen className="h-8 w-8" />
                </div>
                <div className="space-y-1.5 max-w-sm">
                  <h3 className="font-semibold text-base text-foreground">Awaiting Document Ingestion</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Upload or drag a PDF or image into the left panel to begin text extraction and generate smart summaries.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Feature Capabilities Grid */}
        <section className="pt-8 border-t border-border space-y-6">
          <h2 className="text-lg font-bold text-foreground text-center">
            Engineered with Clean Hexagonal Architecture & Tri-Tier OCR
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-xl border border-border bg-card p-4 space-y-2">
              <div className="p-2 w-fit rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <Zap className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-sm text-foreground">Tri-Engine Extraction</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Adaptive routing via unpdf (&lt;50ms), Gemini Flash Vision, and Tesseract.js WASM OCR.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card p-4 space-y-2">
              <div className="p-2 w-fit rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20">
                <Layers className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-sm text-foreground">Multi-Fidelity Summaries</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Seamlessly toggle between Short TL;DR, Medium Executive Synthesis, and Long Deep-Dive breakdowns.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card p-4 space-y-2">
              <div className="p-2 w-fit rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                <Sparkles className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-sm text-foreground">Improvement Critiques</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Evaluates clarity, logical structure, evidence completeness, and provides actionable recommendations.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card p-4 space-y-2">
              <div className="p-2 w-fit rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                <Download className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-sm text-foreground">Multi-Format Export</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                1-click client-side export to Markdown (.md), formatted JSON (.json), clean text (.txt), and clipboard.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card/30 py-6 text-center text-xs text-muted-foreground space-y-1">
        <p className="flex items-center justify-center gap-1.5">
          <ShieldCheck className="h-4 w-4 text-emerald-500" />
          <span>Privacy-First Architecture: Documents processed ephemerally in memory. Zero persistent disk storage.</span>
        </p>
        <p>DocuSense AI • Next.js 15 App Router & Hexagonal Architecture</p>
      </footer>
    </div>
  );
}
