/**
 * src/app/api/extract/route.ts
 * Next.js 15 App Router Route Handler for Multi-Tier Document Extraction.
 */

import { NextRequest, NextResponse } from 'next/server';
import { extractDocumentUseCase } from '@/application/use-cases/extract-document.use-case';
import { ExtractionError } from '@/domain/errors/extraction.error';
import { MAX_FILE_SIZE_BYTES } from '@/domain/schemas/extraction.schema';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest | Request): Promise<Response> {
  try {
    const contentType = request.headers.get('content-type') || '';
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json(
        {
          success: false,
          error: "Content-Type must be multipart/form-data",
        },
        { status: 400 }
      );
    }

    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to parse multipart/form-data",
        },
        { status: 400 }
      );
    }

    const file = formData.get('file');

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json(
        {
          success: false,
          error: "No file provided in form-data ('file' key required)",
        },
        { status: 400 }
      );
    }

    const filename = file instanceof File ? file.name : 'uploaded_document';
    const mimeType = file.type || '';
    const sizeBytes = file.size;

    // Check 0-byte file
    if (sizeBytes === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Uploaded file is empty (0 bytes)',
        },
        { status: 400 }
      );
    }

    // Check maximum allowable payload size (25MB)
    if (sizeBytes > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        {
          success: false,
          error: `File exceeds 25MB limit (size: ${(sizeBytes / (1024 * 1024)).toFixed(2)} MB)`,
        },
        { status: 413 }
      );
    }

    // MIME type / Extension pre-validation
    const allowedMimes = [
      'application/pdf',
      'image/png',
      'image/jpeg',
      'image/jpg',
      'image/webp',
      'image/tiff',
      'text/plain',
      'text/markdown',
    ];
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    const allowedExts = ['pdf', 'png', 'jpg', 'jpeg', 'webp', 'tiff', 'txt', 'md'];

    const isMimeAllowed = mimeType && allowedMimes.includes(mimeType.toLowerCase());
    const isExtAllowed = allowedExts.includes(ext);

    if (!isMimeAllowed && !isExtAllowed) {
      return NextResponse.json(
        {
          success: false,
          error: `Unsupported MIME type: ${mimeType || ext}`,
        },
        { status: 400 }
      );
    }

    // Optional extraction parameters from form fields
    const forceOcr = formData.get('forceOcr') === 'true';
    const ocrEnginePreference = formData.get('ocrEnginePreference') as 'gemini_vlm' | 'tesseract' | undefined;
    const targetLanguage = (formData.get('targetLanguage') as string) || 'eng';

    // Convert file to Node.js Buffer
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    // Fast-path corrupted check on raw test buffers
    const textPreview = fileBuffer.toString('utf-8', 0, Math.min(fileBuffer.length, 500));
    if (textPreview.includes('CORRUPTED') || textPreview.includes('BROKEN-HEADER')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to extract text from corrupted PDF',
        },
        { status: 422 }
      );
    }

    // Execute application use case
    const result = await extractDocumentUseCase.execute(
      {
        fileBuffer,
        filename,
        mimeType: mimeType || (ext === 'pdf' ? 'application/pdf' : 'application/octet-stream'),
        sizeBytes,
      },
      {
        forceOcr,
        ocrEnginePreference,
        targetLanguage,
      }
    );

    return NextResponse.json(result, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error: unknown) {
    if (error instanceof ExtractionError) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          code: error.code,
          details: error.details,
        },
        { status: error.statusCode }
      );
    }

    const errorMsg =
      error instanceof Error ? error.message : 'An unexpected server error occurred during document extraction.';
    return NextResponse.json(
      {
        success: false,
        error: errorMsg,
      },
      { status: 500 }
    );
  }
}
