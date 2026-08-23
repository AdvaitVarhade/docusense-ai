/**
 * src/application/services/DocumentNormalizer.ts
 * Text normalization, word counting, and reading time calculation service.
 */

export class DocumentNormalizer {
  /**
   * Cleans extracted text: removes control chars, standardizes newlines, trims excess whitespace.
   */
  public static normalize(rawText: string): string {
    if (!rawText) return '';
    return rawText
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
      .split('\n')
      .map((line) => line.trimEnd())
      .join('\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  /**
   * Counts words accurately by splitting on whitespace sequences.
   */
  public static countWords(text: string): number {
    if (!text || !text.trim()) return 0;
    return text.trim().split(/\s+/).filter(Boolean).length;
  }

  /**
   * Counts total characters in string.
   */
  public static countCharacters(text: string): number {
    return text ? text.length : 0;
  }

  /**
   * Estimates reading time in minutes (assumes 200 WPM).
   */
  public static estimateReadingTimeMinutes(wordCount: number): number {
    if (!wordCount || wordCount <= 0) return 1;
    return Math.max(1, Math.ceil(wordCount / 200));
  }
}
