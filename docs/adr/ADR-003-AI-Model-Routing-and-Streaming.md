# Architecture Decision Record (ADR)
## ADR-003: AI Model Routing, Streaming Architecture, and Structured Outputs

Status: Accepted  
**Status:** Accepted  
**Deciders:** AI/ML Architect, Backend Architect, Security Engineer  
**Date:** 2026-08-20  

---

### Context
Users require fast, high-quality document summaries with specific length presets (`Short`, `Medium`, `Long`), highlighted key takeaways, and actionable improvement suggestions. Waiting 15–30 seconds for a batch LLM response results in high bounce rates. Furthermore, the application must stay within free-tier resource limits while maintaining production quality.

### Evaluated Alternatives
1. **Option A: Non-streaming OpenAI GPT-4o with single JSON response**
   - High cost, higher latency (10-20s waiting block), potential rate limit issues on free tier.
2. **Option B: Vercel AI SDK 4.x + Google Gemini 2.0 Flash / 1.5 Flash (Primary) + Groq LLaMA 3.3 70B (Secondary Fallback)**
   - Gemini 2.0 / 1.5 Flash provides 1M context window, 15 RPM / 1500 RPD free tier, native multimodality, fast Time-To-First-Token (~350ms), and native structured JSON schema mode via Zod.
   - Groq provides ultra-fast streaming (500+ tokens/sec) for pure text summaries.

### Decision
Adopt **Option B: Vercel AI SDK with Gemini 2.0 Flash as Primary Provider, Groq LLaMA 3.3 70B as Fallback, with Server-Sent Events (SSE) Streaming & Zod Structured Output validation**.

### Key Architectural Mechanisms
- **Streaming Pipeline**: Use `streamText` / `streamObject` over HTTP SSE to stream the summary markdown and suggestions directly into the client UI.
- **Adaptive Length Prompt Engineering**:
  - `Short`: Strict 3–5 bullet point executive summary + 3 critical takeaways (Target: ~150 words).
  - `Medium`: Sectional summary with core themes, methodology/facts, and strategic insights (Target: ~400 words).
  - `Long`: Comprehensive breakdown, detailed analysis, tabular synthesis if applicable, key risks, and exhaustive takeaways (Target: ~900 words).
- **Dual Output Generation**: Concurrently stream the summary and structured improvement suggestions (Clarity, Structure, Completeness, Actionable Recommendations).

### Consequences
- Zero perceptible delay for users (streaming starts in < 400ms).
- 100% free-tier compliance with automatic fallback if rate limits are reached.
