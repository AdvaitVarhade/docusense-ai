'use client';

import React, { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { DocumentUploader } from '@/components/DocumentUploader';
import { PresetSelector } from '@/components/PresetSelector';
import { SummaryViewer } from '@/components/SummaryViewer';
import { ExtractionResult } from '@/domain/models/document';
import { SummaryPreset, KeyPoint, ImprovementSuggestion } from '@/domain/models/summary';
import {
  FileText,
  Zap,
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
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
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
