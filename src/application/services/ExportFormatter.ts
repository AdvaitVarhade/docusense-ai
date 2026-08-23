/**
 * src/application/services/ExportFormatter.ts
 * Multi-format export formatting service supporting Markdown, JSON, Plain Text, and Clipboard.
 */

import { SummaryPreset, KeyPoint, ImprovementSuggestion } from '@/domain/models/summary';
import { DocumentMetadata, DocumentMeta } from '@/domain/models/document';

export interface DocumentExportData {
  document: {
    filename: string;
    mimeType: string;
    sizeBytes: number;
    pageCount: number;
    wordCount: number;
    characterCount: number;
    extractionEngine: string;
    extractedAt: string;
  };
  summary: {
    lengthPreset: SummaryPreset;
    content: string;
    keyTakeaways?: string[];
    improvementSuggestions?: string[];
  };
  generatedAt: string;
}

export class ExportFormatter {
  /**
   * Builds standardized DocumentExportData from raw models
   */
  public static createExportPayload(params: {
    filename?: string;
    metadata?: Partial<DocumentMetadata> | DocumentMeta;
    preset: SummaryPreset;
    summaryMarkdown: string;
    keyPoints?: KeyPoint[] | string[];
    suggestions?: ImprovementSuggestion[] | string[];
    extractedAt?: string;
  }): DocumentExportData {
    const meta = (params.metadata || {}) as any;
    const filename = params.filename || meta.filename || meta.name || 'document.pdf';
    const mimeType = meta.mimeType || 'application/pdf';
    const sizeBytes = meta.sizeBytes || meta.size || 0;
    const pageCount = meta.pageCount || 1;
    const wordCount = meta.wordCount || 0;
    const characterCount = meta.characterCount || meta.charCount || 0;
    const extractionEngine = meta.extractionEngine || 'unpdf';
    const extractedAt = params.extractedAt || meta.extractedAt || new Date().toISOString();

    const keyTakeaways: string[] = [];
    if (params.keyPoints) {
      for (const item of params.keyPoints) {
        if (typeof item === 'string') {
          keyTakeaways.push(item);
        } else if (item && item.description) {
          keyTakeaways.push(item.description);
        }
      }
    }

    const improvementSuggestions: string[] = [];
    if (params.suggestions) {
      for (const item of params.suggestions) {
        if (typeof item === 'string') {
          improvementSuggestions.push(item);
        } else if (item && item.suggestion) {
          improvementSuggestions.push(item.suggestion);
        }
      }
    }

    return {
      document: {
        filename,
        mimeType,
        sizeBytes,
        pageCount,
        wordCount,
        characterCount,
        extractionEngine,
        extractedAt,
      },
      summary: {
        lengthPreset: params.preset,
        content: params.summaryMarkdown,
        keyTakeaways: keyTakeaways.length > 0 ? keyTakeaways : undefined,
        improvementSuggestions: improvementSuggestions.length > 0 ? improvementSuggestions : undefined,
      },
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Formats export payload as GitHub-Flavored Markdown
   */
  public static formatAsMarkdown(payload: DocumentExportData): string {
    const { document: doc, summary, generatedAt } = payload;
    let md = `# DocuSense AI Summary: ${doc.filename}\n\n`;

    md += `## Document Metadata\n`;
    md += `- **Filename**: ${doc.filename}\n`;
    md += `- **MIME Type**: ${doc.mimeType}\n`;
    md += `- **Pages**: ${doc.pageCount}\n`;
    md += `- **Original Word Count**: ${doc.wordCount}\n`;
    md += `- **Extraction Engine**: ${doc.extractionEngine}\n`;
    md += `- **Export Date**: ${generatedAt}\n\n`;

    md += `## Summary (${summary.lengthPreset.toUpperCase()})\n\n`;
    md += `${summary.content.trim()}\n\n`;

    if (summary.keyTakeaways && summary.keyTakeaways.length > 0) {
      md += `## Key Takeaways\n\n`;
      for (const point of summary.keyTakeaways) {
        md += `- ${point}\n`;
      }
      md += `\n`;
    }

    if (summary.improvementSuggestions && summary.improvementSuggestions.length > 0) {
      md += `## Improvement Suggestions\n\n`;
      summary.improvementSuggestions.forEach((suggestion, index) => {
        md += `${index + 1}. ${suggestion}\n`;
      });
      md += `\n`;
    }

    return md;
  }

  /**
   * Formats export payload as formatted JSON
   */
  public static formatAsJson(payload: DocumentExportData): string {
    return JSON.stringify(
      {
        version: '1.0.0',
        ...payload,
      },
      null,
      2
    );
  }

  /**
   * Formats export payload as structured Plain Text
   */
  public static formatAsPlainText(payload: DocumentExportData): string {
    const { document: doc, summary, generatedAt } = payload;
    let txt = `=====================================================\n`;
    txt += `DOCUSENSE AI SUMMARY: ${doc.filename.toUpperCase()}\n`;
    txt += `=====================================================\n\n`;

    txt += `DOCUMENT METADATA:\n`;
    txt += `  Filename:          ${doc.filename}\n`;
    txt += `  MIME Type:         ${doc.mimeType}\n`;
    txt += `  Pages:             ${doc.pageCount}\n`;
    txt += `  Original Words:    ${doc.wordCount}\n`;
    txt += `  Engine:            ${doc.extractionEngine}\n`;
    txt += `  Export Date:       ${generatedAt}\n\n`;

    txt += `-----------------------------------------------------\n`;
    txt += `SUMMARY (${summary.lengthPreset.toUpperCase()}):\n`;
    txt += `-----------------------------------------------------\n`;

    const cleanSummary = summary.content
      .replace(/^#+\s+/gm, '')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1');
    txt += `${cleanSummary.trim()}\n\n`;

    if (summary.keyTakeaways && summary.keyTakeaways.length > 0) {
      txt += `-----------------------------------------------------\n`;
      txt += `KEY TAKEAWAYS:\n`;
      txt += `-----------------------------------------------------\n`;
      for (const point of summary.keyTakeaways) {
        txt += `  * ${point}\n`;
      }
      txt += `\n`;
    }

    if (summary.improvementSuggestions && summary.improvementSuggestions.length > 0) {
      txt += `-----------------------------------------------------\n`;
      txt += `IMPROVEMENT SUGGESTIONS:\n`;
      txt += `-----------------------------------------------------\n`;
      summary.improvementSuggestions.forEach((suggestion, index) => {
        txt += `  ${index + 1}. ${suggestion}\n`;
      });
      txt += `\n`;
    }

    return txt;
  }

  /**
   * Formats export payload for clipboard copy
   */
  public static formatForClipboard(payload: DocumentExportData): string {
    return this.formatAsMarkdown(payload);
  }

  /**
   * Sanitizes filenames preventing illegal filesystem characters
   */
  public static sanitizeExportFilename(filename: string, extension: string): string {
    const baseName = filename.replace(/\.[^/.]+$/, '');
    const safeName = baseName.replace(/[/\\?%*:|"<>]/g, '-').trim() || 'document';
    const cleanExt = extension.startsWith('.') ? extension : `.${extension}`;
    return `${safeName}-summary${cleanExt}`;
  }

  /**
   * Triggers client-side browser download for generated file content
   */
  public static downloadFile(content: string, filename: string, mimeType: string): void {
    if (typeof window === 'undefined') return;

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
