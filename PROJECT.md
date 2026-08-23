# Project: DocuSense AI (Document Summary Assistant)

## Architecture
- **Clean Hexagonal Architecture**:
  - `src/domain/`: Pure domain types, schemas (Zod), entities, interfaces (ports)
  - `src/application/`: Application services, use-cases (`extractDocumentUseCase`, `summarizeDocumentUseCase`)
  - `src/infrastructure/`: Adapters for external engines (`unpdfAdapter`, `tesseractAdapter`, `geminiExtractionAdapter`, `geminiSummarizationAdapter`, `aiSdkAdapter`)
  - `src/components/`: Reusable UI components (shadcn/ui primitives, `DocumentUploader`, `SummaryViewer`, `PresetSelector`, `ExportMenu`, `Navbar`)
  - `src/app/`: Next.js 15 App Router pages, layouts, and API Route Handlers (`/api/extract`, `/api/summarize`, `/api/health`)

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---|---|---|---|
| 1 | Next.js 15 & TS Scaffolding | Next.js 15 App Router, TypeScript strict, Tailwind CSS, Lucide icons, shadcn/ui setup | M1 | Survey |
| 2 | Clean Hexagonal Architecture | Domain schemas, ports, use-cases, and infrastructure adapter abstractions | M1 | Survey / ADR-001 |
| 3 | Digital PDF Extraction | High-speed in-memory text & metadata extraction using `unpdf` (<50ms) | M1 | Survey / ADR-002 |
| 4 | Image & Scanned PDF OCR | Optical character recognition for images (PNG/JPG/WEBP) and scanned PDFs using `tesseract.js` | M1 | Survey / ADR-002 |
| 5 | Multimodal VLM OCR Fallback | Fallback to Google Gemini Flash Vision for complex scanned documents | M1 | Survey / ADR-002 |
| 6 | Extraction API (`/api/extract`) | Unified multipart/form-data endpoint with mime validation, size limits (25MB), routing | M1 | Survey / PRD |
| 7 | AI Summarization Service | Core summarization use case using Vercel AI SDK and Google Gemini 2.0/1.5 Flash | M2 | Survey / ADR-003 |
| 8 | Multi-Fidelity Length Presets | Short (~150 words), Medium (~400 words), and Long (~900 words) summary modes | M2 | Survey / PRD |
| 9 | Key Takeaways & Action Points | Structured extraction of bulleted takeaways, metrics, and actionable improvement suggestions | M2 | Survey / PRD |
| 10 | Streaming SSE Route (`/api/summarize`) | Server-Sent Events endpoint streaming chunked markdown tokens | M2 | Survey / ADR-003 |
| 11 | Dynamic Markdown Streaming UI | Real-time markdown rendering with syntax highlighting, sanitization, copy-to-clipboard | M2 | Survey / PRD |
| 12 | Document Uploader UI | Drag-and-drop file upload zone with progress bars, file inspection, and clear/reset | M1 | Survey / PRD |
| 13 | Multi-Format Export Suite | Client-side export to Markdown (.md), Plain Text (.txt), JSON (.json), and Clipboard | M3 | Survey / PRD |
| 14 | Responsive UI & Dark/Light Theme | Modern responsive layout with glassmorphic styling, mobile drawer/tabs, dark mode | M3 | Survey / PRD |
| 15 | Error Handling & Toast Feedback | User-friendly error states, retry triggers, toast notifications, offline resiliency | M3 | Survey / PRD |
| 16 | Git Version Control History | Initialized local git repository with at least 3 sequential commits (R1, R2, R3) | M1/M2/M3 | ORIGINAL_REQUEST |
| 17 | Bug Log & Documentation | Maintained `docs/BUG_LOG.md` recording encountered anomalies and solutions | M1/M2/M3 | ORIGINAL_REQUEST |
| 18 | Opaque-Box E2E Testing Suite | Comprehensive test harness covering Tiers 1-4 and Tier 5 adversarial verification | E2E | ORIGINAL_REQUEST |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|---|---|---|---|
| E2E | E2E Testing Track | Requirement-driven test harness, mock fixtures, automated test runner (Tiers 1-4) | none | DONE |
| 1 | Milestone 1 (R1 Scaffolding & Extraction) | Next.js 15, Tailwind, shadcn/ui, Hexagonal layout, unpdf, tesseract.js, /api/extract, Git Commit 1 | none | DONE |
| 2 | Milestone 2 (R2 Summarization & Streaming) | Gemini AI integration, Vercel AI SDK, SSE /api/summarize, length presets, streaming UI, Git Commit 2 | M1 | DONE |
| 3 | Milestone 3 (R3 Polish, Export & Docs) | Export (.md, .txt, .json, copy), UI polish, error handling, BUG_LOG.md, Git Commit 3 | M2 | DONE |
| 4 | Final Milestone (Verification & Hardening) | 100% pass of E2E test suite (Tiers 1-4) + Tier 5 adversarial hardening | E2E, M3 | DONE |

## Interface Contracts
### Document Extraction Contract (`/api/extract`)
- **Request**: `multipart/form-data` with `file: File` (PDF, PNG, JPG, JPEG, WEBP; max 25MB)
- **Response**: `200 OK` JSON:
  ```json
  {
    "success": true,
    "text": "Extracted plain text content...",
    "metadata": {
      "filename": "document.pdf",
      "mimeType": "application/pdf",
      "sizeBytes": 10240,
      "pageCount": 3,
      "wordCount": 850,
      "characterCount": 4900,
      "extractionEngine": "unpdf" | "tesseract" | "gemini_vlm",
      "extractedAt": "2026-08-21T18:50:00.000Z"
    }
  }
  ```
- **Errors**: `400 Bad Request` (invalid mime, empty file), `413 Payload Too Large` (>25MB), `422 Unprocessable Entity` (unextractable/corrupted), `500 Internal Server Error`

### Summarization Contract (`/api/summarize`)
- **Request**: `application/json`:
  ```json
  {
    "text": "Document content to summarize...",
    "length": "short" | "medium" | "long",
    "extractKeyPoints": true,
    "extractSuggestions": true
  }
  ```
- **Response**: `200 OK` Server-Sent Events (`text/event-stream`) streaming text chunks, or JSON stream compatible with Vercel AI SDK.

## Code Layout
```
c:\d_drive\projects\Unthinkable/
├── .agents/
├── docs/
│   ├── adr/
│   ├── prd/
│   └── BUG_LOG.md
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── extract/route.ts
│   │   │   ├── summarize/route.ts
│   │   │   └── health/route.ts
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── application/
│   │   ├── dto/
│   │   ├── services/
│   │   └── use-cases/
│   ├── domain/
│   │   ├── errors/
│   │   ├── models/
│   │   ├── ports/
│   │   └── schemas/
│   ├── infrastructure/
│   │   ├── adapters/
│   │   └── config/
│   ├── components/
│   │   ├── ui/
│   │   ├── DocumentUploader.tsx
│   │   ├── SummaryViewer.tsx
│   │   ├── PresetSelector.tsx
│   │   ├── ExportMenu.tsx
│   │   └── Navbar.tsx
│   └── lib/
│       └── utils.ts
├── tests/
│   ├── fixtures/
│   ├── unit/
│   └── e2e/
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.ts
├── .gitignore
├── .env.example
└── README.md
```
