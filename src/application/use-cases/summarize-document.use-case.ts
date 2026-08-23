/**
 * src/application/use-cases/summarize-document.use-case.ts
 * Application Use Case orchestrating summarization input validation, engine selection, and stream generation.
 */

import {
  SummarizeDocumentUseCasePort,
  SummarizationOptions,
  ISummarizationEngine,
} from '@/domain/ports/summarization.port';
import { DocumentAnalysisResult, SummaryPreset } from '@/domain/models/summary';
import { EmptySummaryTextError, InvalidPresetError } from '@/domain/errors/summarization.error';
import { SummarizerAdapterFactory } from '@/infrastructure/adapters/summarizer-factory';

export class SummarizeDocumentUseCase implements SummarizeDocumentUseCasePort {
  constructor(
    private readonly engineProvider: () => ISummarizationEngine = () => SummarizerAdapterFactory.getEngine()
  ) {}

  public async executeStream(options: SummarizationOptions): Promise<ReadableStream<Uint8Array>> {
    this.validateOptions(options);
    const engine = this.engineProvider();
    return engine.streamSummary(options);
  }

  public async executeStructured(options: SummarizationOptions): Promise<DocumentAnalysisResult> {
    this.validateOptions(options);
    const engine = this.engineProvider();
    return engine.generateStructuredAnalysis(options);
  }

  private validateOptions(options: SummarizationOptions): void {
    if (!options || typeof options.text !== 'string' || options.text.trim().length === 0) {
      throw new EmptySummaryTextError();
    }

    const validPresets: SummaryPreset[] = ['short', 'medium', 'long'];
    if (options.preset && !validPresets.includes(options.preset)) {
      throw new InvalidPresetError(options.preset);
    }
  }
}

export const summarizeDocumentUseCase = new SummarizeDocumentUseCase();
