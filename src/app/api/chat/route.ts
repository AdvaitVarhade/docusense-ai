/**
 * src/app/api/chat/route.ts
 * Streaming SSE Route Handler for Interactive Conversational Document Q&A.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { chatDocumentUseCase } from '@/application/use-cases/chat-document.use-case';

const chatRequestSchema = z.object({
  documentText: z.string().min(1, 'Document text is required'),
  question: z.string().min(1, 'Question is required'),
  history: z
    .array(
      z.object({
        id: z.string(),
        role: z.enum(['user', 'assistant', 'system']),
        content: z.string(),
        timestamp: z.string(),
      })
    )
    .optional(),
  meta: z.record(z.unknown()).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const parsed = chatRequestSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid chat request body',
            details: parsed.error.format(),
          },
        },
        { status: 400 }
      );
    }

    const stream = await chatDocumentUseCase.executeStream({
      documentText: parsed.data.documentText,
      question: parsed.data.question,
      history: parsed.data.history,
      meta: parsed.data.meta as any,
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Chat processing failed';
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'CHAT_ERROR',
          message,
        },
      },
      { status: 500 }
    );
  }
}
