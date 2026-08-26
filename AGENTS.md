# Workspace Rules for DocuSense AI

## 1. Documentation & Formatting Standards
- Maintain a clean, professional, publication-ready style in all Markdown documentation (`README.md`, `docs/*.md`).
- Do not use decorative emojis in titles, headings, badges, or list items unless explicitly asked by the user.

## 2. API Contract & Schema Robustness
- In API route handlers (`src/app/api/**/route.ts`), always design Zod validation schemas to tolerate interchangeable parameter aliases.
- Use `.transform()` on incoming payloads to normalize:
  - `text` / `documentText` -> `text`
  - `length` / `preset` -> `length`
  - `documentMeta` / `metadata` / `meta` -> `documentMeta`
- Enforce business logic validation (e.g. non-empty strings) on the normalized object.

## 3. Streaming & Model Cascade Guidelines
- For Next.js 15 App Router Server-Sent Events (SSE) endpoints:
  - Always specify `export const runtime = 'nodejs'` and `export const dynamic = 'force-dynamic'`.
  - Include headers: `Cache-Control: no-cache, no-transform`, `Connection: keep-alive`, `X-Accel-Buffering: no`.
  - Handle model fallback cascades inside stream controllers to gracefully recover without prematurely closing the controller.
