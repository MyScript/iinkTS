import type { TInteractiveInkCanvas } from "@/canvas/TInteractiveInkCanvas"
import { DOMFactory } from "@/components/dom"
import { getMathDiagnosticMessage } from "@/constants/MathDiagnosticMessages"
import { LoggerCategory, LoggerManager } from "@/logger"

import { Modal } from "./Modal"

/**
 * @group Components
 */
export type TSymbolDiagnostic = {
  jiixBlockId: string
  computeDiagnostic: string
  evaluationDiagnostic: string
}

/**
 * @group Components
 * @remarks Component for checking and displaying diagnostics for multiple math symbols
 */
export class IIMathDiagnosticChecker {
  private canvas: TInteractiveInkCanvas
  private jiixBlockIds: string[]
  private modal?: Modal
  private logger = LoggerManager.getLogger(LoggerCategory.MATH)

  constructor(canvas: TInteractiveInkCanvas, jiixBlockIds: string[]) {
    this.canvas = canvas
    this.jiixBlockIds = [...new Set(jiixBlockIds)]
  }

  /**
   * Show the diagnostic checker modal
   */
  async show(): Promise<void> {
    // Fetch diagnostics for all symbols
    const diagnostics: TSymbolDiagnostic[] = []

    for (const jiixBlockId of this.jiixBlockIds) {
      if (!jiixBlockId) {
        this.logger.warn(`Invalid jiixBlockId`)
        continue
      }

      try {
        const computeDiagnostic = await this.canvas.math.getDiagnostic(jiixBlockId, "numerical-computation")
        const evaluationDiagnostic = await this.canvas.math.getDiagnostic(jiixBlockId, "evaluation")

        diagnostics.push({
          jiixBlockId,
          computeDiagnostic,
          evaluationDiagnostic,
        })
      } catch (error) {
        const label = this.canvas.jiix.getBlockLabel(jiixBlockId)
        this.logger.error(`Error fetching diagnostics for symbol ${label}:`, error)
      }
    }

    if (diagnostics.length === 0) {
      this.logger.warn("No diagnostics could be retrieved for the selected symbols")
      return
    }

    // Create modal content
    const container = this.createModalContent(diagnostics)

    // Create modal
    this.modal = new Modal({
      title: `Math Diagnostic${diagnostics.length > 1 ? "s" : ""} (${diagnostics.length} symbol${diagnostics.length > 1 ? "s" : ""})`,
      fields: [],
      customContent: container,
      container: this.canvas.layers.root,
    })

    this.modal.open()
  }

  /**
   * Create the modal content with diagnostics
   */
  private createModalContent(diagnostics: TSymbolDiagnostic[]): HTMLDivElement {
    const container = DOMFactory.div({
      className: "ms-diagnostic-content",
    })

    // Create a section for each symbol
    diagnostics.forEach((diagnostic) => {
      const symbolSection = this.createSymbolDiagnosticSection(diagnostic)
      container.appendChild(symbolSection)
    })

    return container
  }

  /**
   * Create a diagnostic section for a single symbol
   */
  private createSymbolDiagnosticSection(diagnostic: TSymbolDiagnostic): HTMLDivElement {
    const section = DOMFactory.div({
      className: "ms-diagnostic-section",
    })

    // Expression header
    const label = this.canvas.jiix.getBlockLabel(diagnostic.jiixBlockId) || "N/A"
    const expressionDiv = DOMFactory.div({
      className: "ms-diagnostic-expression",
      html: `<strong>Expression:</strong> ${label}`,
    })
    section.appendChild(expressionDiv)

    // Severity colors configuration
    const severityColors = {
      success: {
        bg: "color-mix(in srgb, var(--ms-ink-success) 15%, transparent)",
        color: "var(--ms-ink-success)",
        icon: "✓",
      },
      warning: {
        bg: "color-mix(in srgb, var(--ms-ink-warning) 15%, transparent)",
        color: "var(--ms-ink-warning)",
        icon: "⚠",
      },
      error: {
        bg: "color-mix(in srgb, var(--ms-ink-error)   15%, transparent)",
        color: "var(--ms-ink-error)",
        icon: "✗",
      },
      info: {
        bg: "color-mix(in srgb, var(--ms-ink-info)    15%, transparent)",
        color: "var(--ms-ink-info)",
        icon: "ℹ",
      },
    }

    // Get diagnostic info
    const computeInfo = getMathDiagnosticMessage(diagnostic.computeDiagnostic)
    const evalInfo = getMathDiagnosticMessage(diagnostic.evaluationDiagnostic)

    // Numerical computation diagnostic
    section.appendChild(
      this.createDiagnosticSubSection(
        "🔢 Numerical Computation",
        diagnostic.computeDiagnostic,
        computeInfo,
        severityColors
      )
    )

    // Evaluation diagnostic
    section.appendChild(
      this.createDiagnosticSubSection(
        "📊 Function Evaluation",
        diagnostic.evaluationDiagnostic,
        evalInfo,
        severityColors
      )
    )

    return section
  }

  /**
   * Create a diagnostic sub-section
   */
  private createDiagnosticSubSection(
    taskName: string,
    diagnosticCode: string,
    diagnosticInfo: {
      title: string
      message: string
      severity: "success" | "warning" | "error" | "info"
    },
    severityColors: {
      [key: string]: {
        bg: string
        color: string
        icon: string
      }
    }
  ): HTMLDivElement {
    const subSection = DOMFactory.div({
      className: "ms-diagnostic-subsection",
    })

    // Task title
    const taskTitle = DOMFactory.div({
      className: "ms-diagnostic-task-title",
      text: taskName,
    })
    subSection.appendChild(taskTitle)

    // Diagnostic code
    const codeDiv = DOMFactory.div({
      className: "ms-diagnostic-code",
      html: `<strong>Code:</strong> ${diagnosticCode}`,
    })
    subSection.appendChild(codeDiv)

    // Status indicator
    const colors = severityColors[diagnosticInfo.severity]
    const statusDiv = DOMFactory.div({
      className: "ms-diagnostic-status",
      style: `background: ${colors.bg}; color: ${colors.color};`,
      html: `${colors.icon} ${diagnosticInfo.title}`,
    })
    subSection.appendChild(statusDiv)

    // Message
    const messageDiv = DOMFactory.div({
      className: "ms-diagnostic-message",
      text: diagnosticInfo.message,
    })
    subSection.appendChild(messageDiv)

    return subSection
  }

  /**
   * Close the diagnostic checker
   */
  close(): void {
    if (this.modal) {
      this.modal.destroy()
      this.modal = undefined
    }
  }
}
