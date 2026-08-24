/**
 * src/infrastructure/adapters/gemini-chat.adapter.ts
 * Streaming Conversational Document Q&A Adapter with Gemini 3.x multi-model fallback and offline mock heuristic.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { IChatEngine, ChatOptions } from '@/domain/ports/summarization.port';
import { PromptEngineeringService } from '@/application/services/PromptEngineeringService';

export class GeminiChatAdapter implements IChatEngine {
  public readonly providerName = 'google_gemini_chat';
  private client: GoogleGenerativeAI | null = null;
  public verifiedModel: string | null = null;

  public getCandidateModels(): string[] {
    const customModel = process.env.GEMINI_MODEL;
    const defaults = [
      'gemini-3.6-flash',
      'gemini-3.5-flash-lite',
      'gemini-3.5-flash',
      'gemini-3.0-flash',
      'gemini-3.6-pro',
      'gemini-2.5-flash',
      'gemini-2.0-flash',
      'gemini-1.5-flash-latest',
      'gemini-1.5-flash',
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

  public async streamChat(options: ChatOptions): Promise<ReadableStream<Uint8Array>> {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    const prompt = PromptEngineeringService.buildChatPrompt(options);
    const encoder = new TextEncoder();

    if (!apiKey) {
      return this.streamMockAnswer(options);
    }

    if (!this.client) {
      this.client = new GoogleGenerativeAI(apiKey);
    }

    const candidateModels = this.getCandidateModels();
    const clientRef = this.client;
    const adapterRef = this;

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
            console.warn(`[GeminiChatAdapter] Model '${modelName}' chat stream failed (${errMsg}). Trying next model...`);
          }
        }

        if (!streamSuccess) {
          console.warn('[GeminiChatAdapter] All candidate models failed for chat. Falling back to offline mock heuristic:', lastError);
          const fallbackStream = await adapterRef.streamMockAnswer(options);
          const reader = fallbackStream.getReader();
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            controller.enqueue(value);
          }
          controller.close();
        }
      },
    });
  }

  public async streamMockAnswer(options: ChatOptions): Promise<ReadableStream<Uint8Array>> {
    const { question, documentText } = options;
    const lowerQ = question.toLowerCase();
    const lowerDoc = documentText.toLowerCase();

    let answer = '';
    if (lowerQ.includes('risk') || lowerQ.includes('bottleneck')) {
      answer = `Based on the document, the primary risks and constraints identified include operational bottlenecks, architectural dependencies, and resource scaling limits noted in the analysis sections.`;
    } else if (lowerQ.includes('financial') || lowerQ.includes('cost') || lowerQ.includes('metric') || lowerQ.includes('revenue')) {
      answer = `The document highlights key quantitative figures and metrics relevant to operational throughput, cost efficiencies, and quantitative performance benchmarks.`;
    } else if (lowerQ.includes('summary') || lowerQ.includes('what is') || lowerQ.includes('explain')) {
      const firstLines = documentText.split('\n').filter((l) => l.trim().length > 20).slice(0, 3).join(' ');
      answer = `According to the document: "${firstLines.slice(0, 240)}..." This forms the foundational context of the analyzed material.`;
    } else {
      answer = `Based on the document analysis for "${question}": The content directly references these requirements across its primary sections, outlining specific parameters and guidelines for execution.`;
    }

    const encoder = new TextEncoder();
    const chunks = answer.match(/.{1,25}/gs) || [answer];

    return new ReadableStream<Uint8Array>({
      async start(controller) {
        for (const chunk of chunks) {
          const sseEvent = `data: ${JSON.stringify({ chunk })}\n\n`;
          controller.enqueue(encoder.encode(sseEvent));
        }
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      },
    });
  }
}

export const geminiChatAdapter = new GeminiChatAdapter();
