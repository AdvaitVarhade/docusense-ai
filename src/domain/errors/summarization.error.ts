/**
 * src/domain/errors/summarization.error.ts
 * Specialized domain errors for AI summarization failures.
 */

import { DomainError } from './domain-error';

export class SummarizationError extends DomainError {
  constructor(
    message: string,
    code = 'SUMMARIZATION_ERROR',
    statusCode = 500,
    details?: Record<string, unknown>
  ) {
    super(message, code, statusCode, details);
    this.name = 'SummarizationError';
    Object.setPrototypeOf(this, SummarizationError.prototype);
  }
}

export class EmptySummaryTextError extends SummarizationError {
  constructor() {
    super("Missing or empty 'text' field in request body", 'EMPTY_TEXT_ERROR', 400);
    this.name = 'EmptySummaryTextError';
    Object.setPrototypeOf(this, EmptySummaryTextError.prototype);
  }
}

export class InvalidPresetError extends SummarizationError {
  constructor(preset: string) {
    super(
      `Invalid summary preset '${preset}'. Must be one of: 'short', 'medium', 'long'.`,
      'INVALID_PRESET',
      400,
      { preset }
    );
    this.name = 'InvalidPresetError';
    Object.setPrototypeOf(this, InvalidPresetError.prototype);
  }
}

export class AIServiceUnavailableError extends SummarizationError {
  constructor(reason: string) {
    super(
      `AI Summarization service temporarily unavailable: ${reason}`,
      'AI_SERVICE_UNAVAILABLE',
      503,
      { reason }
    );
    this.name = 'AIServiceUnavailableError';
    Object.setPrototypeOf(this, AIServiceUnavailableError.prototype);
  }
}

export class AISummarizationStreamError extends SummarizationError {
  constructor(originalError: unknown) {
    const msg = originalError instanceof Error ? originalError.message : String(originalError);
    super(
      `Failed to stream AI summary: ${msg}`,
      'STREAM_GENERATION_FAILED',
      500,
      { originalError: msg }
    );
    this.name = 'AISummarizationStreamError';
    Object.setPrototypeOf(this, AISummarizationStreamError.prototype);
  }
}
