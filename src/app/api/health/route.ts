/**
 * src/app/api/health/route.ts
 * Health check endpoint for uptime and service readiness monitoring.
 */

import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(): Promise<Response> {
  const geminiConfigured = Boolean(
    process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY
  );

  return NextResponse.json(
    {
      status: 'ok',
      service: 'DocuSense AI Extraction & Summarization Engine',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      capabilities: {
        digitalPdf: true,
        wasmOcr: true,
        vlmVision: geminiConfigured,
      },
    },
    { status: 200 }
  );
}
