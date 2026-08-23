/**
 * src/domain/ports/summarization.port.ts
 * Hexagonal architecture ports for AI summarization engines and application use cases.
 */

import { DocumentMetadata, DocumentMeta } from '../models/document';
import { SummaryPreset, DocumentAnalysisResult } from '../models/summary';

export interface SummarizationOptions {
  text: string;
  meta?: Partial<DocumentMetadata> | DocumentMeta;
  preset: SummaryPreset;
  extractKeyPoints?: boolean;
  extractSuggestions?: boolean;
}

export interface ISummarizationEngine {
  readonly providerName: string;
  isConfigured?(): boolean;
  streamSummary(options: SummarizationOptions): Promise<ReadableStream<Uint8Array>>;
  generateStructuredAnalysis(options: SummarizationOptions): Promise<DocumentAnalysisResult>;
}

export interface SummarizeDocumentUseCasePort {
  executeStream(options: SummarizationOptions): Promise<ReadableStream<Uint8Array>>;
  executeStructured(options: SummarizationOptions): Promise<DocumentAnalysisResult>;
}
