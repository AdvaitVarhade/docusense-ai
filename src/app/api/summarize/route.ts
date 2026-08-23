/**
 * src/app/api/summarize/route.ts
 * Next.js 15 App Router Route Handler: Server-Sent Events (SSE) Document Summarization Stream.
 */

import { NextRequest, NextResponse } from 'next/server';
import { summarizeDocumentUseCase } from '@/application/use-cases/summarize-document.use-case';
import { SummarizeRequestSchema } from '@/domain/schemas/summarization.schema';
import { SummarizationError } from '@/domain/errors/summarization.error';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest | Request): Promise<Response> {
  try {
    // 1. Content-Type Header Verification
    const contentType = request.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return NextResponse.json(
        { error: 'Content-Type must be application/json' },
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 2. Parse JSON Request Body
    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Failed to parse JSON body or missing 'text' field" },
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!rawBody || typeof rawBody !== 'object') {
      return NextResponse.json(
        { error: "Missing or empty 'text' field in request body" },
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 3. Schema Validation via Zod
    const parseResult = SummarizeRequestSchema.safeParse(rawBody);
    if (!parseResult.success) {
      const firstError = parseResult.error.errors[0]?.message || "Invalid request payload";
      return NextResponse.json(
        { error: firstError },
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const {
      text,
      length = 'medium',
      extractKeyPoints = true,
      extractSuggestions = true,
      documentMeta,
    } = parseResult.data;

    // 4. Verification for whitespace-only text
    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { error: "Missing or empty 'text' field in request body" },
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 5. Execute Summarization Streaming Use Case
    const stream = await summarizeDocumentUseCase.executeStream({
      text,
      preset: length,
      extractKeyPoints,
      extractSuggestions,
      meta: documentMeta as any,
    });

    // 6. Return Server-Sent Events (SSE) Stream Response
    return new Response(stream, {
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (error: unknown) {
    if (error instanceof SummarizationError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred during summarization.';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
