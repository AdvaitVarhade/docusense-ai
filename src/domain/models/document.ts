/**
 * src/domain/models/document.ts
 * Core domain types and entities for document extraction and processing.
 */

export type DocumentMimeType =
  | 'application/pdf'
  | 'image/png'
  | 'image/jpeg'
  | 'image/jpg'
  | 'image/webp'
  | 'image/tiff'
  | 'text/plain'
  | 'text/markdown';

export type FileType = 'pdf' | 'image' | 'text' | 'markdown';

export type ExtractionEngine = 'unpdf' | 'tesseract' | 'gemini_vlm' | 'raw_text' | 'raw-text' | 'mock';

export interface DocumentMetadata {
  filename: string;
  mimeType: DocumentMimeType | string;
  sizeBytes: number;
  pageCount: number;
  wordCount: number;
  characterCount: number;
  readingTimeMinutes: number;
  extractionEngine: ExtractionEngine;
  extractedAt: string;
  durationMs: number;
}

/**
 * Backwards compatible alias for UI components
 */
export interface DocumentMeta {
  id?: string;
  name: string;
  size: number;
  type: FileType;
  mimeType: string;
  pageCount?: number;
  wordCount: number;
  charCount?: number;
  characterCount: number;
  readingTimeMinutes: number;
  extractedAt: string;
  extractionEngine: ExtractionEngine;
}

export interface ExtractionResult {
  success: true;
  text: string;
  metadata: DocumentMetadata;
  meta: DocumentMeta;
  warnings?: string[];
}

export interface RawDocumentInput {
  fileBuffer: Buffer | Uint8Array;
  filename: string;
  mimeType: string;
  sizeBytes: number;
}

export interface ExtractionOptions {
  forceOcr?: boolean;
  ocrEnginePreference?: 'gemini_vlm' | 'tesseract';
  targetLanguage?: string;
  maxPages?: number;
}
