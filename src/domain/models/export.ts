/**
 * src/domain/models/export.ts
 * Core domain types and interfaces for multi-format document exporting.
 */

import { DocumentMetadata } from './document';
import { DocumentAnalysisResult, SummaryPreset, KeyPoint, ImprovementSuggestion } from './summary';

export type ExportFormat = 'markdown' | 'json' | 'text' | 'pdf' | 'clipboard';

export interface ExportPayload {
  format: ExportFormat;
  filename: string;
  documentMeta: DocumentMetadata;
  summaryMarkdown: string;
  keyPoints?: KeyPoint[];
  suggestions?: ImprovementSuggestion[];
  extractedText?: string;
  preset?: SummaryPreset;
  exportedAt: string;
}

export interface ExportResult {
  format: ExportFormat;
  content: string;
  mimeType: string;
  suggestedFilename: string;
}
