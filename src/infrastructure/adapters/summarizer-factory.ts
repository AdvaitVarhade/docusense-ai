/**
 * src/infrastructure/adapters/summarizer-factory.ts
 * Dynamic adapter factory with auto-fallback to mock engine.
 */

import { ISummarizationEngine } from '@/domain/ports/summarization.port';
import { geminiSummarizerAdapter } from './gemini-summarizer.adapter';
import { mockSummarizerAdapter } from './mock-summarizer.adapter';

export class SummarizerAdapterFactory {
  public static getEngine(forceMock = false): ISummarizationEngine {
    if (forceMock) {
      return mockSummarizerAdapter;
    }

    if (!geminiSummarizerAdapter.isConfigured()) {
      return mockSummarizerAdapter;
    }

    return geminiSummarizerAdapter;
  }
}
