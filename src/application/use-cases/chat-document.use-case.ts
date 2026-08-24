/**
 * src/application/use-cases/chat-document.use-case.ts
 * Use-case orchestrator for real-time conversational document Q&A.
 */

import { IChatEngine, ChatOptions } from '@/domain/ports/summarization.port';
import { geminiChatAdapter } from '@/infrastructure/adapters/gemini-chat.adapter';

export class ChatDocumentUseCase {
  constructor(private readonly engine: IChatEngine = geminiChatAdapter) {}

  public async executeStream(options: ChatOptions): Promise<ReadableStream<Uint8Array>> {
    if (!options.documentText || options.documentText.trim().length === 0) {
      throw new Error('Document text is required for interactive Q&A.');
    }
    if (!options.question || options.question.trim().length === 0) {
      throw new Error('Question cannot be empty.');
    }

    return this.engine.streamChat(options);
  }
}

export const chatDocumentUseCase = new ChatDocumentUseCase();
