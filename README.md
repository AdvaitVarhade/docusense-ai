# DocuSense AI — Intelligent Document Summary & Critique Assistant

[![Next.js 15](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19-blue?style=flat-square&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)
[![Tests](https://img.shields.io/badge/Tests-90%2F90%20Passed-emerald?style=flat-square)](https://github.com/AdvaitVarhade/docusense-ai)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)

**DocuSense AI** is a production-grade full-stack web application designed for intelligent document ingestion, multi-tier layout-aware OCR extraction, and real-time Server-Sent Events (SSE) AI summarization with actionable improvement critiques.

Built for the **Software Engineering Assessment Project**, DocuSense AI couples a **Hexagonal (Ports & Adapters) Architecture** with an adaptive extraction pipeline and multi-model Gemini 3.x fallback routing under a strict zero-cost free-tier operational model.

---

## 📑 Repository & Documentation Index

- **GitHub Repository**: [https://github.com/AdvaitVarhade/docusense-ai](https://github.com/AdvaitVarhade/docusense-ai)
- **Technical Architecture Specification (46-Section Blueprint)**: [`docs/ARCHITECTURE.md`](https://github.com/AdvaitVarhade/docusense-ai/blob/main/docs/ARCHITECTURE.md)
- **IEEE Software Requirements Specification (SRS)**: [`docs/IEEE_SRS_Document.md`](https://github.com/AdvaitVarhade/docusense-ai/blob/main/docs/IEEE_SRS_Document.md)
- **Product Requirements Document (PRD)**: [`docs/prd/PRD-Document-Summary-Assistant.md`](https://github.com/AdvaitVarhade/docusense-ai/blob/main/docs/prd/PRD-Document-Summary-Assistant.md)
- **200-Word Approach Write-Up**: [`docs/APPROACH_SUMMARY.md`](https://github.com/AdvaitVarhade/docusense-ai/blob/main/docs/APPROACH_SUMMARY.md)
- **Compiled PDF Documents**:
  - [IEEE SRS Specification PDF](https://github.com/AdvaitVarhade/docusense-ai/blob/main/docs/IEEE_SRS_Document.pdf)
  - [Technical Architecture PDF](https://github.com/AdvaitVarhade/docusense-ai/blob/main/docs/DocuSense_Technical_Architecture.pdf)
  - [Approach Summary PDF](https://github.com/AdvaitVarhade/docusense-ai/blob/main/docs/DocuSense_Approach_Writeup.pdf)
- **Architecture Decision Records (ADRs)**:
  - [ADR-001: Technology Stack Selection (Next.js 15 + TypeScript)](https://github.com/AdvaitVarhade/docusense-ai/blob/main/docs/adr/ADR-001-Tech-Stack-Selection.md)
  - [ADR-002: Multi-Tier Document Extraction Pipeline](https://github.com/AdvaitVarhade/docusense-ai/blob/main/docs/adr/ADR-002-Document-Extraction-Strategy.md)
  - [ADR-003: AI Model Routing, Streaming & Anti-Injection Guard](https://github.com/AdvaitVarhade/docusense-ai/blob/main/docs/adr/ADR-003-AI-Model-Routing-and-Streaming.md)
- **Defect & Anomaly Log**: [`docs/BUG_LOG.md`](https://github.com/AdvaitVarhade/docusense-ai/blob/main/docs/BUG_LOG.md)

---

## 🌟 Core Capabilities

### 1. Tri-Engine Adaptive Document Extraction
- **Tier 1 (Digital PDF Parser)**: High-speed in-memory text and layout extraction via WebAssembly (`unpdf`) in $< 50\text{ms}$ with zero AI token cost.
- **Tier 2 (Multimodal Vision Engine)**: Google Gemini Flash Vision extraction for complex multi-column documents, tables, and handwritten notes.
- **Tier 3 (Local WASM OCR)**: Zero-cost, 100% offline Optical Character Recognition powered by `tesseract.js` WebAssembly.

### 2. Multi-Fidelity AI Summarization
- **Short Mode (~150 words)**: High-impact executive TL;DR + 3 key takeaways.
- **Medium Mode (~400 words)**: Balanced thematic synthesis with structured sections.
- **Long Mode (~900 words)**: Comprehensive deep dive with methodology evaluation, key arguments, and risk factors.

### 3. Actionable Improvement Critiques
- Structured critique engine analyzing documents across **Clarity**, **Logical Structure**, **Evidence Completeness**, and **Actionable Recommendations**.

### 4. Resilient Streaming & Model Routing
- Real-time Server-Sent Events (SSE) streaming with sub-450ms Time-to-First-Token.
- Dynamic runtime model fallback chain (`gemini-3.6-flash` $\rightarrow$ `gemini-3.5-flash-lite` $\rightarrow$ `mock_offline_engine`) preventing downtime.
- Security-hardened prompt engineering enclosing user inputs within `<document_content>` XML barriers to neutralize prompt injections.

### 5. Multi-Format Client-Side Export Suite
- 1-click downloads for **Markdown** (`.md`), **Formatted JSON** (`.json`), **Plain Text** (`.txt`), and **Formatted Clipboard copy** with filesystem-safe filename sanitization.

---

## 🏗️ System Architecture

```mermaid
flowchart TD
    User([User / Browser]) -->|Upload PDF / Image| Uploader[DocumentUploader UI]
    Uploader -->|POST multipart/form-data| ExtractAPI["/api/extract"]
    
    ExtractAPI --> Router{Adaptive Extraction Router}
    Router -->|Digital PDF| Unpdf[unpdf WASM Parser]
    Router -->|Scanned Image| Tesseract[Tesseract.js WASM OCR]
    Router -->|Complex / Low-DPI| GeminiVLM[Gemini Vision Model]
    
    Unpdf --> Normalizer[Document Normalizer & Telemetry]
    Tesseract --> Normalizer
    GeminiVLM --> Normalizer
    
    Normalizer --> ExtractAPI
    ExtractAPI -->|JSON Metadata & Text| Uploader
    
    Uploader -->|Select Preset & Stream| SummaryView[SummaryViewer UI]
    SummaryView -->|POST application/json| SummarizeAPI["/api/summarize"]
    
    SummarizeAPI --> SecurityGuard[Anti-Injection XML Delimiter Guard]
    SecurityGuard --> FallbackChain{Gemini 3.x Fallback Chain}
    FallbackChain -->|Primary| G36[gemini-3.6-flash]
    FallbackChain -->|Fallback 1| G35[gemini-3.5-flash-lite]
    FallbackChain -->|Fallback 2| Mock[Mock Summarizer Engine]
    
    G36 -->|SSE Token Stream| SummaryView
    G35 -->|SSE Token Stream| SummaryView
    Mock -->|SSE Token Stream| SummaryView
    
    SummaryView --> Export[ExportMenu: Download MD / JSON / TXT / Clipboard]
```

---

## 🚀 Quickstart & Installation

### Prerequisites
- Node.js 18.x / 20.x / 22.x
- npm / pnpm / yarn

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/AdvaitVarhade/docusense-ai.git
cd docusense-ai
npm install
```

### 2. Environment Setup
Create a `.env.local` file in the root directory:
```env
# Google Gemini API Key (https://aistudio.google.com/)
GEMINI_API_KEY=your_gemini_api_key_here
GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_api_key_here

# Optional: Default Model (defaults to gemini-3.6-flash)
GEMINI_MODEL=gemini-3.6-flash
```
*(Note: If no API key is provided, the application automatically operates using its built-in offline mock engine for evaluation).*

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Build for Production
```bash
npm run build
npm run start
```

---

## 🧪 Verification & Test Suite

The repository includes an exhaustive test harness covering 9 test suites and 90 test cases:

```bash
# Run all Vitest unit and end-to-end suites
npm test
```

### Test Coverage Highlights:
- **`tests/unit/extract.test.ts`**: Verifies text normalization, reading time calculation, and file size formatting.
- **`tests/unit/summarize.test.ts`**: Validates prompt generation, Zod schemas, and anti-injection encapsulation.
- **`tests/unit/export.test.ts`**: Tests Markdown, JSON, and Plain Text formatting engines.
- **`tests/e2e/extraction.test.ts`**: Verifies multipart `/api/extract` across PDFs, PNGs, JPEGs, and boundary cases (0-byte, 25MB+).
- **`tests/e2e/summarization.test.ts`**: Tests SSE chunk streaming, length presets, and token delimiters.
- **`tests/e2e/adversarial_hardening.test.ts`**: Validates immunity against prompt injection and jailbreak payloads.
- **`tests/e2e/workflow.test.ts`**: End-to-end real-world user flows.

---

## 📜 License
MIT License. Created by [Advait Varhade](https://github.com/AdvaitVarhade).
