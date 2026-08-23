/**
 * src/domain/models/summary.ts
 * Core domain types and interfaces for AI document summarization.
 */

import { DocumentMetadata, DocumentMeta } from './document';

export type SummaryPreset = 'short' | 'medium' | 'long';

export interface KeyPoint {
  id: string;
  title: string;
  description: string;
  category?: 'strategic' | 'operational' | 'risk' | 'metric' | 'takeaway';
}

export interface ImprovementSuggestion {
  id: string;
  category: 'clarity' | 'structure' | 'completeness' | 'actionable';
  title: string;
  suggestion: string;
  severity: 'low' | 'medium' | 'high';
}

export interface DocumentAnalysisResult {
  documentMeta?: Partial<DocumentMetadata> | DocumentMeta;
  preset: SummaryPreset;
  summaryMarkdown: string;
  keyPoints: KeyPoint[];
  suggestions: ImprovementSuggestion[];
  generatedAt: string;
}

export interface SummarizationInput {
  text: string;
  length?: SummaryPreset;
  extractKeyPoints?: boolean;
  extractSuggestions?: boolean;
  documentMeta?: Partial<DocumentMetadata> | DocumentMeta;
}
