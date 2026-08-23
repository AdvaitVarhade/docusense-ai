/**
 * src/domain/schemas/extraction.schema.ts
 * Runtime Zod schemas for file validation, extraction requests, and responses.
 */

import { z } from 'zod';

export const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB

export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'image/tiff',
  'text/plain',
  'text/markdown',
] as const;

export const DocumentMimeTypeSchema = z.enum(ALLOWED_MIME_TYPES);

export const ExtractionEngineSchema = z.enum([
  'unpdf',
  'tesseract',
  'gemini_vlm',
  'raw_text',
  'raw-text',
  'mock',
]);

export const DocumentMetadataSchema = z.object({
  filename: z.string().min(1),
  mimeType: z.string().min(1),
  sizeBytes: z.number().int().nonnegative(),
  pageCount: z.number().int().positive(),
  wordCount: z.number().int().nonnegative(),
  characterCount: z.number().int().nonnegative(),
  readingTimeMinutes: z.number().int().nonnegative(),
  extractionEngine: ExtractionEngineSchema,
  extractedAt: z.string(),
  durationMs: z.number().nonnegative(),
});

export const ExtractionResultSchema = z.object({
  success: z.literal(true),
  text: z.string(),
  metadata: DocumentMetadataSchema,
  warnings: z.array(z.string()).optional(),
});

export const ExtractionErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.string(),
  code: z.string().optional(),
  details: z.record(z.unknown()).optional(),
});

export type DocumentMetadataDto = z.infer<typeof DocumentMetadataSchema>;
export type ExtractionResultDto = z.infer<typeof ExtractionResultSchema>;
export type ExtractionErrorResponseDto = z.infer<typeof ExtractionErrorResponseSchema>;
