/**
 * src/domain/errors/extraction.error.ts
 * Domain-specific errors for the document extraction pipeline.
 */

export type ExtractionErrorCode =
  | 'INVALID_FILE_TYPE'
  | 'FILE_TOO_LARGE'
  | 'EMPTY_FILE'
  | 'MISSING_FILE'
  | 'PASSWORD_PROTECTED'
  | 'CORRUPTED_DOCUMENT'
  | 'EXTRACTION_FAILED'
  | 'OCR_FAILED'
  | 'RATE_LIMIT_EXCEEDED'
  | 'INVALID_CONTENT_TYPE'
  | 'INTERNAL_SERVER_ERROR';

export class ExtractionError extends Error {
  public readonly code: ExtractionErrorCode;
  public readonly statusCode: number;
  public readonly details?: Record<string, unknown>;

  constructor(
    code: ExtractionErrorCode,
    message: string,
    statusCode: number = 422,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ExtractionError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    Object.setPrototypeOf(this, ExtractionError.prototype);
  }
}

export class InvalidDocumentError extends ExtractionError {
  constructor(message: string, details?: Record<string, unknown>) {
    super('INVALID_FILE_TYPE', message, 400, details);
    this.name = 'InvalidDocumentError';
  }
}

export class PayloadTooLargeError extends ExtractionError {
  constructor(message: string = 'File size exceeds maximum allowable limit of 25MB.') {
    super('FILE_TOO_LARGE', message, 413);
    this.name = 'PayloadTooLargeError';
  }
}

export class EmptyDocumentError extends ExtractionError {
  constructor(message: string = 'Uploaded document contains no data (0 bytes).') {
    super('EMPTY_FILE', message, 400);
    this.name = 'EmptyDocumentError';
  }
}

export class PasswordProtectedDocumentError extends ExtractionError {
  constructor(message: string = 'Document is password-protected. Please remove encryption before uploading.') {
    super('PASSWORD_PROTECTED', message, 422);
    this.name = 'PasswordProtectedDocumentError';
  }
}

export class CorruptedDocumentError extends ExtractionError {
  constructor(message: string = 'Document appears corrupted or has an invalid structure.', details?: Record<string, unknown>) {
    super('CORRUPTED_DOCUMENT', message, 422, details);
    this.name = 'CorruptedDocumentError';
  }
}

export class ExtractionEngineError extends ExtractionError {
  constructor(engine: string, originalError: unknown) {
    const errorMsg = originalError instanceof Error ? originalError.message : String(originalError);
    super('EXTRACTION_FAILED', `Extraction failed using engine '${engine}': ${errorMsg}`, 500, { engine, originalError: errorMsg });
    this.name = 'ExtractionEngineError';
  }
}
