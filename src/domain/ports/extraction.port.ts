/**
 * src/domain/ports/extraction.port.ts
 * Hexagonal architecture ports (interfaces) for document extraction engines.
 */

import { DocumentMetadata, ExtractionEngine, RawDocumentInput, ExtractionOptions, ExtractionResult } from '../models/document';

export interface AdapterExtractionOutput {
  text: string;
  pageCount: number;
  engine: ExtractionEngine;
  confidence?: number;
  warnings?: string[];
  rawMeta?: Record<string, unknown>;
}

export interface DocumentExtractorPort {
  readonly engineName: ExtractionEngine;

  /**
   * Evaluates if this adapter can process the given MIME type or file format.
   */
  supports(mimeType: string): boolean;

  /**
   * Executes extraction on the provided binary input.
   */
  extract(input: RawDocumentInput, options?: ExtractionOptions): Promise<AdapterExtractionOutput>;
}

export interface ExtractDocumentUseCasePort {
  execute(input: RawDocumentInput, options?: ExtractionOptions): Promise<ExtractionResult>;
}

/**
 * Interface alias for adapter engines
 */
export interface IExtractionEngine extends DocumentExtractorPort {}
