/**
 * src/infrastructure/adapters/gemini-summarizer.adapter.ts
 * Infrastructure Adapter for Google Gemini AI Summarization Engine with streaming SSE support,
 * runtime stream-level multi-model fallback chain, and graceful offline fallback.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { ISummarizationEngine, SummarizationOptions } from '@/domain/ports/summarization.port';
import { DocumentAnalysisResult } from '@/domain/models/summary';
import { AIProviderError } from '@/domain/errors/domain-error';
import { PromptEngineeringService } from '@/application/services/PromptEngineeringService';
import { mockSummarizerAdapter } from './mock-summarizer.adapter';

export class GeminiSummarizerAdapter implements ISummarizationEngine {
  public readonly providerName = 'google_gemini';
  private client: GoogleGenerativeAI | null = null;
  public verifiedModel: string | null = null;

  public getCandidateModels(): string[] {
    const customModel = process.env.GEMINI_MODEL;
    const defaults = [
      'gemini-2.5-flash',
      'gemini-2.0-flash',
      'gemini-2.0-flash-lite',
      'gemini-1.5-flash-latest',
      'gemini-1.5-flash-002',
      'gemini-1.5-flash-001',
      'gemini-1.5-flash-8b',
      'gemini-1.5-flash',
      'gemini-2.0-flash-exp',
      'gemini-1.5-pro',
      'gemini-pro',
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
    if (!apiKey) {
      return mockSummarizerAdapter.streamSummary(options);
    }

    if (!this.client) {
      this.client = new GoogleGenerativeAI(apiKey);
    }

    const candidateModels = this.getCandidateModels();
    const prompt = PromptEngineeringService.buildSummarizationPrompt(options);
    const clientRef = this.client;
    const adapterRef = this;
    const encoder = new TextEncoder();

    return new ReadableStream<Uint8Array>({
      async start(controller) {
        let streamSuccess = false;
        let lastError: unknown = null;

        for (const modelName of candidateModels) {
          try {
            const model = clientRef.getGenerativeModel({
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

            // Iterate the stream - this is where HTTP requests actually fire!
            let chunksEmitted = 0;
            for await (const chunk of resultStream.stream) {
              const textChunk = chunk.text();
              if (textChunk) {
                const sseMessage = `data: ${JSON.stringify({ chunk: textChunk })}\n\n`;
                controller.enqueue(encoder.encode(sseMessage));
                chunksEmitted++;
              }
            }

            if (chunksEmitted > 0) {
              adapterRef.verifiedModel = modelName;
              controller.enqueue(encoder.encode('data: [DONE]\n\n'));
              controller.close();
              streamSuccess = true;
              return;
            }
          } catch (err: unknown) {
            lastError = err;
            const errMsg = String(err instanceof Error ? err.message : err);
            console.warn(`[GeminiSummarizerAdapter] Model '${modelName}' stream failed (${errMsg}). Trying next model...`);
            // Continue loop to try next model
          }
        }

        // If all candidate models failed or were retired, fall back gracefully to mock synthesis
        if (!streamSuccess) {
          console.warn(
            `[GeminiSummarizerAdapter] All candidate Gemini models failed. Falling back gracefully to MockSummarizerAdapter. Error details:`,
            lastError
          );
          try {
            const fallbackStream = await mockSummarizerAdapter.streamSummary(options);
            const reader = fallbackStream.getReader();
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              controller.enqueue(value);
            }
            controller.close();
          } catch (fallbackErr) {
            controller.error(fallbackErr);
          }
        }
      },
    });
  }

  public async generateStructuredAnalysis(options: SummarizationOptions): Promise<DocumentAnalysisResult> {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) {
      return mockSummarizerAdapter.generateStructuredAnalysis(options);
    }

    if (!this.client) {
      this.client = new GoogleGenerativeAI(apiKey);
    }

    const candidateModels = this.getCandidateModels();
    const prompt = PromptEngineeringService.buildSummarizationPrompt(options);
    let lastError: unknown = null;

    for (const modelName of candidateModels) {
      try {
        const model = this.client.getGenerativeModel({ model: modelName });
        const response = await model.generateContent(prompt);
        const fullText = response.response.text();

        if (fullText && fullText.trim().length > 0) {
          this.verifiedModel = modelName;
          return PromptEngineeringService.parseStructuredAnalysis(fullText, options);
        }
      } catch (err: unknown) {
        lastError = err;
        const errMsg = String(err instanceof Error ? err.message : err);
        console.warn(`[GeminiSummarizerAdapter] Structured analysis with '${modelName}' failed (${errMsg}). Trying next model...`);
      }
    }

    console.warn(`[GeminiSummarizerAdapter] All models failed for structured analysis. Falling back to MockSummarizerAdapter.`);
    return mockSummarizerAdapter.generateStructuredAnalysis(options);
  }
}

export const geminiSummarizerAdapter = new GeminiSummarizerAdapter();
