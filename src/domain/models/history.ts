/**
 * src/domain/models/history.ts
 * Types and storage models for client-side encrypted History Vault.
 */

import { DocumentMetadata, DocumentMeta } from './document';
import { SummaryPreset, SummaryPersona, KeyPoint, ImprovementSuggestion } from './summary';

export interface HistoryEntry {
  id: string;
  documentName: string;
  documentMeta: Partial<DocumentMetadata> | DocumentMeta;
  documentText: string;
  preset: SummaryPreset;
  persona?: SummaryPersona;
  summaryMarkdown: string;
  keyPoints: KeyPoint[];
  suggestions: ImprovementSuggestion[];
  createdAt: string;
}
