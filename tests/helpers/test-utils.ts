/**
 * Test Utilities and Assertion Helpers for DocuSense AI Test Suites.
 * Provides FormData builders, SSE parser, HTTP request mockers, and schema validators.
 */

export interface ExtractionResponseData {
  success: boolean;
  text?: string;
  metadata?: {
    filename: string;
    mimeType: string;
    sizeBytes: number;
    pageCount: number;
    wordCount: number;
    characterCount: number;
    extractionEngine: "unpdf" | "tesseract" | "gemini_vlm" | string;
    extractedAt: string;
  };
  error?: string;
}

export interface SummarizationRequestPayload {
  text: string;
  length?: "short" | "medium" | "long";
  extractKeyPoints?: boolean;
  extractSuggestions?: boolean;
}

/**
 * Creates a standard Web Request with multipart/form-data payload.
 */
export function createMultipartRequest(
  url: string,
  fileBuffer: Buffer | Uint8Array,
  filename: string,
  mimeType: string,
  fieldName: string = "file",
  additionalFields: Record<string, string> = {}
): Request {
  const formData = new FormData();
  // Using Blob / File polyfill in Node 18+
  const blob = new Blob([fileBuffer as any], { type: mimeType });
  formData.append(fieldName, blob, filename);

  for (const [key, val] of Object.entries(additionalFields)) {
    formData.append(key, val);
  }

  return new Request(url, {
    method: "POST",
    body: formData,
  });
}

/**
 * Creates a standard Web Request with application/json payload.
 */
export function createJsonRequest(url: string, payload: unknown, method: string = "POST"): Request {
  return new Request(url, {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

/**
 * Parses Server-Sent Events (SSE) stream from a Response object into distinct text chunks and events.
 */
export async function parseSseStream(response: Response): Promise<{
  rawChunks: string[];
  fullText: string;
  events: Array<{ event?: string; data: string }>;
}> {
  if (!response.body) {
    throw new Error("Response body is null, cannot parse SSE stream");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  const rawChunks: string[] = [];
  const events: Array<{ event?: string; data: string }> = [];
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    rawChunks.push(chunk);
    buffer += chunk;

    const lines = buffer.split(/\r?\n\r?\n/);
    buffer = lines.pop() || "";

    for (const block of lines) {
      if (!block.trim()) continue;
      const subLines = block.split(/\r?\n/);
      let currentEvent: string | undefined;
      let currentData = "";

      for (const line of subLines) {
        if (line.startsWith("event:")) {
          currentEvent = line.substring(6).trim();
        } else if (line.startsWith("data:")) {
          const dataContent = line.substring(5).trim();
          currentData = currentData ? `${currentData}\n${dataContent}` : dataContent;
        } else if (line.startsWith("0:") || line.startsWith("1:")) {
          // Vercel AI SDK data protocol format
          currentData += line;
        }
      }

      if (currentData || currentEvent) {
        events.push({ event: currentEvent, data: currentData });
      }
    }
  }

  // Handle any remaining trailing buffer
  if (buffer.trim()) {
    events.push({ data: buffer.trim() });
  }

  // Reassemble full text content from decoded SSE events
  let decodedText = "";
  for (const ev of events) {
    if (!ev.data || ev.data === "[DONE]") continue;
    try {
      const parsed = JSON.parse(ev.data);
      if (typeof parsed.chunk === "string") {
        decodedText += parsed.chunk;
      } else if (typeof parsed.text === "string") {
        decodedText += parsed.text;
      } else {
        decodedText += ev.data;
      }
    } catch {
      decodedText += ev.data;
    }
  }

  const fullText = decodedText || rawChunks.join("");

  return { rawChunks, fullText, events };
}

/**
 * Counts words in a string accurately.
 */
export function countWords(text: string): number {
  if (!text || !text.trim()) return 0;
  return text.trim().split(/\s+/).length;
}

/**
 * Validates ISO 8601 timestamp string.
 */
export function isValidIsoDate(dateString: string): boolean {
  const date = new Date(dateString);
  return !isNaN(date.getTime()) && dateString.includes("T");
}
