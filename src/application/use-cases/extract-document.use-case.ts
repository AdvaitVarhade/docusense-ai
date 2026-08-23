/**
 * src/application/use-cases/extract-document.use-case.ts
 * Core Application Use Case: Orchestrating multi-tier extraction, fallback routing, and normalization.
 */

import {
  RawDocumentInput,
  ExtractionOptions,
  ExtractionResult,
  DocumentMetadata,
  DocumentMeta,
  FileType,
} from '@/domain/models/document';
import {
  ExtractDocumentUseCasePort,
  DocumentExtractorPort,
  AdapterExtractionOutput,
} from '@/domain/ports/extraction.port';
import { UnpdfAdapter, unpdfAdapter } from '@/infrastructure/adapters/unpdf-adapter';
import { TesseractAdapter, tesseractAdapter } from '@/infrastructure/adapters/tesseract-adapter';
import { GeminiVlmAdapter, geminiVlmAdapter } from '@/infrastructure/adapters/gemini-vlm-adapter';
import {
  EmptyDocumentError,
  PayloadTooLargeError,
  InvalidDocumentError,
  ExtractionError,
  CorruptedDocumentError,
} from '@/domain/errors/extraction.error';
import { MAX_FILE_SIZE_BYTES, ALLOWED_MIME_TYPES } from '@/domain/schemas/extraction.schema';

export class ExtractDocumentUseCase implements ExtractDocumentUseCasePort {
  constructor(
    private readonly pdfAdapter: DocumentExtractorPort = unpdfAdapter,
    private readonly vlmAdapter: GeminiVlmAdapter = geminiVlmAdapter,
    private readonly ocrAdapter: DocumentExtractorPort = tesseractAdapter
  ) {}

  public async execute(
    input: RawDocumentInput,
    options?: ExtractionOptions
  ): Promise<ExtractionResult> {
    const startTime = performance.now();

    // 1. Basic Boundary Validations
    if (!input.fileBuffer || input.fileBuffer.length === 0) {
      throw new EmptyDocumentError();
    }

    if (input.sizeBytes > MAX_FILE_SIZE_BYTES || input.fileBuffer.length > MAX_FILE_SIZE_BYTES) {
      throw new PayloadTooLargeError();
    }

    const mime = (input.mimeType || '').toLowerCase();
    const isAllowedMime = ALLOWED_MIME_TYPES.some((allowed) =>
      mime.includes(allowed) || allowed.includes(mime)
    );

    const ext = input.filename.split('.').pop()?.toLowerCase() || '';
    const isAllowedExt = ['pdf', 'png', 'jpg', 'jpeg', 'webp', 'tiff', 'txt', 'md'].includes(ext);

    if (!isAllowedMime && !isAllowedExt) {
      throw new InvalidDocumentError(
        `Unsupported document format '${input.mimeType || ext}'. Allowed formats: PDF, PNG, JPG, JPEG, WEBP, TIFF, TXT, MD.`
      );
    }

    let extractionOutput: AdapterExtractionOutput;
    const warnings: string[] = [];

    // 2. Routing Logic
    // Case A: Text / Markdown file
    if (mime.includes('text/plain') || mime.includes('text/markdown') || ext === 'txt' || ext === 'md') {
      const rawText = Buffer.from(input.fileBuffer).toString('utf-8');
      extractionOutput = {
        text: rawText,
        pageCount: 1,
        engine: 'raw_text',
      };
    }
    // Case B: PDF Document
    else if (mime.includes('application/pdf') || ext === 'pdf') {
      try {
        // Step 1: Fast Digital Extraction via Tier 1 unpdf
        const tier1Output = await this.pdfAdapter.extract(input, options);

        // Evaluate Text Density
        const words = tier1Output.text.split(/\s+/).filter(Boolean);
        const wordCount = words.length;
        const wordsPerPage = wordCount / Math.max(tier1Output.pageCount, 1);

        // If dense digital text is found, accept Tier 1
        if (wordCount >= 20 && wordsPerPage >= 10 && !options?.forceOcr) {
          extractionOutput = tier1Output;
        } else {
          // Sparse text detected -> Scanned PDF detected! Attempt OCR fallback
          warnings.push('Low embedded text density detected. Document appears to be a scanned PDF.');

          let fallbackSuccess = false;

          // Attempt Tier 2: Gemini VLM Multimodal OCR
          if (this.vlmAdapter.isConfigured()) {
            try {
              const tier2Output = await this.vlmAdapter.extract(input, options);
              if (tier2Output.text && tier2Output.text.trim().length > tier1Output.text.trim().length) {
                extractionOutput = tier2Output;
                fallbackSuccess = true;
              }
            } catch (vlmErr) {
              warnings.push(
                `VLM OCR failed, falling back to local OCR: ${
                  vlmErr instanceof Error ? vlmErr.message : String(vlmErr)
                }`
              );
            }
          }

          // If VLM didn't succeed, fallback to digital extracted text or Tesseract if image
          if (!fallbackSuccess) {
            extractionOutput = tier1Output;
          }
        }
      } catch (pdfErr) {
        // If unpdf threw and VLM is configured, try VLM as fallback
        if (this.vlmAdapter.isConfigured() && !(pdfErr instanceof EmptyDocumentError)) {
          try {
            extractionOutput = await this.vlmAdapter.extract(input, options);
          } catch {
            throw pdfErr;
          }
        } else {
          throw pdfErr;
        }
      }
    }
    // Case C: Bitmap Images (PNG, JPG, WEBP, TIFF)
    else {
      let imageExtracted = false;

      // Tier 2: Gemini VLM OCR (Primary for images when configured)
      if (this.vlmAdapter.isConfigured() && options?.ocrEnginePreference !== 'tesseract') {
        try {
          extractionOutput = await this.vlmAdapter.extract(input, options);
          imageExtracted = true;
        } catch (vlmErr) {
          warnings.push(
            `Gemini VLM OCR error: ${
              vlmErr instanceof Error ? vlmErr.message : String(vlmErr)
            }. Falling back to local Tesseract OCR.`
          );
        }
      }

      // Tier 3: Tesseract.js OCR (Fallback or primary if VLM unconfigured)
      if (!imageExtracted) {
        try {
          extractionOutput = await this.ocrAdapter.extract(input, options);
          imageExtracted = true;
        } catch (ocrErr) {
          throw new CorruptedDocumentError(
            `Optical Character Recognition failed on image: ${
              ocrErr instanceof Error ? ocrErr.message : String(ocrErr)
            }`
          );
        }
      }
    }

    // 3. Text Normalization & Cleaning
    const normalizedText = this.normalizeExtractedText(extractionOutput!.text);

    if (!normalizedText || normalizedText.trim().length === 0) {
      warnings.push('No readable text could be detected in this document.');
    }

    // 4. Calculate Document Statistics & Metadata
    const wordList = normalizedText.split(/\s+/).filter(Boolean);
    const wordCount = wordList.length;
    const characterCount = normalizedText.length;
    const readingTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));
    const durationMs = Math.round(performance.now() - startTime);

    if (extractionOutput!.warnings) {
      warnings.push(...extractionOutput!.warnings);
    }

    let fileType: FileType = 'pdf';
    if (ext === 'txt' || ext === 'md' || mime.includes('text/')) {
      fileType = ext === 'md' ? 'markdown' : 'text';
    } else if (['png', 'jpg', 'jpeg', 'webp', 'tiff'].includes(ext) || mime.includes('image/')) {
      fileType = 'image';
    }

    const metadata: DocumentMetadata = {
      filename: input.filename,
      mimeType: input.mimeType || 'application/octet-stream',
      sizeBytes: input.sizeBytes || input.fileBuffer.length,
      pageCount: extractionOutput!.pageCount || 1,
      wordCount,
      characterCount,
      readingTimeMinutes,
      extractionEngine: extractionOutput!.engine,
      extractedAt: new Date().toISOString(),
      durationMs,
    };

    const meta: DocumentMeta = {
      id: Math.random().toString(36).substring(2, 11),
      name: input.filename,
      size: input.sizeBytes || input.fileBuffer.length,
      type: fileType,
      mimeType: input.mimeType || 'application/octet-stream',
      pageCount: extractionOutput!.pageCount || 1,
      wordCount,
      charCount: characterCount,
      characterCount,
      readingTimeMinutes,
      extractedAt: metadata.extractedAt,
      extractionEngine: extractionOutput!.engine,
    };

    return {
      success: true,
      text: normalizedText,
      metadata,
      meta,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }

  /**
   * Sanitizes extracted text:
   * - Normalizes CRLF / CR to LF
   * - Strips null bytes and non-printable control characters (except tabs and newlines)
   * - Collapses 3+ consecutive newlines into double newlines
   * - Trims trailing whitespace per line
   */
  private normalizeExtractedText(text: string): string {
    if (!text) return '';
    return text
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
      .split('\n')
      .map((line) => line.trimEnd())
      .join('\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }
}

export const extractDocumentUseCase = new ExtractDocumentUseCase();
