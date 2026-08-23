import { describe, it, expect } from 'vitest';
import { ExportFormatter, DocumentExportData } from '@/application/services/ExportFormatter';

describe('Unit: ExportFormatter Service', () => {
  const sampleData: DocumentExportData = {
    document: {
      filename: 'Sample-Doc.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 15420,
      pageCount: 4,
      wordCount: 1200,
      characterCount: 7800,
      extractionEngine: 'unpdf',
      extractedAt: '2026-08-21T18:00:00.000Z',
    },
    summary: {
      lengthPreset: 'medium',
      content: 'This is an executive synthesis of the document findings.',
      keyTakeaways: [
        'Takeaway 1: High throughput observed',
        'Takeaway 2: Operational efficiency increased by 35%',
      ],
      improvementSuggestions: [
        'Suggestion 1: Add appendix with raw metrics',
        'Suggestion 2: Include comparison baseline',
      ],
    },
    generatedAt: '2026-08-21T18:05:00.000Z',
  };

  it('should format valid Markdown with all sections', () => {
    const md = ExportFormatter.formatAsMarkdown(sampleData);
    expect(md).toContain('# DocuSense AI Summary: Sample-Doc.pdf');
    expect(md).toContain('## Document Metadata');
    expect(md).toContain('- **Filename**: Sample-Doc.pdf');
    expect(md).toContain('- **Pages**: 4');
    expect(md).toContain('## Summary (MEDIUM)');
    expect(md).toContain('## Key Takeaways');
    expect(md).toContain('- Takeaway 1: High throughput observed');
    expect(md).toContain('## Improvement Suggestions');
    expect(md).toContain('1. Suggestion 1: Add appendix with raw metrics');
  });

  it('should format valid JSON parseable into matching structure', () => {
    const jsonStr = ExportFormatter.formatAsJson(sampleData);
    const parsed = JSON.parse(jsonStr);
    expect(parsed.version).toBe('1.0.0');
    expect(parsed.document.filename).toBe('Sample-Doc.pdf');
    expect(parsed.summary.lengthPreset).toBe('medium');
    expect(parsed.summary.keyTakeaways).toHaveLength(2);
    expect(parsed.summary.improvementSuggestions).toHaveLength(2);
  });

  it('should format valid Plain Text with clean delimiters and stripped markdown formatting', () => {
    const txt = ExportFormatter.formatAsPlainText(sampleData);
    expect(txt).toContain('DOCUSENSE AI SUMMARY: SAMPLE-DOC.PDF');
    expect(txt).toContain('DOCUMENT METADATA:');
    expect(txt).toContain('SUMMARY (MEDIUM):');
    expect(txt).toContain('KEY TAKEAWAYS:');
    expect(txt).toContain('  * Takeaway 1: High throughput observed');
    expect(txt).toContain('IMPROVEMENT SUGGESTIONS:');
    expect(txt).toContain('  1. Suggestion 1: Add appendix with raw metrics');
  });

  it('should format for clipboard identically to Markdown', () => {
    const clip = ExportFormatter.formatForClipboard(sampleData);
    const md = ExportFormatter.formatAsMarkdown(sampleData);
    expect(clip).toBe(md);
  });

  it('should sanitize dangerous filenames across extensions', () => {
    const unsanitized = 'Report / 2026: "Q3 Strategy" <v2>?.pdf';
    expect(ExportFormatter.sanitizeExportFilename(unsanitized, '.md')).toBe('Report - 2026- -Q3 Strategy- -v2---summary.md');
    expect(ExportFormatter.sanitizeExportFilename(unsanitized, '.json')).toBe('Report - 2026- -Q3 Strategy- -v2---summary.json');
    expect(ExportFormatter.sanitizeExportFilename(unsanitized, 'txt')).toBe('Report - 2026- -Q3 Strategy- -v2---summary.txt');
  });

  it('should handle missing key takeaways and suggestions gracefully', () => {
    const minimalData: DocumentExportData = {
      document: {
        filename: 'minimal.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 500,
        pageCount: 1,
        wordCount: 40,
        characterCount: 200,
        extractionEngine: 'unpdf',
        extractedAt: '2026-08-21T18:00:00.000Z',
      },
      summary: {
        lengthPreset: 'short',
        content: 'Brief summary only.',
      },
      generatedAt: '2026-08-21T18:05:00.000Z',
    };

    const md = ExportFormatter.formatAsMarkdown(minimalData);
    expect(md).not.toContain('## Key Takeaways');
    expect(md).not.toContain('## Improvement Suggestions');

    const txt = ExportFormatter.formatAsPlainText(minimalData);
    expect(txt).not.toContain('KEY TAKEAWAYS:');
    expect(txt).not.toContain('IMPROVEMENT SUGGESTIONS:');
  });
});
