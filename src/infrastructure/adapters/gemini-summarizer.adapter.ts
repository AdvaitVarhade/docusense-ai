/**
 * src/infrastructure/adapters/gemini-summarizer.adapter.ts
 * Infrastructure Adapter for Google Gemini AI Summarization Engine with streaming SSE support
 * and intelligent multi-model fallback chain.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { ISummarizationEngine, SummarizationOptions } from '@/domain/ports/summarization.port';
import { DocumentAnalysisResult } from '@/domain/models/summary';
import { AIProviderError } from '@/domain/errors/domain-error';
import { PromptEngineeringService } from '@/application/services/PromptEngineeringService';

export class GeminiSummarizerAdapter implements ISummarizationEngine {
  public readonly providerName = 'google_gemini';
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

  public isConfigured(): boolean {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    return Boolean(apiKey && apiKey.trim().length > 0);
  }

  public async streamSummary(options: SummarizationOptions): Promise<ReadableStream<Uint8Array>> {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey || !this.client) {
      this.client = apiKey ? new GoogleGenerativeAI(apiKey) : null;
    }

    if (!this.client) {
      throw new AIProviderError(this.providerName, 'GEMINI_API_KEY is not configured in the environment.');
    }

    const candidateModels = this.getCandidateModels();
    const prompt = PromptEngineeringService.buildSummarizationPrompt(options);
    let lastError: unknown = null;

    for (const modelName of candidateModels) {
      try {
        const model = this.client.getGenerativeModel({
          model: modelName,
          generationConfig: {
            temperature: 0.2,
            topP: 0.8,
            topK: 40,
          },
        });

        const resultStream = await model.generateContentStream({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
        });

        // Cache working model name
        this.verifiedModel = modelName;

        const encoder = new TextEncoder();

        return new ReadableStream<Uint8Array>({
          async start(controller) {
            try {
              for await (const chunk of resultStream.stream) {
                const textChunk = chunk.text();
                if (textChunk) {
                  const sseMessage = `data: ${JSON.stringify({ chunk: textChunk })}\n\n`;
                  controller.enqueue(encoder.encode(sseMessage));
                }
              }
              // Emit completion marker
              controller.enqueue(encoder.encode('data: [DONE]\n\n'));
              controller.close();
            } catch (streamErr) {
              controller.error(streamErr);
            }
          },
        });
      } catch (err: unknown) {
        lastError = err;
        const errMsg = String(err instanceof Error ? err.message : err);
        // If 404 or model not supported, continue to next candidate model
        if (
          errMsg.includes('404') ||
          errMsg.includes('not found') ||
          errMsg.includes('not supported') ||
          errMsg.includes('ModelService')
        ) {
          console.warn(`[GeminiSummarizerAdapter] Model '${modelName}' unavailable (${errMsg}). Trying fallback model...`);
          continue;
        }
        // If auth error, quota exhausted, etc., rethrow immediately
        throw new AIProviderError(this.providerName, err);
      }
    }

    throw new AIProviderError(
      this.providerName,
      lastError || `None of the candidate Gemini models (${candidateModels.join(', ')}) were available.`
    );
  }

  public async generateStructuredAnalysis(options: SummarizationOptions): Promise<DocumentAnalysisResult> {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey || !this.client) {
      this.client = apiKey ? new GoogleGenerativeAI(apiKey) : null;
    }

    if (!this.client) {
      throw new AIProviderError(this.providerName, 'GEMINI_API_KEY is not configured in the environment.');
    }

    const candidateModels = this.getCandidateModels();
    const prompt = PromptEngineeringService.buildSummarizationPrompt(options);
    let lastError: unknown = null;

    for (const modelName of candidateModels) {
      try {
        const model = this.client.getGenerativeModel({ model: modelName });
        const response = await model.generateContent(prompt);
        const fullText = response.response.text();

        this.verifiedModel = modelName;
        return PromptEngineeringService.parseStructuredAnalysis(fullText, options);
      } catch (err: unknown) {
        lastError = err;
        const errMsg = String(err instanceof Error ? err.message : err);
        if (
          errMsg.includes('404') ||
          errMsg.includes('not found') ||
          errMsg.includes('not supported') ||
          errMsg.includes('ModelService')
        ) {
          console.warn(`[GeminiSummarizerAdapter] Model '${modelName}' unavailable (${errMsg}). Trying fallback model...`);
          continue;
        }
        throw new AIProviderError(this.providerName, err);
      }
    }

    throw new AIProviderError(
      this.providerName,
      lastError || `None of the candidate Gemini models (${candidateModels.join(', ')}) were available.`
    );
  }
}

export const geminiSummarizerAdapter = new GeminiSummarizerAdapter();
