import { describe, it, expect } from "vitest";

export interface DocumentExportPayload {
  document: {
    filename: string;
    mimeType: string;
    sizeBytes: number;
    pageCount: number;
    wordCount: number;
    characterCount: number;
    extractionEngine: string;
    extractedAt: string;
  };
  summary: {
    lengthPreset: "short" | "medium" | "long";
    content: string;
    keyTakeaways?: string[];
    improvementSuggestions?: string[];
  };
  generatedAt: string;
}

/**
 * Standard Export Formatter Implementation matching DocuSense AI Specification.
 */
export function formatAsMarkdown(payload: DocumentExportPayload): string {
  const { document: doc, summary, generatedAt } = payload;
  let md = `# DocuSense AI Summary: ${doc.filename}\n\n`;

  md += `## Document Metadata\n`;
  md += `- **Filename**: ${doc.filename}\n`;
  md += `- **MIME Type**: ${doc.mimeType}\n`;
  md += `- **Pages**: ${doc.pageCount}\n`;
  md += `- **Original Word Count**: ${doc.wordCount}\n`;
  md += `- **Extraction Engine**: ${doc.extractionEngine}\n`;
  md += `- **Export Date**: ${generatedAt}\n\n`;

  md += `## Summary (${summary.lengthPreset.toUpperCase()})\n\n`;
  md += `${summary.content.trim()}\n\n`;

  if (summary.keyTakeaways && summary.keyTakeaways.length > 0) {
    md += `## Key Takeaways\n\n`;
    for (const point of summary.keyTakeaways) {
      md += `- ${point}\n`;
    }
    md += `\n`;
  }

  if (summary.improvementSuggestions && summary.improvementSuggestions.length > 0) {
    md += `## Improvement Suggestions\n\n`;
    summary.improvementSuggestions.forEach((suggestion, index) => {
      md += `${index + 1}. ${suggestion}\n`;
    });
    md += `\n`;
  }

  return md;
}

export function formatAsJson(payload: DocumentExportPayload): string {
  return JSON.stringify(
    {
      version: "1.0.0",
      ...payload,
    },
    null,
    2
  );
}

export function formatAsPlainText(payload: DocumentExportPayload): string {
  const { document: doc, summary, generatedAt } = payload;
  let txt = `=====================================================\n`;
  txt += `DOCUSENSE AI SUMMARY: ${doc.filename.toUpperCase()}\n`;
  txt += `=====================================================\n\n`;

  txt += `DOCUMENT METADATA:\n`;
  txt += `  Filename:          ${doc.filename}\n`;
  txt += `  MIME Type:         ${doc.mimeType}\n`;
  txt += `  Pages:             ${doc.pageCount}\n`;
  txt += `  Original Words:    ${doc.wordCount}\n`;
  txt += `  Engine:            ${doc.extractionEngine}\n`;
  txt += `  Export Date:       ${generatedAt}\n\n`;

  txt += `-----------------------------------------------------\n`;
  txt += `SUMMARY (${summary.lengthPreset.toUpperCase()}):\n`;
  txt += `-----------------------------------------------------\n`;
  // Strip basic markdown syntax for clean text
  const cleanSummary = summary.content
    .replace(/^#+\s+/gm, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1");
  txt += `${cleanSummary.trim()}\n\n`;

  if (summary.keyTakeaways && summary.keyTakeaways.length > 0) {
    txt += `-----------------------------------------------------\n`;
    txt += `KEY TAKEAWAYS:\n`;
    txt += `-----------------------------------------------------\n`;
    for (const point of summary.keyTakeaways) {
      txt += `  * ${point}\n`;
    }
    txt += `\n`;
  }

  if (summary.improvementSuggestions && summary.improvementSuggestions.length > 0) {
    txt += `-----------------------------------------------------\n`;
    txt += `IMPROVEMENT SUGGESTIONS:\n`;
    txt += `-----------------------------------------------------\n`;
    summary.improvementSuggestions.forEach((suggestion, index) => {
      txt += `  ${index + 1}. ${suggestion}\n`;
    });
    txt += `\n`;
  }

  return txt;
}

export function formatForClipboard(payload: DocumentExportPayload): string {
  return formatAsMarkdown(payload);
}

export function sanitizeExportFilename(filename: string, extension: string): string {
  const baseName = filename.replace(/\.[^/.]+$/, "");
  const safeName = baseName.replace(/[/\\?%*:|"<>]/g, "-").trim() || "document";
  const cleanExt = extension.startsWith(".") ? extension : `.${extension}`;
  return `${safeName}-summary${cleanExt}`;
}

describe("DocuSense AI - Multi-Format Export Suite Tests", () => {
  const samplePayload: DocumentExportPayload = {
    document: {
      filename: "Quantum-QML-Research.pdf",
      mimeType: "application/pdf",
      sizeBytes: 204800,
      pageCount: 12,
      wordCount: 3840,
      characterCount: 24900,
      extractionEngine: "unpdf",
      extractedAt: "2026-08-21T18:00:00.000Z",
    },
    summary: {
      lengthPreset: "medium",
      content: "Quantum Machine Learning merges quantum computing with statistical learning algorithms to achieve polynomial speedups.",
      keyTakeaways: [
        "4.2x reduction in convergence epochs compared to ResNet-50",
        "NISQ decoherence limits circuit depth to 64 layers",
        "Hardware fidelity reached 99.85% for two-qubit gates",
      ],
      improvementSuggestions: [
        "Add explicit noise mitigation benchmarks",
        "Include quantum circuit schematics for amplitude encoding",
      ],
    },
    generatedAt: "2026-08-21T18:05:00.000Z",
  };

  // ==========================================
  // TIER 1: CORE EXPORT FORMAT TESTS
  // ==========================================
  describe("Tier 1 - Export Formatting Fidelity", () => {
    it("F13.1: should generate valid Markdown export with metadata, summary, takeaways, and suggestions", () => {
      const md = formatAsMarkdown(samplePayload);

      expect(md).toContain("# DocuSense AI Summary: Quantum-QML-Research.pdf");
      expect(md).toContain("## Document Metadata");
      expect(md).toContain("- **Filename**: Quantum-QML-Research.pdf");
      expect(md).toContain("- **Extraction Engine**: unpdf");
      expect(md).toContain("## Summary (MEDIUM)");
      expect(md).toContain("## Key Takeaways");
      expect(md).toContain("- 4.2x reduction in convergence epochs");
      expect(md).toContain("## Improvement Suggestions");
      expect(md).toContain("1. Add explicit noise mitigation benchmarks");
    });

    it("F13.2: should generate valid JSON export with schema compliance and parseability", () => {
      const jsonStr = formatAsJson(samplePayload);
      expect(() => JSON.parse(jsonStr)).not.toThrow();

      const parsed = JSON.parse(jsonStr);
      expect(parsed.version).toBe("1.0.0");
      expect(parsed.document.filename).toBe("Quantum-QML-Research.pdf");
      expect(parsed.document.pageCount).toBe(12);
      expect(parsed.summary.lengthPreset).toBe("medium");
      expect(Array.isArray(parsed.summary.keyTakeaways)).toBe(true);
      expect(parsed.summary.keyTakeaways.length).toBe(3);
      expect(Array.isArray(parsed.summary.improvementSuggestions)).toBe(true);
      expect(parsed.summary.improvementSuggestions.length).toBe(2);
    });

    it("F13.3: should generate clean Plain Text export with section delimiters", () => {
      const txt = formatAsPlainText(samplePayload);

      expect(txt).toContain("DOCUSENSE AI SUMMARY: QUANTUM-QML-RESEARCH.PDF");
      expect(txt).toContain("DOCUMENT METADATA:");
      expect(txt).toContain("Pages:             12");
      expect(txt).toContain("SUMMARY (MEDIUM):");
      expect(txt).toContain("KEY TAKEAWAYS:");
      expect(txt).toContain("  * 4.2x reduction in convergence epochs");
      expect(txt).toContain("IMPROVEMENT SUGGESTIONS:");
      expect(txt).toContain("  1. Add explicit noise mitigation");
    });

    it("F13.4: should generate clipboard copy string with full markdown fidelity", () => {
      const clipboardContent = formatForClipboard(samplePayload);

      expect(typeof clipboardContent).toBe("string");
      expect(clipboardContent.length).toBeGreaterThan(100);
      expect(clipboardContent).toContain("# DocuSense AI Summary");
    });
  });

  // ==========================================
  // TIER 2: BOUNDARY VALUE & ESCAPING TESTS
  // ==========================================
  describe("Tier 2 - Filename Sanitization & Boundary Handling", () => {
    it("F13.E1: should safely sanitize export filenames containing illegal filesystem characters", () => {
      const dangerousName = 'Report / Q3: "Growth & Scaling" <Draft>?.pdf';
      const mdFilename = sanitizeExportFilename(dangerousName, ".md");
      const jsonFilename = sanitizeExportFilename(dangerousName, ".json");
      const txtFilename = sanitizeExportFilename(dangerousName, ".txt");

      expect(mdFilename).not.toMatch(/[/\\?%*:|"<>]/);
      expect(jsonFilename).not.toMatch(/[/\\?%*:|"<>]/);
      expect(txtFilename).not.toMatch(/[/\\?%*:|"<>]/);
      expect(mdFilename).toBe("Report - Q3- -Growth & Scaling- -Draft---summary.md");
      expect(jsonFilename.endsWith("-summary.json")).toBe(true);
    });

    it("F13.E2: should handle export payload when keyTakeaways or improvementSuggestions are empty", () => {
      const minimalPayload: DocumentExportPayload = {
        document: {
          filename: "minimal.pdf",
          mimeType: "application/pdf",
          sizeBytes: 1024,
          pageCount: 1,
          wordCount: 50,
          characterCount: 300,
          extractionEngine: "unpdf",
          extractedAt: new Date().toISOString(),
        },
        summary: {
          lengthPreset: "short",
          content: "Brief single-sentence summary.",
        },
        generatedAt: new Date().toISOString(),
      };

      const md = formatAsMarkdown(minimalPayload);
      const json = formatAsJson(minimalPayload);
      const txt = formatAsPlainText(minimalPayload);

      expect(md).toContain("Brief single-sentence summary.");
      expect(md).not.toContain("## Key Takeaways");
      expect(md).not.toContain("## Improvement Suggestions");

      expect(() => JSON.parse(json)).not.toThrow();
      expect(txt).toContain("SUMMARY (SHORT):");
    });

    it("F13.E3: should preserve Unicode and mathematical symbols (LaTeX / UTF-8) in all export formats", () => {
      const unicodePayload: DocumentExportPayload = {
        document: {
          filename: "Quantum-数学-🔬.pdf",
          mimeType: "application/pdf",
          sizeBytes: 5000,
          pageCount: 1,
          wordCount: 80,
          characterCount: 500,
          extractionEngine: "unpdf",
          extractedAt: new Date().toISOString(),
        },
        summary: {
          lengthPreset: "medium",
          content: "Equations: $\\lvert \\psi \\rangle = \\sum x_i \\lvert i \\rangle$, Energy: 15.4 kW ⚡, Cost: €5.4M / ¥380M.",
          keyTakeaways: ["Superposition state $\\lvert \\phi \\rangle$ verified 🔬"],
        },
        generatedAt: new Date().toISOString(),
      };

      const md = formatAsMarkdown(unicodePayload);
      const jsonStr = formatAsJson(unicodePayload);
      const txt = formatAsPlainText(unicodePayload);

      expect(md).toContain("Quantum-数学-🔬.pdf");
      expect(md).toContain("$\\lvert \\psi \\rangle");
      expect(md).toContain("15.4 kW ⚡");

      const parsed = JSON.parse(jsonStr);
      expect(parsed.document.filename).toBe("Quantum-数学-🔬.pdf");
      expect(parsed.summary.content).toContain("15.4 kW ⚡");

      expect(txt).toContain("15.4 kW ⚡");
    });
  });
});
