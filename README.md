# DocuSense AI — Intelligent Document Summary & Critique Assistant

DocuSense AI is a high-performance, privacy-first web application engineered on **Next.js 15 App Router**, **TypeScript**, and **Tailwind CSS**. It incorporates a **Clean Hexagonal Architecture** with a **Tri-Tier Adaptive Document Extraction Pipeline** and **Multi-Fidelity AI Summarization**.

---

## 🌟 Key Features

- **Tri-Engine Adaptive Extraction Pipeline**:
  - **Tier 1 (Digital PDF)**: In-memory extraction and metadata analysis powered by `unpdf` (<50ms execution).
  - **Tier 2 (Multimodal VLM Vision)**: Optical character recognition via Google Gemini Vision API for complex layouts, handwriting, and tables.
  - **Tier 3 (Local WASM OCR)**: Sandboxed local optical character recognition powered by `tesseract.js` WebAssembly for offline resilience.
- **Privacy-First Architecture**: All uploaded documents are processed ephemerally in memory (Buffer/Uint8Array) with zero persistent disk storage.
- **Modern Responsive Dashboard**: Glassmorphic UI, drag-and-drop ingestion zone, live progress indicators, collapsible plain-text viewer, and document telemetry (word count, reading time, character count).
- **Multi-Fidelity Summaries (Milestone 2)**: Short (~150w TL;DR), Medium (~400w Synthesis), and Long (~900w Deep-Dive) summarization modes.
- **Multi-Format Export Suite (Milestone 3)**: 1-click client-side export to Markdown (.md), JSON (.json), Plain Text (.txt), and clipboard.

---

## 🏗️ Architecture Layout

```
src/
├── app/                    # Next.js 15 App Router (Routes, API endpoints, layouts, globals)
│   ├── api/
│   │   ├── extract/        # POST /api/extract (multipart/form-data ingestion)
│   │   ├── summarize/      # POST /api/summarize (SSE streaming generation)
│   │   └── health/         # GET /api/health (Service telemetry)
│   ├── globals.css         # Tailwind tokens & dark mode styling
│   ├── layout.tsx          # Root layout with ThemeProvider & Sonner Toaster
│   └── page.tsx            # Main interactive dashboard
├── application/            # Application Use-Cases & Services
│   ├── dto/                # Data Transfer Objects
│   ├── services/           # DocumentNormalizer, PromptBuilder
│   └── use-cases/          # ExtractDocumentUseCase, SummarizeDocumentUseCase
├── domain/                 # Pure Domain Layer (Entities, Models, Schemas, Ports, Errors)
│   ├── errors/             # Typed domain errors & HTTP mappings
│   ├── models/             # Document, Summary, Export types
│   ├── ports/              # Hexagonal interface contracts (IExtractionEngine, etc.)
│   └── schemas/            # Zod validation schemas
├── infrastructure/         # Concrete Adapters & Configuration
│   ├── adapters/           # unpdf-adapter, gemini-vlm-adapter, tesseract-adapter
│   └── config/             # Environment validation & constants
├── components/             # Presentation Components
│   ├── ui/                 # Reusable shadcn/ui primitives
│   ├── DocumentUploader.tsx# Drag-and-drop ingestion & progress UI
│   ├── Navbar.tsx          # Header with logo, pipeline status, theme toggle
│   └── ThemeProvider.tsx   # next-themes wrapper
└── lib/                    # Core utilities (cn, formatBytes, readingTime, exportUtils)
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ / 20+ / 22+
- npm / pnpm / yarn

### Installation
```bash
npm install
```

### Environment Configuration
Copy `.env.example` to `.env.local` and provide your Google Gemini API key:
```env
GEMINI_API_KEY=your_gemini_api_key_here
GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_api_key_here
```

### Development Server
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm run start
```

### Running Tests
```bash
npm run test
```

---

## 📄 License
MIT
