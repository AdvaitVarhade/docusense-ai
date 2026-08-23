# Architecture Decision Record (ADR)
## ADR-001: Technology Stack Selection (Next.js 15 App Router + TypeScript + Tailwind CSS + shadcn/ui)

Status: Accepted  
**Status:** Accepted  
**Deciders:** Principal Architect, Frontend Architect, Backend Architect  
**Date:** 2026-08-20  

---

### Context
The application requires a production-grade, responsive, fast, and easily deployable web solution capable of handling file uploads, server-side document parsing, streaming LLM responses, and running flawlessly across desktop and mobile browsers. It must deploy seamlessly to hosting platforms like Vercel/Netlify with zero complex infrastructure overhead while providing clean separation of concerns.

### Evaluated Alternatives
1. **Option A: Next.js 15 (React 19, TypeScript, App Router, Server Actions & Route Handlers, Tailwind CSS, shadcn/ui)**
2. **Option B: Separate FastAPI (Python) Backend + Vite/React SPA Frontend**
3. **Option C: Node.js (Express/NestJS) + Angular/Vue SPA**

### Decision
Adopt **Option A: Unified Next.js 15 App Router Monolith (TypeScript)**.

### Rationale & Tradeoff Analysis
- **Unified TypeScript Model**: End-to-end type safety across API route handlers, server actions, and UI components using Zod schema validation.
- **Serverless & Edge Ready**: Native streaming response support (`ai` SDK Server-Sent Events), eliminating WebSocket connection management complexities.
- **Hosting & CI/CD Simplicity**: Single repository, single build step, zero CORS headaches, natively deployable to Vercel/Netlify with global CDN distribution.
- **Rich UI Ecosystem**: `shadcn/ui` (Radix UI primitives) provides accessible, unstyled composable components (drag-and-drop zones, accordions, tabs, skeletons) with 100% WCAG 2.1 AA compliance.
- **Maintainability**: Low operational surface area for an 8-hour implementation timeline with highest architectural durability.

### Consequences
- Requires using Node-compatible PDF/image extraction libraries or native API integrations.
- Node.js memory limits in serverless functions (default 1024MB-3008MB) must be respected by streaming large files.
