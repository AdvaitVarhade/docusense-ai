# Architecture Decision Record (ADR)
## ADR-002: Multi-Tier Document Extraction Pipeline (Hybrid Text Extraction & Multimodal OCR)

Status: Accepted  
**Status:** Accepted  
**Deciders:** Principal Architect, AI/ML Architect, Performance Engineer  
**Date:** 2026-08-20  

---

### Context
Documents submitted by users can range from crisp, digitally generated PDFs (contracts, papers) to scanned, rotated images and photographed receipts with low DPI. Traditional single-engine approaches fail either by:
1. Running slow/expensive OCR on digital PDFs that already have clean embedded text.
2. Failing completely on scanned PDFs when using standard PDF text extractors.
3. Garbling multi-column tables and handwriting when using basic Tesseract engines.

### Evaluated Alternatives
1. **Option A: Tesseract.js only for everything**
   - *Pros*: Open source, runs anywhere.
   - *Cons*: Very slow for large documents, fails on complex multi-column layouts, poor handwriting accuracy, heavy WASM bundle.
2. **Option B: Pure Cloud VLM (Send raw binary PDF/Image to Gemini/GPT-4o Vision directly)**
   - *Pros*: Extremely high accuracy, understands layout and handwriting natively.
   - *Cons*: Higher token consumption, consumes multimodal quota rapidly, slower for simple 50-page text PDFs.
3. **Option C: Tri-Engine Adaptive Extraction Pipeline (Selected)**
   - *Tier 1*: Direct Fast Text Extraction (`pdf-parse` / `unpdf`) for digital PDFs. Fast (< 50ms), zero AI token cost.
   - *Tier 2*: Scanned Document Detection (if text density < 10 words/page or format is Image), route to Multimodal VLM (Google Gemini 2.0 Flash / 1.5 Flash Vision) for high-accuracy layout-aware extraction.
   - *Tier 3*: Fallback to `tesseract.js` / local OCR if network or API limits are encountered.

### Decision
Adopt **Option C: Tri-Engine Adaptive Extraction Pipeline**.

### Consequences
- Dramatic reduction in latency and token usage for 80% of standard digital documents.
- State-of-the-art accuracy on difficult scanned images and complex tabular layouts.
- Resilient fallback mechanism ensuring 100% processing reliability.
