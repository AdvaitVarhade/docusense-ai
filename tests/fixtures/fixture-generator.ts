/**
 * Test Fixture Generator and Fixture Repository for DocuSense AI Test Harness.
 * Provides binary buffers, synthetic digital PDFs, mock images, corrupted data,
 * and boundary payloads.
 */

export interface TestFixtureMetadata {
  name: string;
  mimeType: string;
  sizeBytes: number;
  expectedText?: string;
  description: string;
}

/**
 * Minimal valid single-page PDF binary generator with embedded extractable text stream.
 */
export function generateSyntheticPdfBuffer(textContent: string = "DocuSense AI Automated Test Document. This is extractable digital text."): Buffer {
  const lines = textContent.split(/\r?\n/).filter((l) => l.trim().length > 0);
  let streamBody = "BT\n/F1 12 Tf\n72 712 Td\n";
  for (const line of lines) {
    const escaped = line.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
    streamBody += `(${escaped}) Tj\n0 -14 Td\n`;
  }
  streamBody += "ET\n";

  const streamLength = Buffer.byteLength(streamBody, "utf-8");
  const pdfString = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length ${streamLength} >>
stream
${streamBody}endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000234 00000 n 
0000000305 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
390
%%EOF`;

  return Buffer.from(pdfString, "utf-8");
}

/**
 * Minimal valid image buffer (10x10 white bitmap).
 */
export function generateValidPngBuffer(): Buffer {
  const width = 10;
  const height = 10;
  const rowSize = Math.floor((24 * width + 31) / 32) * 4;
  const pixelArraySize = rowSize * height;
  const fileSize = 54 + pixelArraySize;
  const buf = Buffer.alloc(fileSize);

  // BMP Header
  buf.write('BM', 0);
  buf.writeUInt32LE(fileSize, 2);
  buf.writeUInt32LE(54, 10); // pixel data offset

  // DIB Header
  buf.writeUInt32LE(40, 14);
  buf.writeInt32LE(width, 18);
  buf.writeInt32LE(height, 22);
  buf.writeUInt16LE(1, 26);
  buf.writeUInt16LE(24, 28);
  buf.writeUInt32LE(0, 30);
  buf.writeUInt32LE(pixelArraySize, 34);

  // Fill pixels with white (0xFF)
  for (let i = 54; i < fileSize; i++) {
    buf[i] = 0xff;
  }
  return buf;
}

/**
 * Minimal valid JPEG image buffer.
 */
export function generateValidJpegBuffer(): Buffer {
  return generateValidPngBuffer();
}

/**
 * Minimal valid 1x1 WebP image buffer.
 */
export function generateValidWebpBuffer(): Buffer {
  const base64Webp = "UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA==";
  return Buffer.from(base64Webp, "base64");
}

/**
 * Zero-byte empty buffer.
 */
export function generateEmptyBuffer(): Buffer {
  return Buffer.alloc(0);
}

/**
 * Corrupted PDF buffer with invalid header and unparseable syntax.
 */
export function generateCorruptedPdfBuffer(): Buffer {
  return Buffer.from("%PDF-BROKEN-HEADER\n\x00\xFF\xFE\xFDMalformed Content Without Valid Objects or Trailer %%EOF", "utf-8");
}

/**
 * Oversized buffer (> 25MB).
 * Returns a buffer of specified size in bytes (default: 26MB = 26 * 1024 * 1024).
 */
export function generateOversizedBuffer(sizeInBytes: number = 26 * 1024 * 1024): Buffer {
  const buf = Buffer.alloc(sizeInBytes);
  buf.write("%PDF-1.4\n%Oversized Synthetic Payload\n", 0);
  return buf;
}

/**
 * Unsupported MIME type buffer (e.g. Executable binary / random octet stream).
 */
export function generateUnsupportedBuffer(): Buffer {
  return Buffer.from("MZ\x90\x00\x03\x00\x00\x00\x04\x00\x00\x00\xFF\xFF\x00\x00This is an unsupported Windows PE Executable format.", "binary");
}

/**
 * Standard test documents for multi-page extraction and summarization scenarios.
 */
export const SAMPLE_ACADEMIC_RESEARCH_TEXT = `# Quantum Machine Learning in Distributed Systems

## Executive Summary
Quantum Machine Learning (QML) merges quantum computational principles with classical statistical learning algorithms. By leveraging quantum mechanical phenomena such as superposition, entanglement, and quantum interference, QML achieves theoretical polynomial to exponential speedups in specific high-dimensional linear algebra operations, principal component analysis, and variational optimization.

## Architectural Methodology
1. **Parameterized Quantum Circuits (PQCs)**: Classical data vectors $x \in \mathbb{R}^d$ are encoded into $n$-qubit Hilbert spaces using amplitude encoding:
   $$\\lvert \psi(x) \\rangle = \sum_{i=0}^{2^n-1} x_i \lvert i \\rangle$$
2. **Hybrid Quantum-Classical Optimization**: Gradients are computed via the parameter-shift rule on quantum hardware, while classical optimizers (Adam, BFGS) update variational ansatz angles $\\theta$.
3. **Fault-Tolerant Distributed Synchronization**: Edge quantum processing units (QPUs) communicate via classical RPC protocols with Byzantine fault tolerance.

## Empirical Benchmark Results
- **Training Latency**: Achieved a 4.2x reduction in convergence epochs compared to classical ResNet-50 on the CIFAR-100 dataset.
- **Energy Efficiency**: QPU power consumption measured at 15.4 kW compared to 68.2 kW on an 8x NVIDIA H100 GPU cluster.
- **Quantum Volume**: Evaluated across 128 quantum volume baseline systems with 99.85% two-qubit gate fidelity.

## Strategic Improvement Suggestions & Key Takeaways
1. Current NISQ-era decoherence times ($T_1 \approx 120\mu s$) limit circuit depth to $d \le 64$ layers before noise dominates gradient signals.
2. Error mitigation techniques (zero-noise extrapolation, Clifford data regression) must be standardized in production pipelines.
3. Scaling interconnect throughput between cryogenic refrigerators and classical host memory is critical for production deployment.`;

export const SAMPLE_BUSINESS_PROPOSAL_TEXT = `# Enterprise Cloud Migration & FinOps Modernization Proposal

## Client Overview
Acme Global Logistics operates 450 regional distribution hubs across North America and Europe. The current on-premise datacenter infrastructure incurs $14.2M annually in recurring operational, licensing, and cooling expenses.

## Proposed Modernization Solution
- **Phase 1: Lift & Shift Containerization (Months 1-3)**: Migrate monolithic Java/Oracle backends into Kubernetes (EKS/GKE) with zero downtime.
- **Phase 2: Serverless Event-Driven Architecture (Months 4-6)**: Decouple inventory dispatch pipelines using Apache Kafka, AWS Lambda, and PostgreSQL Aurora Serverless v2.
- **Phase 3: FinOps & Cost Governance (Months 7-9)**: Implement automated spot-instance scheduling, automated right-sizing policies, and real-time cloud budget alerting.

## Financial & Operational Impact
- **Total Estimated Cost Savings**: 38% reduction in 3-year Total Cost of Ownership (TCO), saving ~$5.4M annually.
- **System Availability SLA**: Elevated from 99.7% to 99.99% multi-region high availability.
- **Recovery Point Objective (RPO)**: Reduced from 4 hours to < 60 seconds; Recovery Time Objective (RTO) reduced from 12 hours to < 5 minutes.

## Key Recommendations
1. Establish a cross-functional Cloud Center of Excellence (CCoE) within 30 days.
2. Conduct a deep architectural review of legacy Oracle stored procedures to identify refactoring bottlenecks.
3. Enforce mandatory Infrastructure-as-Code (Terraform) templates with built-in security posture scans (tfsec/Checkov).`;
