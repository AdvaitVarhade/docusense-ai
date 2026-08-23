import { describe, it, expect } from 'vitest';
import { PromptEngineeringService } from '@/application/services/PromptEngineeringService';
import { SummarizeRequestSchema } from '@/domain/schemas/summarization.schema';
import { MockSummarizerAdapter } from '@/infrastructure/adapters/mock-summarizer.adapter';
import { SummarizerAdapterFactory } from '@/infrastructure/adapters/summarizer-factory';
import { SummarizeDocumentUseCase } from '@/application/use-cases/summarize-document.use-case';
import { EmptySummaryTextError, InvalidPresetError } from '@/domain/errors/summarization.error';

describe('Summarization Domain & Service Unit Tests', () => {
  it('should construct short prompt with anti-injection encapsulation', () => {
    const prompt = PromptEngineeringService.buildSummarizationPrompt({
      text: 'Sample research paper about artificial intelligence.',
      preset: 'short',
      extractKeyPoints: true,
      extractSuggestions: true,
    });

    expect(prompt).toContain('<document_content>');
    expect(prompt).toContain('Sample research paper about artificial intelligence.');
    expect(prompt).toContain('</document_content>');
    expect(prompt).toContain('PRESET: SHORT');
    expect(prompt).toContain('KEY TAKEAWAYS');
    expect(prompt).toContain('CRITICAL OPERATIONAL RULES');
  });

  it('should construct long prompt with mandatory numbered sections', () => {
    const prompt = PromptEngineeringService.buildSummarizationPrompt({
      text: 'Complex engineering specification and benchmark results.',
      preset: 'long',
      extractKeyPoints: false,
      extractSuggestions: false,
    });

    expect(prompt).toContain('PRESET: LONG');
    expect(prompt).toContain('## 1. Context & Architectural Overview');
    expect(prompt).toContain('## 2. Methodology & Quantitative Findings');
    expect(prompt).toContain('## 3. Risk Assessment & Engineering Tradeoffs');
    expect(prompt).toContain('## 4. Strategic Outlook & Recommendations');
  });

  it('should parse structured key takeaways and suggestions from markdown', () => {
    const rawMarkdown = `# Executive Summary (Medium Preset)

This is a high quality summary.

## Key Takeaways
- **4.2x Speedup**: Measured in convergence tests.
- **38% Cost Reduction**: Achieved across multi-region deployment.

## Improvement Suggestions
1. **Clarity**: Clarify the mathematical notation for qubits.
2. **Completeness**: Provide comparative analysis against baseline.
`;

    const result = PromptEngineeringService.parseStructuredAnalysis(rawMarkdown, {
      text: 'test',
      preset: 'medium',
    });

    expect(result.keyPoints.length).toBe(2);
    expect(result.keyPoints[0].description).toContain('4.2x Speedup');
    expect(result.suggestions.length).toBe(2);
    expect(result.suggestions[0].category).toBe('clarity');
  });

  it('should validate request schema and reject whitespace or empty text', () => {
    const valid = SummarizeRequestSchema.safeParse({
      text: 'Valid document text for summarization.',
      length: 'medium',
    });
    expect(valid.success).toBe(true);

    const empty = SummarizeRequestSchema.safeParse({
      text: '',
    });
    expect(empty.success).toBe(false);

    const whitespace = SummarizeRequestSchema.safeParse({
      text: '   \n\t  ',
    });
    expect(whitespace.success).toBe(false);
  });

  it('should generate stream and structured analysis with MockSummarizerAdapter', async () => {
    const adapter = new MockSummarizerAdapter();
    const stream = await adapter.streamSummary({
      text: 'Quantum algorithm research paper',
      preset: 'short',
      extractKeyPoints: true,
      extractSuggestions: true,
    });

    expect(stream).toBeDefined();

    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let accumulated = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      accumulated += decoder.decode(value);
    }

    expect(accumulated).toContain('data:');
    expect(accumulated).toContain('[DONE]');
    expect(accumulated.toLowerCase()).toContain('quantum');
  });

  it('should throw domain errors for empty input or invalid preset in use case', async () => {
    const useCase = new SummarizeDocumentUseCase();

    await expect(
      useCase.executeStream({ text: '', preset: 'medium' })
    ).rejects.toThrow(EmptySummaryTextError);

    await expect(
      useCase.executeStream({ text: '   ', preset: 'medium' })
    ).rejects.toThrow(EmptySummaryTextError);

    await expect(
      useCase.executeStream({ text: 'Valid text', preset: 'ultra-long' as any })
    ).rejects.toThrow(InvalidPresetError);
  });

  it('should route to mock adapter via factory when forceMock is true or unconfigured', () => {
    const engine = SummarizerAdapterFactory.getEngine(true);
    expect(engine.providerName).toBe('mock_offline_engine');
  });
});
