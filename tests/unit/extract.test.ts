import { describe, it, expect } from 'vitest';
import { DocumentNormalizer } from '@/application/services/DocumentNormalizer';
import { formatBytes, calculateReadingTime } from '@/lib/utils';
import { MAX_FILE_SIZE_BYTES, ALLOWED_MIME_TYPES } from '@/domain/schemas/extraction.schema';

describe('Document Normalizer & Utilities Unit Tests', () => {
  it('should clean control characters and excess newlines in DocumentNormalizer', () => {
    const rawText = 'Line 1\r\n\r\n\r\n\r\nLine 2\u0000   \nLine 3  ';
    const normalized = DocumentNormalizer.normalize(rawText);

    expect(normalized).toBe('Line 1\n\nLine 2\nLine 3');
    expect(DocumentNormalizer.countWords(normalized)).toBe(6);
    expect(DocumentNormalizer.countCharacters(normalized)).toBe(21);
  });

  it('should format byte sizes correctly', () => {
    expect(formatBytes(0)).toBe('0 Bytes');
    expect(formatBytes(1024)).toBe('1 KB');
    expect(formatBytes(1024 * 1024 * 2.5)).toBe('2.5 MB');
    expect(formatBytes(1024 * 1024 * 25)).toBe('25 MB');
  });

  it('should calculate reading time properly', () => {
    expect(calculateReadingTime(0)).toBe(1);
    expect(calculateReadingTime(150)).toBe(1);
    expect(calculateReadingTime(450)).toBe(3);
    expect(calculateReadingTime(1000)).toBe(5);
  });

  it('should adhere to extraction schema boundaries', () => {
    expect(MAX_FILE_SIZE_BYTES).toBe(25 * 1024 * 1024);
    expect(ALLOWED_MIME_TYPES).toContain('application/pdf');
    expect(ALLOWED_MIME_TYPES).toContain('image/png');
    expect(ALLOWED_MIME_TYPES).toContain('image/jpeg');
    expect(ALLOWED_MIME_TYPES).toContain('image/webp');
    expect(ALLOWED_MIME_TYPES).toContain('text/plain');
  });
});
