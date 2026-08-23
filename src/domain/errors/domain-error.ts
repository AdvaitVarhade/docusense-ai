/**
 * src/domain/errors/domain-error.ts
 * Base and common domain errors across all subsystems.
 */

export class DomainError extends Error {
  constructor(
    message: string,
    public readonly code: string = 'DOMAIN_ERROR',
    public readonly statusCode: number = 400,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'DomainError';
    Object.setPrototypeOf(this, DomainError.prototype);
  }
}

export class ValidationError extends DomainError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'VALIDATION_ERROR', 400, details);
    this.name = 'ValidationError';
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

export class AIProviderError extends DomainError {
  constructor(provider: string, originalError: unknown) {
    const errorMsg = originalError instanceof Error ? originalError.message : String(originalError);
    super(`AI Provider '${provider}' failed: ${errorMsg}`, 'AI_PROVIDER_ERROR', 502, { provider, originalError: errorMsg });
    this.name = 'AIProviderError';
    Object.setPrototypeOf(this, AIProviderError.prototype);
  }
}
