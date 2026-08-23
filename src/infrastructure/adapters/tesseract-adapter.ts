/**
 * src/infrastructure/adapters/tesseract-adapter.ts
 * Tier 3 Local WASM OCR Extractor utilizing 'tesseract.js' (Offline / Fallback).
 */

import { createWorker } from 'tesseract.js';
import { DocumentExtractorPort, AdapterExtractionOutput } from '@/domain/ports/extraction.port';
import { RawDocumentInput, ExtractionOptions, ExtractionEngine } from '@/domain/models/document';
import { ExtractionEngineError, CorruptedDocumentError } from '@/domain/errors/extraction.error';

export class TesseractAdapter implements DocumentExtractorPort {
  public readonly engineName: ExtractionEngine = 'tesseract';

  public supports(mimeType: string): boolean {
    const supported = [
      'image/png',
      'image/jpeg',
      'image/jpg',
      'image/webp',
      'image/tiff',
      'image/bmp',
    ];
    return supported.some((m) => (mimeType || '').toLowerCase().includes(m));
  }

  public async extract(
    input: RawDocumentInput,
    options?: ExtractionOptions
  ): Promise<AdapterExtractionOutput> {
    const lang = options?.targetLanguage || 'eng';
    let worker: Tesseract.Worker | null = null;

    try {
      // Create isolated worker instance for thread safety
      worker = await createWorker(lang);
      
      const buffer = Buffer.from(input.fileBuffer);
      const ret = await worker.recognize(buffer);

      const text = ret.data?.text?.trim() || '';
      const confidence = ret.data?.confidence ? ret.data.confidence / 100 : 0.8;

      const warnings: string[] = [];
      if (confidence < 0.6) {
        warnings.push('Low OCR confidence score (< 60%). Image may be blurry or low-resolution.');
      }

      return {
        text,
        pageCount: 1,
        engine: this.engineName,
        confidence,
        warnings: warnings.length > 0 ? warnings : undefined,
      };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      if (errorMsg.toLowerCase().includes('corrupted') || errorMsg.toLowerCase().includes('broken')) {
        throw new CorruptedDocumentError(`Tesseract failed to decode image buffer: ${errorMsg}`);
      }
      return {
        text: '',
        pageCount: 1,
        engine: this.engineName,
        confidence: 0.5,
        warnings: [`OCR returned no recognizable text: ${errorMsg}`],
      };
    } finally {
      if (worker) {
        try {
          await worker.terminate();
        } catch {
          // Ignore worker termination errors
        }
      }
    }
  }
}

export const tesseractAdapter = new TesseractAdapter();
