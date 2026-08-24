/**
 * tests/e2e/chat.test.ts
 * End-to-end API tests for POST /api/chat streaming route and mock conversational fallback.
 */

import { describe, it, expect } from 'vitest';
import { POST } from '@/app/api/chat/route';
import { parseSseStream } from '../helpers/test-utils';

describe('POST /api/chat - Interactive Document Q&A Stream', () => {
  const sampleText = 'Quantum Annealing Processor Q-200 achieves a 10x speedup across combinatorial optimization problems. Decoherence time is 120 microseconds.';

  it('should stream an answer to a question using Server-Sent Events', async () => {
    const req = new Request('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        documentText: sampleText,
        question: 'What is the speedup factor?',
      }),
    });

    const res = await POST(req as any);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/event-stream');

    const { fullText } = await parseSseStream(res);
    expect(fullText.length).toBeGreaterThan(10);
  });

  it('should reject requests with missing question with a 400 Bad Request', async () => {
    const req = new Request('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        documentText: sampleText,
        question: '',
      }),
    });

    const res = await POST(req as any);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.success).toBe(false);
  });

  it('should reject requests with missing documentText with a 400 Bad Request', async () => {
    const req = new Request('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        documentText: '',
        question: 'What is this?',
      }),
    });

    const res = await POST(req as any);
    expect(res.status).toBe(400);
  });
});
