/**
 * src/application/dto/extractDto.ts
 * Extraction Data Transfer Objects.
 */

import { DocumentMetadata, DocumentMeta, ExtractionResult, RawDocumentInput, ExtractionOptions } from '@/domain/models/document';

export interface ExtractDocumentRequestDto extends RawDocumentInput {
  options?: ExtractionOptions;
}

export interface ExtractDocumentResponseDto extends ExtractionResult {}
