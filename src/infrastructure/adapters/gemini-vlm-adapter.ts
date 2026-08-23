/**
 * src/infrastructure/adapters/gemini-vlm-adapter.ts
 * Tier 2 Multimodal Vision Extractor utilizing Google Gemini Vision API
 * with intelligent multi-model fallback chain.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { DocumentExtractorPort, AdapterExtractionOutput } from '@/domain/ports/extraction.port';
import { RawDocumentInput, ExtractionOptions, ExtractionEngine } from '@/domain/models/document';
import { ExtractionEngineError } from '@/domain/errors/extraction.error';

const OCR_EXTRACTION_PROMPT = `
You are an expert document layout and optical character recognition (OCR) engine.
Your task is to transcribe and extract ALL text from the provided document/image with 100% precision.

Rules:
1. Extract all text verbatim without summarizing, explaining, or omitting anything.
2. Preserve heading hierarchies (#, ##, ###), lists, tabular structures (format as Markdown tables), and section boundaries.
3. If handwriting is present, transcribe it accurately in brackets: [Handwritten: <text>].
4. Do not include introductory phrases like "Here is the extracted text" or conversational replies. Return ONLY the extracted text content.
`.trim();

export class GeminiVlmAdapter implements DocumentExtractorPort {
  public readonly engineName: ExtractionEngine = 'gemini_vlm';
  private client: GoogleGenerativeAI | null = null;
  private verifiedModel: string | null = null;

  private getCandidateModels(): string[] {
    const customModel = process.env.GEMINI_MODEL;
    const defaults = [
      'gemini-2.5-flash',
      'gemini-2.0-flash',
      'gemini-1.5-flash-latest',
      'gemini-1.5-flash-002',
      'gemini-1.5-flash-001',
      'gemini-1.5-flash',
      'gemini-2.0-flash-exp',
      'gemini-1.5-pro',
    ];
    const candidates = [customModel, this.verifiedModel, ...defaults].filter(
      (m): m is string => Boolean(m && m.trim().length > 0)
    );
    return Array.from(new Set(candidates));
  }

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (apiKey) {
      this.client = new GoogleGenerativeAI(apiKey);
    }
  }

  public supports(mimeType: string): boolean {
    const supported = [
      'application/pdf',
      'image/png',
      'image/jpeg',
      'image/jpg',
      'image/webp',
      'image/tiff',
    ];
    return supported.some((m) =>
      (mimeType || '').toLowerCase().includes(m) || m.includes((mimeType || '').toLowerCase())
    );
  }

  public isConfigured(): boolean {
    return Boolean(process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY);
  }

  public async extract(
    input: RawDocumentInput,
    options?: ExtractionOptions
  ): Promise<AdapterExtractionOutput> {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured in environment.');
    }

    if (!this.client) {
      this.client = new GoogleGenerativeAI(apiKey);
    }

    const base64Data = Buffer.from(input.fileBuffer).toString('base64');
    const targetMime = input.mimeType || 'image/png';
    const candidateModels = this.getCandidateModels();
    let lastError: unknown = null;

    for (const modelName of candidateModels) {
      try {
        const model = this.client.getGenerativeModel({ model: modelName });
        const response = await model.generateContent([
          {
            inlineData: {
              data: base64Data,
              mimeType: targetMime,
            },
          },
          OCR_EXTRACTION_PROMPT,
        ]);

        const responseText = response.response.text();
        const extractedText = responseText?.trim() || '';
        this.verifiedModel = modelName;

        return {
          text: extractedText,
          pageCount: 1,
          engine: this.engineName,
          confidence: 0.95,
        };
      } catch (err: unknown) {
        lastError = err;
        const errMsg = String(err instanceof Error ? err.message : err);
        if (
          errMsg.includes('404') ||
          errMsg.includes('not found') ||
          errMsg.includes('not supported') ||
          errMsg.includes('ModelService')
        ) {
          console.warn(`[GeminiVlmAdapter] Model '${modelName}' unavailable (${errMsg}). Trying fallback model...`);
          continue;
        }
        throw new ExtractionEngineError(this.engineName, err);
      }
    }

    throw new ExtractionEngineError(
      this.engineName,
      lastError || `None of candidate vision models (${candidateModels.join(', ')}) were available.`
    );
  }
}

export const geminiVlmAdapter = new GeminiVlmAdapter();
