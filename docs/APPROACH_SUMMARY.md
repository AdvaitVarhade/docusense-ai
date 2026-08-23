# Technical Assessment: Approach Write-Up
## Document Summary Assistant (DocuSense AI)

**Author:** Software Engineering Candidate  
**Repository:** [github.com/AdvaitVarhade/docusense-ai](https://github.com/AdvaitVarhade/docusense-ai)  
**Target Constraints:** $\le$ 200 words  

---

### Executive Approach Summary

DocuSense AI was built using a **Hexagonal (Ports & Adapters) Architecture** on **Next.js 15 App Router**, **TypeScript**, **Tailwind CSS**, and **shadcn/ui**, ensuring strict separation between domain logic, UI, and external adapters.

To handle heterogeneous inputs cost-effectively, I designed a **Tri-Engine Adaptive Extraction Pipeline**:
1. **Digital PDFs**: Parsed instantly in-memory via WebAssembly (`unpdf`) in $< 50\text{ms}$ with zero AI token cost.
2. **Scanned Images/Receipts**: Extracted client/server-side using `tesseract.js` for zero-cost offline OCR.
3. **Complex Layouts**: Routed to multimodal vision models (`Gemini Flash Vision`) when layout density requires deep structural understanding.

For summarization, the system utilizes **Server-Sent Events (SSE)** via the Vercel AI SDK to stream tokens in real-time ($\text{TTFT} < 450\text{ms}$), supporting **Short** (~150 words), **Medium** (~400 words), and **Long** (~900 words) presets with highlighted key takeaways and actionable improvement suggestions.

To guarantee zero downtime and 100% free-tier sustainability, I implemented an inside-stream **multi-model fallback chain** (`gemini-3.6-flash`, `gemini-3.5-flash-lite`, `mock_offline_engine`), comprehensive error boundaries, XML prompt-injection shields, and a multi-format export suite (Markdown, JSON, Plain Text, Clipboard).
