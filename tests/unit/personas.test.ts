/**
 * tests/unit/personas.test.ts
 * Unit tests for Domain-Specific Summary Personas and Q&A Prompt Generation.
 */

import { describe, it, expect } from 'vitest';
import { PromptEngineeringService } from '@/application/services/PromptEngineeringService';

describe('PromptEngineeringService - Domain Personas & Q&A', () => {
  const sampleDoc = 'Company XYZ reported Q2 2026 revenue of $120M with a 15% EBITDA margin and signed a multi-year cloud SLA with indemnity limits of $5M.';

  it('should generate legal persona prompt containing corporate counsel directives', () => {
    const prompt = PromptEngineeringService.buildSummarizationPrompt({
      text: sampleDoc,
      preset: 'medium',
      persona: 'legal',
    });

    expect(prompt).toContain('LEGAL & REGULATORY CONTRACT REVIEW');
    expect(prompt).toContain('Corporate Counsel');
    expect(prompt).toContain('indemnity');
    expect(prompt).toContain('<document_content>');
    expect(prompt).toContain(sampleDoc);
  });

  it('should generate financial persona prompt focusing on EBITDA and earnings', () => {
    const prompt = PromptEngineeringService.buildSummarizationPrompt({
      text: sampleDoc,
      preset: 'short',
      persona: 'financial',
    });

    expect(prompt).toContain('FINANCIAL & EARNINGS BREAKDOWN');
    expect(prompt).toContain('EBITDA');
    expect(prompt).toContain('revenue');
    expect(prompt).toContain(sampleDoc);
  });

  it('should generate academic persona prompt focusing on methodology and claims', () => {
    const prompt = PromptEngineeringService.buildSummarizationPrompt({
      text: sampleDoc,
      preset: 'long',
      persona: 'academic',
    });

    expect(prompt).toContain('ACADEMIC & PEER-REVIEW RESEARCH ANALYSIS');
    expect(prompt).toContain('methodology');
    expect(prompt).toContain('limitations');
  });

  it('should construct secure conversational chat prompt with history and XML guard', () => {
    const chatPrompt = PromptEngineeringService.buildChatPrompt({
      documentText: sampleDoc,
      question: 'What is the revenue and indemnity limit?',
      history: [
        { id: '1', role: 'user', content: 'Hello', timestamp: '2026-08-24T00:00:00Z' },
        { id: '2', role: 'assistant', content: 'Hi there!', timestamp: '2026-08-24T00:00:01Z' },
      ],
    });

    expect(chatPrompt).toContain('What is the revenue and indemnity limit?');
    expect(chatPrompt).toContain('CONVERSATION HISTORY:');
    expect(chatPrompt).toContain('<document_content>');
    expect(chatPrompt).toContain(sampleDoc);
    expect(chatPrompt).toContain('SECURITY & ISOLATION DIRECTIVES');
  });
});
