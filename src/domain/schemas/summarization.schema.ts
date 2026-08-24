/**
 * src/domain/schemas/summarization.schema.ts
 * Zod validation schemas for AI document summarization requests and responses.
 */

import { z } from 'zod';

export const SummaryPresetSchema = z.enum(['short', 'medium', 'long']);
export const SummaryPersonaSchema = z.enum(['general', 'legal', 'financial', 'academic']);

export const SummarizeRequestSchema = z
  .object({
    text: z.string().optional(),
    documentText: z.string().optional(),
    length: SummaryPresetSchema.default('medium').optional(),
    preset: SummaryPresetSchema.optional(),
    persona: SummaryPersonaSchema.default('general').optional(),
    extractKeyPoints: z.boolean().default(true).optional(),
    extractSuggestions: z.boolean().default(true).optional(),
    documentMeta: z.record(z.unknown()).optional(),
    metadata: z.record(z.unknown()).optional(),
  })
  .transform((data) => {
    const rawText = data.text !== undefined ? data.text : data.documentText !== undefined ? data.documentText : '';
    const resolvedLength = data.length || data.preset || 'medium';
    const resolvedMeta = data.documentMeta || data.metadata;
    return {
      ...data,
      text: typeof rawText === 'string' ? rawText : '',
      length: resolvedLength,
      documentMeta: resolvedMeta,
    };
  })
  .refine((data) => data.text.trim().length > 0, {
    message: "Missing or empty 'text' field in request body",
    path: ['text'],
  });

export const KeyPointSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  category: z.enum(['strategic', 'operational', 'risk', 'metric', 'takeaway']).optional(),
});

export const ImprovementSuggestionSchema = z.object({
  id: z.string(),
  category: z.enum(['clarity', 'structure', 'completeness', 'actionable']),
  title: z.string(),
  suggestion: z.string(),
  severity: z.enum(['low', 'medium', 'high']),
});

export const DocumentAnalysisResultSchema = z.object({
  documentMeta: z.record(z.unknown()).optional(),
  preset: SummaryPresetSchema,
  summaryMarkdown: z.string(),
  keyPoints: z.array(KeyPointSchema),
  suggestions: z.array(ImprovementSuggestionSchema),
  generatedAt: z.string(),
});

export type SummaryPresetDto = z.infer<typeof SummaryPresetSchema>;
export type SummarizeRequestDto = z.infer<typeof SummarizeRequestSchema>;
export type KeyPointDto = z.infer<typeof KeyPointSchema>;
export type ImprovementSuggestionDto = z.infer<typeof ImprovementSuggestionSchema>;
export type DocumentAnalysisResultDto = z.infer<typeof DocumentAnalysisResultSchema>;
