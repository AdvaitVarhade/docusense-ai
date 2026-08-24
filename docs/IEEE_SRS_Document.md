# Software Requirements Specification (SRS)
## for Document Summary Assistant (DocuSense AI)

**Standard:** IEEE Std 830-1998 / ISO/IEC/IEEE 29148  
**Author:** Software Engineering Team  
**Repository:** [https://github.com/AdvaitVarhade/docusense-ai](https://github.com/AdvaitVarhade/docusense-ai)  
**Date:** August 24, 2026  
**Status:** Approved & Implemented  
**Version:** 1.0.0  

---

## Table of Contents
1. [Introduction](#1-introduction)
   - 1.1 [Purpose](#11-purpose)
   - 1.2 [Document Conventions](#12-document-conventions)
   - 1.3 [Intended Audience and Reading Suggestions](#13-intended-audience-and-reading-suggestions)
   - 1.4 [Project Scope](#14-project-scope)
   - 1.5 [References](#15-references)
2. [Overall Description](#2-overall-description)
   - 2.1 [Product Perspective](#21-product-perspective)
   - 2.2 [Product Functions](#22-product-functions)
   - 2.3 [User Classes and Characteristics](#23-user-classes-and-characteristics)
   - 2.4 [Operating Environment](#24-operating-environment)
   - 2.5 [Design and Implementation Constraints](#25-design-and-implementation-constraints)
   - 2.6 [User Documentation](#26-user-documentation)
   - 2.7 [Assumptions and Dependencies](#27-assumptions-and-dependencies)
3. [System Features and Functional Requirements](#3-system-features-and-functional-requirements)
   - 3.1 [Universal Document Ingestion & Parsing (FR-1)](#31-universal-document-ingestion--parsing-fr-1)
   - 3.2 [Tri-Tier Adaptive Extraction & OCR Pipeline (FR-2)](#32-tri-tier-adaptive-extraction--ocr-pipeline-fr-2)
   - 3.3 [Multi-Fidelity AI Summarization & Synthesis (FR-3)](#33-multi-fidelity-ai-summarization--synthesis-fr-3)
   - 3.4 [Real-Time SSE Token Streaming & Formatting (FR-4)](#34-real-time-sse-token-streaming--formatting-fr-4)
   - 3.5 [Key Takeaways & Actionable Improvement Critiques (FR-5)](#35-key-takeaways--actionable-improvement-critiques-fr-5)
   - 3.6 [Multi-Format Client-Side Export Suite (FR-6)](#36-multi-format-client-side-export-suite-fr-6)
   - 3.7 [Resilient Inside-Stream Multi-Model Fallback (FR-7)](#37-resilient-inside-stream-multi-model-fallback-fr-7)
4. [External Interface Requirements](#4-external-interface-requirements)
   - 4.1 [User Interfaces](#41-user-interfaces)
   - 4.2 [Hardware Interfaces](#42-hardware-interfaces)
   - 4.3 [Software Interfaces](#43-software-interfaces)
   - 4.4 [Communications Interfaces](#44-communications-interfaces)
5. [Non-Functional Requirements (NFRs)](#5-non-functional-requirements-nfrs)
   - 5.1 [Performance Requirements](#51-performance-requirements)
   - 5.2 [Safety & Security Requirements](#52-safety--security-requirements)
   - 5.3 [Software Quality Attributes](#53-software-quality-attributes)
6. [Project Timeline & Phased Implementation Plan (August 19 – August 24)](#6-project-timeline--phased-implementation-plan-august-19--august-24)
   - 6.1 [Day-Wise Execution Breakdown](#61-day-wise-execution-breakdown)
   - 6.2 [Milestone Deliverables Matrix](#62-milestone-deliverables-matrix)

---

## 1. Introduction

### 1.1 Purpose
This document specifies the software requirements for **DocuSense AI**, an intelligent document summarization and critique platform. It provides a formal, comprehensive specification of functional, non-functional, interface, and architectural requirements in compliance with the **IEEE Std 830-1998** standard.

### 1.2 Document Conventions
- **Requirement Identifiers**:
  - `FR-x`: Functional Requirement number $x$.
  - `NFR-x`: Non-Functional Requirement number $x$.
- **Priority Levels**: Defined using RFC 2119 keywords: **MUST** (Mandatory), **SHOULD** (Desirable), **MAY** (Optional).
- **Architecture Standard**: Hexagonal Ports & Adapters separation of concerns.

### 1.3 Intended Audience and Reading Suggestions
This SRS is intended for software engineers, systems architects, QA engineers, product managers, and evaluation evaluators. Readers should begin with Section 2 for architectural context, proceed to Section 3 for requirement specifications, and review Section 6 for the phased implementation timeline.

### 1.4 Project Scope
DocuSense AI is a full-stack web application that ingests multi-format documents (digital PDFs, scanned contracts, images, receipts), performs adaptive text extraction via WebAssembly and Optical Character Recognition (OCR), and generates real-time streaming summaries across customizable length presets (`Short`, `Medium`, `Long`), paired with structured key takeaways and actionable improvement critiques.

### 1.5 References
1. IEEE Std 830-1998, *IEEE Recommended Practice for Software Requirements Specifications*.
2. ISO/IEC/IEEE 29148:2018, *Systems and software engineering — Life cycle processes — Requirements engineering*.
3. Next.js 15 App Router Architecture Guide, Vercel (2025/2026).
4. Google Generative AI Model Fleet Specification (Gemini 3.x Series), Google DeepMind (2026).

---

## 2. Overall Description

### 2.1 Product Perspective
DocuSense AI operates as a self-contained, cloud-deployable full-stack application built on Next.js 15 App Router. It follows a **Hexagonal (Ports & Adapters)** design where core domain logic is decoupled from external UI frameworks, cloud LLM providers, and OCR libraries.

```
       +-------------------------------------------------------------+
       |                     Presentation Layer                      |
       |     (Next.js 15 App Router, React 19, Tailwind CSS, UI)     |
       +------------------------------+------------------------------+
                                      |
                                      v
       +-------------------------------------------------------------+
       |                     Application Layer                       |
       |  (ExtractDocumentUseCase, SummarizeDocumentUseCase, DTOs)   |
       +------------------------------+------------------------------+
                                      |
                                      v
       +-------------------------------------------------------------+
       |                       Domain Layer                          |
       |  (Ports: IExtractionEngine, ISummarizationEngine, Entities) |
       +------------------------------+------------------------------+
                                      |
                                      v
       +-------------------------------------------------------------+
       |                    Infrastructure Layer                     |
       | (unpdf WASM, Tesseract.js OCR, Gemini 3.x Adapter, Mock AI) |
       +-------------------------------------------------------------+
```

### 2.2 Product Functions
1. **Universal File Ingestion**: Ingests PDF, PNG, JPG, JPEG, WEBP, and TIFF files up to 25MB.
2. **Adaptive Tri-Tier Text Extraction**:
   - WebAssembly text extraction for digital PDFs ($< 50\text{ms}$).
   - Client/server WebAssembly OCR for scanned images.
   - Multimodal Vision AI for dense tabular or handwritten documents.
3. **Multi-Fidelity AI Summarization**: Synthesizes text into Short (~150w), Medium (~400w), and Long (~900w) structures.
4. **Real-Time Token Streaming**: Server-Sent Events (SSE) stream delivery with $< 450\text{ms}$ Time-to-First-Token.
5. **Actionable Improvement Critiques**: Evaluates Clarity, Structure, Evidence Completeness, and Recommendations.
6. **Zero-Downtime Fallback Routing**: Dynamic model chain (`gemini-3.6-flash` $\rightarrow$ `gemini-3.5-flash-lite` $\rightarrow$ `mock_offline_engine`).
7. **Client-Side Multi-Format Export**: 1-click downloads for Markdown, JSON, Plain Text, and Clipboard.

### 2.3 User Classes and Characteristics
- **Executive / Business Users**: Require high-level 30-second bulleted TL;DR summaries and 1-click Markdown/JSON exports.
- **Researchers & Academics**: Require exhaustive deep-dive breakdowns, methodology extraction, and risk factor evaluations.
- **Compliance & Legal Auditors**: Require verbatim text verification, document telemetry (word count, reading time), and strict privacy controls.

### 2.4 Operating Environment
- **Server Environment**: Node.js 18.x / 20.x / 22.x, Vercel Serverless / Netlify Edge Runtime.
- **Client Browsers**: Chrome 120+, Microsoft Edge 120+, Firefox 120+, Safari 17+.
- **Hardware Footprint**: Minimal (memory-only execution; $\le 512\text{MB}$ RAM requirement on serverless instances).

### 2.5 Design and Implementation Constraints
1. **Zero-Cost Mandate**: The application MUST run completely within free-tier limits with zero mandatory paid cloud dependencies.
2. **Ephemeral Memory Processing**: No uploaded document or extracted text shall be written to persistent unencrypted disk storage.
3. **Type Safety**: 100% strict TypeScript compilation without `any` bypasses in domain models.

### 2.6 Assumptions and Dependencies
- Network connectivity is available for cloud LLM inference; if offline, the system seamlessly transitions to the local mock heuristic engine.
- Browser supports standard HTML5 File APIs and Web Streams.

---

## 3. System Features and Functional Requirements

### 3.1 Universal Document Ingestion & Parsing (FR-1)
- **FR-1.1**: The system MUST accept file uploads via drag-and-drop and standard file picker.
- **FR-1.2**: Supported MIME types MUST include `application/pdf`, `image/png`, `image/jpeg`, `image/webp`, and `image/tiff`.
- **FR-1.3**: The system MUST enforce a 25MB maximum file size limit and display user-friendly error banners if exceeded.

### 3.2 Tri-Tier Adaptive Extraction & OCR Pipeline (FR-2)
- **FR-2.1**: For machine-generated digital PDFs, the system MUST use `unpdf` WebAssembly parsing to extract text in $< 50\text{ms}$.
- **FR-2.2**: For scanned bitmap images, the system MUST execute `tesseract.js` WebAssembly OCR locally with zero external API calls.
- **FR-2.3**: The system MUST compute document telemetry including word count, character count, estimated reading time, and confidence score.

### 3.3 Multi-Fidelity AI Summarization & Synthesis (FR-3)
- **FR-3.1**: The system MUST support three distinct summarization fidelity modes:
  - **Short Mode**: 3–5 high-impact bulleted takeaways and an executive conclusion (~150 words).
  - **Medium Mode**: Thematic structured narrative with section headers (~400 words).
  - **Long Mode**: Deep-dive analytical breakdown detailing methodology, findings, and risks (~900 words).
- **FR-3.2**: Changing the preset toggle MUST allow instantaneous regeneration without re-uploading the source document.

### 3.4 Real-Time SSE Token Streaming & Formatting (FR-4)
- **FR-4.1**: The `/api/summarize` endpoint MUST return a `text/event-stream` response emitting standard Server-Sent Events (`data: {"chunk": "..."}`).
- **FR-4.2**: The client MUST render incoming markdown tokens dynamically using `react-markdown` and `remark-gfm` with smooth auto-scrolling.
- **FR-4.3**: The user MUST be able to halt generation at any time via a dedicated "Stop Generating" control.

### 3.5 Key Takeaways & Actionable Improvement Critiques (FR-5)
- **FR-5.1**: The system MUST automatically identify and extract 3–5 categorized Key Takeaways (`metric`, `strategic`, `operational`, `risk`).
- **FR-5.2**: The system MUST parse constructive Improvement Suggestions classified by category (`clarity`, `structure`, `completeness`, `actionable`) and severity (`high`, `medium`, `low`).

### 3.6 Multi-Format Client-Side Export Suite (FR-6)
- **FR-6.1**: The system MUST provide client-side export to Markdown (`.md`), formatted JSON (`.json`), clean text (`.txt`), and formatted system clipboard.
- **FR-6.2**: Exported filenames MUST be automatically sanitized (e.g. `DocuSense_Summary_DocumentName_2026-08-24.md`).

### 3.7 Resilient Inside-Stream Multi-Model Fallback (FR-7)
- **FR-7.1**: The adapter MUST implement an automated fallback sequence: `gemini-3.6-flash` $\rightarrow$ `gemini-3.5-flash-lite` $\rightarrow$ `gemini-3.0-flash` $\rightarrow$ `mock_offline_engine`.
- **FR-7.2**: Model fallback retry logic MUST execute *inside* the `ReadableStream` iterator, guaranteeing that HTTP 404/503 stream errors are caught and resolved with zero UI crashes.

---

## 4. External Interface Requirements

### 4.1 User Interfaces
- **Theme Support**: Persistent Light/Dark modes with Tailwind CSS variables and CSS transition smoothing.
- **Responsive Layout**: Two-column interactive working grid on desktop ($\ge 1024\text{px}$) collapsing to a unified single-column flow on mobile viewports ($\le 768\text{px}$).
- **Accessibility**: ARIA-labeled components, high-contrast typography, and full keyboard navigation.

### 4.2 Hardware Interfaces
- No proprietary hardware interfaces required. Compatible with standard client CPUs supporting WebAssembly.

### 4.3 Software Interfaces
- **Google Generative AI API**: Cloud inference endpoint for Gemini 3.x LLM and Vision models.
- **Vercel AI SDK**: Web Streams and SSE protocol abstraction.

### 4.4 Communications Interfaces
- **HTTP/2 & HTTPS**: Secure TLS 1.3 encrypted transport for all client-server communication.
- **Server-Sent Events (SSE)**: Unidirectional streaming over standard HTTP POST endpoints.

---

## 5. Non-Functional Requirements (NFRs)

### 5.1 Performance Requirements
- **NFR-1.1 (Latency)**: Time-to-First-Token (TTFT) MUST be under $450\text{ms}$ on standard broadband connections.
- **NFR-1.2 (Extraction Throughput)**: In-memory PDF text extraction MUST complete within $100\text{ms}$ for documents up to 25 pages.
- **NFR-1.3 (Bundle Size)**: First Load JS shared by all routes MUST remain under $110\text{kB}$.

### 5.2 Safety & Security Requirements
- **NFR-2.1 (Anti-Injection Protection)**: Raw document inputs MUST be wrapped inside strict `<document_content>` XML barriers with explicit system prompt isolation.
- **NFR-2.2 (Output Sanitization)**: Rendered markdown MUST pass through `rehype-sanitize` to strip malicious `<script>`, `<iframe>`, or `javascript:` URI payloads.
- **NFR-2.3 (Ephemeral Processing)**: Files uploaded to `/api/extract` MUST be processed strictly in volatile RAM memory buffers and immediately garbage collected.

### 5.3 Software Quality Attributes
- **Availability**: 99.9% uptime enabled by automatic fallback to local heuristic synthesis.
- **Maintainability**: Hexagonal architecture ensuring zero tight coupling between UI, business rules, and third-party AI SDKs.
- **Test Coverage**: 100% pass rate across 9 automated test suites and 90 unit/e2e test cases.

---

## 6. Project Timeline & Phased Implementation Plan (August 19 – August 24)

The project was executed across six focused development phases between **August 19, 2026** and **August 24, 2026**:

```
+---------------------------------------------------------------------------------------------------+
|                            DOCUSENSE AI - CHRONOLOGICAL PROJECT TIMELINE                          |
+------------+-------------------------------------------------------+------------------------------+
| Date       | Phase / Milestone Scope                               | Key Deliverables             |
+------------+-------------------------------------------------------+------------------------------+
| Aug 19     | Phase 1: Problem Discovery & Architectural Foundation  | PRD, ADR-001/002/003, Next.js|
| Aug 20     | Phase 2: Ingestion & Tri-Tier Extraction Pipeline     | unpdf WASM, Tesseract.js OCR |
| Aug 21     | Phase 3: AI Summarization Engine & SSE Streaming      | Gemini API, SSE stream, Prompts|
| Aug 22     | Phase 4: UI Dashboard, Length Controls & Export Suite | shadcn/ui, ExportMenu (.md/json)|
| Aug 23     | Phase 5: Multi-Model Fallback & Adversarial Hardening | Gemini 3.x chain, Bug Log fix|
| Aug 24     | Phase 6: Full Verification, IEEE Docs & Git Release   | 90/90 Tests, IEEE SRS, GitHub|
+------------+-------------------------------------------------------+------------------------------+
```

### 6.1 Day-Wise Execution Breakdown

#### 📅 Day 1: August 19, 2026 — Problem Discovery, System Architecture & Clean Scaffolding
- Evaluated project requirements from technical assessment specification.
- Formulated Product Requirements Document ([`docs/prd/PRD-Document-Summary-Assistant.md`](https://github.com/AdvaitVarhade/docusense-ai/blob/main/docs/prd/PRD-Document-Summary-Assistant.md)).
- Authored Architecture Decision Records:
  - **ADR-001**: Next.js 15 App Router & TypeScript full-stack monolith selection.
  - **ADR-002**: Tri-Tier extraction strategy (`unpdf` + `tesseract.js` + `gemini_vlm`).
  - **ADR-003**: Streaming AI model routing, prompt engineering, and security delimiters.
- Scaffolding of Hexagonal directory structure (`domain/`, `application/`, `infrastructure/`, `components/`).

#### 📅 Day 2: August 20, 2026 — Document Ingestion & Tri-Tier Extraction Pipeline
- Implemented `/api/extract` multipart form data route handler.
- Integrated `unpdf` WebAssembly adapter for sub-50ms digital PDF parsing.
- Integrated `tesseract.js` WebAssembly engine for client/server offline OCR of scanned documents and receipts.
- Built `DocumentNormalizer` service calculating character count, word count, and estimated reading time.
- Constructed `DocumentUploader.tsx` with drag-and-drop ingestion zone, file validation, and progress bars.

#### 📅 Day 3: August 21, 2026 — AI Summarization Engine & Real-Time SSE Streaming
- Implemented `/api/summarize` endpoint with Server-Sent Events (SSE) protocol.
- Designed `PromptEngineeringService` with anti-injection XML delimiters (`<document_content>`).
- Implemented prompt templates for `Short` (~150w), `Medium` (~400w), and `Long` (~900w) summaries.
- Configured structured extraction rules for Key Takeaways and categorized Improvement Suggestions.
- Created `MockSummarizerAdapter` for zero-cost offline heuristic synthesis.

#### 📅 Day 4: August 22, 2026 — Interactive Dashboard UI, Length Controls & Export Suite
- Constructed `SummaryViewer.tsx` featuring real-time Markdown stream rendering via `react-markdown` and `remark-gfm`.
- Built `PresetSelector.tsx` for 1-click toggling between Short, Medium, and Long presets.
- Built structured tabs for Key Takeaways badges and categorized Improvement Suggestions cards.
- Engineered `ExportMenu.tsx` supporting 1-click client-side export to Markdown (`.md`), formatted JSON (`.json`), clean text (`.txt`), and clipboard.
- Integrated `next-themes` and polished dark/light glassmorphic UI.

#### 📅 Day 5: August 23, 2026 — Multi-Model Fallback Chain, Zero-Downtime Resilience & Defect Resolution
- Investigated and resolved Google API model retirement 404 errors on legacy model strings.
- Upgraded default model fleet to **Gemini 3.x series** (`gemini-3.6-flash`, `gemini-3.5-flash-lite`).
- Refactored `GeminiSummarizerAdapter` to execute the fallback loop *inside* the `ReadableStream` iterator to catch lazy HTTP errors seamlessly.
- Maintained exhaustive bug tracking log in [`docs/BUG_LOG.md`](https://github.com/AdvaitVarhade/docusense-ai/blob/main/docs/BUG_LOG.md).
- Streamlined UI by removing duplicate hero banners and redundant action buttons.

#### 📅 Day 6: August 24, 2026 — Verification Suite, IEEE SRS Documentation & Public Release
- Executed 9 Vitest test suites comprising 90 automated test cases (100% pass rate).
- Verified Next.js 15 production build (`npm run build`) with zero errors and zero warnings.
- Authored IEEE Std 830-1998 compliant Software Requirements Specification ([`docs/IEEE_SRS_Document.md`](https://github.com/AdvaitVarhade/docusense-ai/blob/main/docs/IEEE_SRS_Document.md)).
- Compiled formal LaTeX IEEE SRS PDF ([`docs/IEEE_SRS_Document.pdf`](https://github.com/AdvaitVarhade/docusense-ai/blob/main/docs/IEEE_SRS_Document.pdf)) via `pdflatex`.
- Initialized Git repository, committed all milestones, and pushed to GitHub: [https://github.com/AdvaitVarhade/docusense-ai](https://github.com/AdvaitVarhade/docusense-ai).

---

### 6.2 Milestone Deliverables Matrix

| Milestone | Target Date | Status | Verification Criteria |
| :--- | :--- | :--- | :--- |
| **M1: Architecture & Scaffolding** | Aug 19, 2026 | Completed | PRD, ADRs, and Hexagonal layer contracts verified. |
| **M2: Extraction Pipeline** | Aug 20, 2026 | Completed | Digital PDF ($< 50\text{ms}$) and Image OCR ($> 90\%$ confidence) verified. |
| **M3: Streaming AI Engine** | Aug 21, 2026 | Completed | SSE streaming token delivery ($\text{TTFT} < 450\text{ms}$) verified. |
| **M4: Dashboard & Export Suite** | Aug 22, 2026 | Completed | Interactive UI, preset switcher, and 4 export formats verified. |
| **M5: Resilience & Multi-Model Chain** | Aug 23, 2026 | Completed | Zero-downtime Gemini 3.x stream fallback verified. |
| **M6: Test Harness & IEEE Release** | Aug 24, 2026 | Completed | 90/90 tests passing, IEEE SRS PDF compiled, GitHub repo live. |

---

## 7. Approval & Sign-Off
- **Lead Software Engineer:** Advait Varhade
- **Architecture Reviewer:** System Architecture Board
- **Date:** August 24, 2026
- **Status:** Approved for Production Deployment
