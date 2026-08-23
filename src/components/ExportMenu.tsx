'use client';

import React, { useState } from 'react';
import {
  Download,
  Copy,
  Check,
  FileCode,
  FileText,
  Braces,
  ChevronDown,
} from 'lucide-react';
import { ExportFormatter } from '@/application/services/ExportFormatter';
import { SummaryPreset, KeyPoint, ImprovementSuggestion } from '@/domain/models/summary';
import { DocumentMetadata, DocumentMeta } from '@/domain/models/document';
import { toast } from 'sonner';

export interface ExportMenuProps {
  summaryMarkdown: string;
  documentMetadata?: DocumentMetadata | DocumentMeta;
  preset: SummaryPreset;
  keyPoints?: KeyPoint[];
  suggestions?: ImprovementSuggestion[];
  disabled?: boolean;
  className?: string;
}

export function ExportMenu({
  summaryMarkdown,
  documentMetadata,
  preset = 'medium',
  keyPoints = [],
  suggestions = [],
  disabled = false,
  className = '',
}: ExportMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const getPayload = () => {
    return ExportFormatter.createExportPayload({
      metadata: documentMetadata,
      preset,
      summaryMarkdown,
      keyPoints,
      suggestions,
    });
  };

  const originalFilename = (documentMetadata as any)?.filename || (documentMetadata as any)?.name || 'document.pdf';

  // Export 1: Markdown (.md)
  const handleExportMarkdown = () => {
    try {
      const payload = getPayload();
      const content = ExportFormatter.formatAsMarkdown(payload);
      const filename = ExportFormatter.sanitizeExportFilename(originalFilename, '.md');
      ExportFormatter.downloadFile(content, filename, 'text/markdown;charset=utf-8');
      toast.success(`Exported ${filename}`);
      setIsOpen(false);
    } catch {
      toast.error('Failed to export as Markdown.');
    }
  };

  // Export 2: JSON (.json)
  const handleExportJson = () => {
    try {
      const payload = getPayload();
      const content = ExportFormatter.formatAsJson(payload);
      const filename = ExportFormatter.sanitizeExportFilename(originalFilename, '.json');
      ExportFormatter.downloadFile(content, filename, 'application/json;charset=utf-8');
      toast.success(`Exported ${filename}`);
      setIsOpen(false);
    } catch {
      toast.error('Failed to export as JSON.');
    }
  };

  // Export 3: Plain Text (.txt)
  const handleExportText = () => {
    try {
      const payload = getPayload();
      const content = ExportFormatter.formatAsPlainText(payload);
      const filename = ExportFormatter.sanitizeExportFilename(originalFilename, '.txt');
      ExportFormatter.downloadFile(content, filename, 'text/plain;charset=utf-8');
      toast.success(`Exported ${filename}`);
      setIsOpen(false);
    } catch {
      toast.error('Failed to export as Plain Text.');
    }
  };

  // Export 4: Copy to Clipboard
  const handleCopyClipboard = async () => {
    try {
      const payload = getPayload();
      const content = ExportFormatter.formatForClipboard(payload);
      await navigator.clipboard.writeText(content);
      setCopied(true);
      toast.success('Complete summary & metadata copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
      setIsOpen(false);
    } catch {
      toast.error('Failed to copy to clipboard.');
    }
  };

  if (!summaryMarkdown) return null;

  return (
    <div className={`relative inline-block text-left ${className}`}>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          disabled={disabled}
          onClick={() => setIsOpen((prev) => !prev)}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg border border-border bg-card text-xs font-semibold text-foreground hover:bg-muted hover:border-primary/40 transition-all shadow-xs cursor-pointer ${
            disabled ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          aria-haspopup="true"
          aria-expanded={isOpen}
        >
          <Download className="h-3.5 w-3.5 text-primary" />
          <span>Export Summary</span>
          <ChevronDown className={`h-3 w-3 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Dropdown Menu Modal / Popover */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-56 rounded-xl border border-border bg-popover p-1.5 text-popover-foreground shadow-lg z-50 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground border-b border-border mb-1">
              Export Formats
            </div>

            {/* Markdown (.md) */}
            <button
              type="button"
              onClick={handleExportMarkdown}
              className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs hover:bg-muted text-foreground transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <FileCode className="h-4 w-4 text-primary" />
                <div className="text-left">
                  <div className="font-medium">Markdown</div>
                  <div className="text-[10px] text-muted-foreground">.md with headers & GFM</div>
                </div>
              </div>
              <span className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">.md</span>
            </button>

            {/* Plain Text (.txt) */}
            <button
              type="button"
              onClick={handleExportText}
              className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs hover:bg-muted text-foreground transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <FileText className="h-4 w-4 text-emerald-500" />
                <div className="text-left">
                  <div className="font-medium">Plain Text</div>
                  <div className="text-[10px] text-muted-foreground">.txt clean text layout</div>
                </div>
              </div>
              <span className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">.txt</span>
            </button>

            {/* JSON (.json) */}
            <button
              type="button"
              onClick={handleExportJson}
              className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs hover:bg-muted text-foreground transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Braces className="h-4 w-4 text-violet-500" />
                <div className="text-left">
                  <div className="font-medium">Structured JSON</div>
                  <div className="text-[10px] text-muted-foreground">.json schema compliant</div>
                </div>
              </div>
              <span className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">.json</span>
            </button>

            <div className="border-t border-border my-1" />

            {/* Copy to Clipboard */}
            <button
              type="button"
              onClick={handleCopyClipboard}
              className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs hover:bg-muted text-foreground transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4 text-amber-500" />}
                <div className="text-left">
                  <div className="font-medium">{copied ? 'Copied!' : 'Copy to Clipboard'}</div>
                  <div className="text-[10px] text-muted-foreground">Formatted Markdown string</div>
                </div>
              </div>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
