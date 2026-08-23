# E2E Test Infra: DocuSense AI (Document Summary Assistant)

## Test Philosophy
- **Opaque-Box & Requirement-Driven**: Tests are derived strictly from `ORIGINAL_REQUEST.md`, `PRD-Document-Summary-Assistant.md`, and `ADR-001/002/003`.
- **Zero Internal Coupling**: Verification tests against external public contracts (`/api/extract`, `/api/summarize`, CLI/runner endpoints, file parsers, UI contracts).
- **Multi-Tier Methodology**: Category-Partition + Boundary Value Analysis + Combinatorial Pairwise + Real-World Workloads.

## Feature Inventory Test Coverage Matrix
| # | Feature | Source | Tier 1 (Unit/Feature) | Tier 2 (Boundary/Error) | Tier 3 (Cross-Feature) | Tier 4 (E2E Scenario) |
|---|---|---|:---:|:---:|:---:|:---:|
| 1 | Next.js 15 Build & Scaffolding | ADR-001 | 5 | 5 | ✓ | ✓ |
| 2 | Clean Hexagonal Architecture | PROJECT_RULES | 5 | 5 | ✓ | ✓ |
| 3 | Digital PDF Extraction (unpdf) | ADR-002 | 5 | 5 | ✓ | ✓ |
| 4 | Scanned/Image OCR (Tesseract) | ADR-002 | 5 | 5 | ✓ | ✓ |
| 5 | Multimodal VLM OCR Fallback | ADR-002 | 5 | 5 | ✓ | ✓ |
| 6 | Extraction API (/api/extract) | PRD §3.1 | 5 | 5 | ✓ | ✓ |
| 7 | AI Summarization Service | ADR-003 | 5 | 5 | ✓ | ✓ |
| 8 | Multi-Fidelity Length Presets | PRD §3.1 | 5 | 5 | ✓ | ✓ |
| 9 | Key Takeaways & Improvement Points | PRD §3.1 | 5 | 5 | ✓ | ✓ |
| 10 | SSE Streaming Route (/api/summarize) | ADR-003 | 5 | 5 | ✓ | ✓ |
| 11 | Markdown Streaming & Sanitization | PRD §3.2 | 5 | 5 | ✓ | ✓ |
| 12 | Document Uploader UI States | PRD §3.1 | 5 | 5 | ✓ | ✓ |
| 13 | Multi-Format Export (.md, .txt, .json) | PRD §3.1 | 5 | 5 | ✓ | ✓ |
| 14 | Responsive UI & Dark Mode | PRD §5 | 5 | 5 | ✓ | ✓ |
| 15 | Error Handling & Toast Notifications | PRD §5 | 5 | 5 | ✓ | ✓ |
| 16 | Git Repository History (>=3 Commits) | ORIGINAL_REQUEST | 5 | 5 | ✓ | ✓ |
| 17 | Maintained docs/BUG_LOG.md | ORIGINAL_REQUEST | 5 | 5 | ✓ | ✓ |

## Test Architecture
- **Test Runner**: Vitest / Node test runner with TypeScript support (`npx vitest run` or custom test runner).
- **Fixtures Directory**: `tests/fixtures/` containing sample digital PDFs, image files, empty files, corrupted buffers, large buffers.
- **Test Suites**:
  - `tests/e2e/extraction.test.ts`: Digital PDF extraction, image OCR, file validation, error codes.
  - `tests/e2e/summarization.test.ts`: SSE streaming verification, length preset enforcement, key points extraction.
  - `tests/e2e/export.test.ts`: Markdown, JSON, and Text export fidelity.
  - `tests/e2e/workflow.test.ts`: End-to-end multi-step user flow (Upload -> Extract -> Summarize -> Export).
  - `tests/e2e/git_and_docs.test.ts`: Verification of git commits count (>=3) and `BUG_LOG.md` entries.

## Real-World Application Scenarios (Tier 4)
| # | Scenario | Features Exercised | Target Result |
|---|---|---|---|
| 1 | Ingest Standard Research / Assessment PDF | F1, F3, F6, F7, F8, F9, F10, F11, F13 | Complete text extraction, accurate Short/Medium/Long summary stream, markdown export |
| 2 | Ingest Scanned Document / Receipt Image | F4, F5, F6, F7, F8, F10, F13 | OCR extraction with high character accuracy, summary generated, text export |
| 3 | Ingest Malformed / Zero-Byte / Oversized File | F6, F15 | Graceful HTTP 400/413/422 error response without crash |
| 4 | Offline / Mock AI Mode Resiliency | F7, F10, F15 | Fallback to mock summarization or clean structured error if API keys are absent |
| 5 | Full User Lifecycle with Commit Verification | F1, F16, F17 | Clean Next.js build, >=3 git commits, populated BUG_LOG.md |

## Coverage Thresholds
- Tier 1: >= 5 test cases per feature
- Tier 2: >= 5 boundary/error cases per feature
- Tier 3: Pairwise combination matrix covering extraction + summarization modes
- Tier 4: >= 5 end-to-end user application workflows
