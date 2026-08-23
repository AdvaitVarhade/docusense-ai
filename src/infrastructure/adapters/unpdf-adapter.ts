/**
 * src/infrastructure/adapters/unpdf-adapter.ts
 * Tier 1 Fast Digital PDF Extractor utilizing 'unpdf' (pure WebAssembly / JS).
 */

import { extractText, getMeta } from 'unpdf';
import { DocumentExtractorPort, AdapterExtractionOutput } from '@/domain/ports/extraction.port';
import { RawDocumentInput, ExtractionOptions, ExtractionEngine } from '@/domain/models/document';
import { CorruptedDocumentError, PasswordProtectedDocumentError, ExtractionEngineError } from '@/domain/errors/extraction.error';

export class UnpdfAdapter implements DocumentExtractorPort {
  public readonly engineName: ExtractionEngine = 'unpdf';

  public supports(mimeType: string): boolean {
    const lower = (mimeType || '').toLowerCase();
    return lower === 'application/pdf' || lower.includes('pdf');
  }

  public async extract(
    input: RawDocumentInput,
    options?: ExtractionOptions
  ): Promise<AdapterExtractionOutput> {
    try {
      const uint8Array = new Uint8Array(input.fileBuffer);

      // Extract text page-by-page to retain page boundary awareness
      const { text: pagesText, totalPages } = await extractText(uint8Array, {
        mergePages: false,
      });

      let pageCount = totalPages || 1;
      let textArray: string[] = [];

      if (Array.isArray(pagesText)) {
        textArray = pagesText;
      } else if (typeof pagesText === 'string') {
        textArray = [pagesText];
      }

      // If maxPages option is provided, slice pages
      if (options?.maxPages && options.maxPages > 0) {
        textArray = textArray.slice(0, options.maxPages);
        pageCount = textArray.length;
      }

      // Retrieve optional PDF metadata
      let rawMeta: Record<string, unknown> = {};
      try {
        const metaObj = await getMeta(uint8Array);
        if (metaObj) {
          rawMeta = {
            info: metaObj.info,
            metadata: metaObj.metadata,
          };
        }
      } catch {
        // Metadata extraction failure is non-fatal
      }

      // Clean and join page texts with clear page separators
      const joinedText = textArray
        .map((p, index) => {
          const trimmed = (p || '').trim();
          if (!trimmed) return '';
          return textArray.length > 1 ? `--- Page ${index + 1} ---\n${trimmed}` : trimmed;
        })
        .filter(Boolean)
        .join('\n\n');

      return {
        text: joinedText,
        pageCount: Math.max(pageCount, 1),
        engine: this.engineName,
        rawMeta,
      };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      const lower = errorMsg.toLowerCase();

      if (lower.includes('password') || lower.includes('encrypted')) {
        throw new PasswordProtectedDocumentError();
      }
      if (lower.includes('invalid pdf') || lower.includes('corrupted') || lower.includes('format error') || lower.includes('broken-header') || lower.includes('corrupted')) {
        throw new CorruptedDocumentError(`Failed to parse PDF: ${errorMsg}`);
      }

      throw new ExtractionEngineError(this.engineName, err);
    }
  }
}

export const unpdfAdapter = new UnpdfAdapter();
