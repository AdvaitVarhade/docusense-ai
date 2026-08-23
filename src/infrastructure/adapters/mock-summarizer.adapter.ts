/**
 * src/infrastructure/adapters/mock-summarizer.adapter.ts
 * Resilient Offline Mock Summarizer Engine with contextual heuristics and real streaming token chunks.
 */

import { ISummarizationEngine, SummarizationOptions } from '@/domain/ports/summarization.port';
import { DocumentAnalysisResult, KeyPoint, ImprovementSuggestion } from '@/domain/models/summary';

export class MockSummarizerAdapter implements ISummarizationEngine {
  public readonly providerName = 'mock_offline_engine';

  public isConfigured(): boolean {
    return true; // Always available as fallback
  }

  public async streamSummary(options: SummarizationOptions): Promise<ReadableStream<Uint8Array>> {
    const summaryText = this.generateDeterministicContent(options);
    const encoder = new TextEncoder();

    // Chunk text into realistic 20-40 char streaming tokens
    const chunks = summaryText.match(/.{1,35}/gs) || [summaryText];

    return new ReadableStream<Uint8Array>({
      async start(controller) {
        for (const chunk of chunks) {
          const sseEvent = `data: ${JSON.stringify({ chunk })}\n\n`;
          controller.enqueue(encoder.encode(sseEvent));
        }
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      },
    });
  }

  public async generateStructuredAnalysis(options: SummarizationOptions): Promise<DocumentAnalysisResult> {
    const summaryText = this.generateDeterministicContent(options);
    return {
      documentMeta: options.meta,
      preset: options.preset,
      summaryMarkdown: summaryText,
      keyPoints: this.generateKeyPoints(options),
      suggestions: this.generateSuggestions(options),
      generatedAt: new Date().toISOString(),
    };
  }

  public generateDeterministicContent(options: SummarizationOptions): string {
    const { text, preset, extractKeyPoints = true, extractSuggestions = true } = options;
    const lowerText = text.toLowerCase();
    const isAcademic = lowerText.includes('quantum') || lowerText.includes('algorithm') || lowerText.includes('research') || lowerText.includes('qubit');
    const isBusiness = lowerText.includes('modernization') || lowerText.includes('proposal') || lowerText.includes('revenue') || lowerText.includes('cloud');

    let body = '';

    if (preset === 'short') {
      if (isAcademic) {
        body = `# Summary (Short Preset)\n\n- **Executive TL;DR**: The document investigates hybrid quantum machine learning architectures and noise mitigation.\n- **Core Speedup**: Evaluated algorithms achieve polynomial reduction in convergence epochs compared to classical baselines.\n- **Hardware Bottlenecks**: High gate error rates and NISQ decoherence restrict circuit depth to 64 layers.\n`;
      } else if (isBusiness) {
        body = `# Summary (Short Preset)\n\n- **Executive TL;DR**: The proposal details an enterprise cloud modernization roadmap delivering 38% operational cost reduction.\n- **Modernization Scope**: Legacy monolithic services are transitioned to containerized, event-driven microservices.\n- **Governance Impact**: Centralized FinOps governance achieves sub-minute recovery time objectives (RTO).\n`;
      } else {
        body = `# Summary (Short Preset)\n\n- **Executive TL;DR**: The document provides strategic findings and empirical analysis across core operational pillars.\n- **Key Finding**: Implemented systems demonstrated measurable latency and throughput improvements across benchmark workloads.\n- **Conclusion**: Recommended methodologies provide a robust foundation for scalable future deployments.\n`;
      }
    } else if (preset === 'long') {
      if (isAcademic) {
        body = `# Comprehensive Analytical Summary (Long Preset)\n\n## 1. Context & Architectural Overview\nThe analyzed research paper addresses critical scalability limitations in hybrid quantum-classical algorithms. By decoupling parameter optimization across classical co-processors and quantum circuits, the framework optimizes gradient computation across multi-qubit topologies.\n\n## 2. Methodology & Quantitative Findings\nEmpirical benchmarks conducted across standard dataset evaluations demonstrated a 4.2x reduction in convergence epochs compared to ResNet-50 baselines. Two-qubit gate fidelities achieved 99.85%, while state preparation overhead was reduced through sparse amplitude encoding.\n\n## 3. Risk Assessment & Engineering Tradeoffs\nHardware decoherence limits circuit depth to 64 active layers. Thermal dissipation in cryo-interconnects introduces thermal noise, necessitating robust zero-noise extrapolation (ZNE) error mitigation techniques.\n\n## 4. Strategic Outlook & Recommendations\nThe modernization roadmap establishes 99.99% availability SLAs and sub-minute recovery objectives across all distributed computing workloads.\n`;
      } else {
        body = `# Comprehensive Analytical Summary (Long Preset)\n\n## 1. Context & Architectural Overview\nThe analyzed document provides an in-depth examination of system modernization, hybrid cloud architectures, and computational frameworks. The core thesis balances operational efficiency with scalable engineering patterns across 450 regional distribution hubs.\n\n## 2. Methodology & Quantitative Findings\nKey empirical evaluations demonstrated a 4.2x reduction in convergence epochs and a 38% reduction in Total Cost of Ownership (TCO) across 450 regional distribution hubs. Automated autoscaling policies reduced idle compute consumption by 45%.\n\n## 3. Risk Assessment & Engineering Tradeoffs\nHardware decoherence and distributed state synchronization represent primary risk vectors. Robust FinOps governance and automated right-sizing policies must be instituted across multi-region clusters to prevent runaway egress charges.\n\n## 4. Strategic Outlook & Recommendations\nThe modernization roadmap delivers 99.99% availability SLAs and sub-minute recovery objectives across all critical production workloads.\n`;
      }
    } else {
      // medium preset
      if (isAcademic) {
        body = `# Executive Summary (Medium Preset)\n\nThe submitted research paper outlines a hybrid Quantum Machine Learning architecture designed to accelerate high-dimensional optimization problems. By pairing classical co-processors with superconducting quantum circuits, the system achieves notable computational gains.\n\n### Core Insights\n- **Empirical Speedup**: Achieved 4.2x reduction in convergence epochs across benchmark datasets.\n- **Error Mitigation**: Employs zero-noise extrapolation to stabilize gate fidelities up to 99.85%.\n- **Decoherence Boundaries**: Circuit depth remains constrained by NISQ noise profiles.\n`;
      } else {
        body = `# Executive Summary (Medium Preset)\n\nThe submitted document outlines a comprehensive framework combining distributed systems and modernization patterns. Key findings show a 4.2x latency improvement and 38% projected cost savings over a three-year horizon.\n\n### Core Insights\n- **Microservice Decoupling**: Lift-and-shift containerization decouples legacy backends into scalable microservices.\n- **Cloud Governance**: Real-time cloud governance and automated right-sizing reduce annual operating overhead significantly.\n- **High Availability**: Architectural redesign guarantees sub-minute recovery time objectives (RTO).\n`;
      }
    }

    if (extractKeyPoints) {
      body += `\n## Key Takeaways\n- **Performance Acceleration**: Measured 4.2x latency and convergence improvement across benchmark datasets.\n- **Cost Efficiency**: Projected 38% operational cost reduction with sub-minute RPO and RTO.\n- **Architectural Resilience**: Zero-downtime containerization and serverless event-driven architecture.\n- **Scalability Milestone**: Validated throughput scalability across 450 regional distribution nodes.\n`;
    }

    if (extractSuggestions) {
      body += `\n## Improvement Suggestions\n1. **Clarity**: Add explicit error mitigation benchmarks and mathematical definitions for multi-qubit gates.\n2. **Structure**: Include a dedicated security posture matrix and Terraform module specifications in the appendix.\n3. **Completeness**: Provide quantitative cost comparison with legacy relational schemas and historical SLAs.\n4. **Actionable Recommendations**: Standardize CI/CD canary deployment pipelines before executing full production cutover.\n`;
    }

    return body;
  }

  private generateKeyPoints(options: SummarizationOptions): KeyPoint[] {
    const { extractKeyPoints = true } = options;
    if (!extractKeyPoints) return [];

    return [
      {
        id: 'kp-1',
        title: 'Performance Acceleration',
        description: 'Measured 4.2x latency and convergence improvement across benchmark datasets.',
        category: 'metric',
      },
      {
        id: 'kp-2',
        title: 'Operational Cost Reduction',
        description: 'Projected 38% operational cost reduction with sub-minute RPO and RTO.',
        category: 'strategic',
      },
      {
        id: 'kp-3',
        title: 'Architectural Resilience',
        description: 'Zero-downtime containerization and serverless event-driven architecture.',
        category: 'operational',
      },
    ];
  }

  private generateSuggestions(options: SummarizationOptions): ImprovementSuggestion[] {
    const { extractSuggestions = true } = options;
    if (!extractSuggestions) return [];

    return [
      {
        id: 'sug-1',
        category: 'clarity',
        title: 'Add Explicit Benchmark Metrics',
        suggestion: 'Include explicit noise mitigation benchmarks and formula derivations.',
        severity: 'medium',
      },
      {
        id: 'sug-2',
        category: 'structure',
        title: 'Dedicated Security Posture Matrix',
        suggestion: 'Include a dedicated security posture matrix in the appendix.',
        severity: 'low',
      },
      {
        id: 'sug-3',
        category: 'completeness',
        title: 'Historical Baseline Comparisons',
        suggestion: 'Provide quantitative comparison with legacy schemas.',
        severity: 'high',
      },
    ];
  }
}

export const mockSummarizerAdapter = new MockSummarizerAdapter();
