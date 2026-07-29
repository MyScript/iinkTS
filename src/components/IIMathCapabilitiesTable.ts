import type { TInteractiveInkCanvas } from "@/canvas/TInteractiveInkCanvas"
import type { TButtonElConfig } from "@/components/dom"
import { DOMFactory } from "@/components/dom"
import { LoggerCategory } from "@/logger/logger"
import { LoggerManager } from "@/logger/LoggerManager"

import { IIMathDiagnosticChecker } from "./IIMathDiagnosticChecker"
import { IIMathFunctionEvaluator } from "./IIMathFunctionEvaluator"
import { IIMathVariablePerBlockCanvas } from "./IIMathVariablePerBlockCanvas"
import { Modal } from "./Modal"
import type { TTableRow } from "./Table"
import { Table } from "./Table"

/**
 * @group Components
 */
export type TMathSymbolCapabilities = {
  jiixBlockId: string
  canCheckDiagnostic: boolean
  canEditVariables: boolean
  canCompute: boolean
  canEvaluate: boolean
}

/**
 * @group Components
 * @remarks Component for displaying math symbols capabilities in a table
 */
export class IIMathCapabilitiesTable {
  private canvas: TInteractiveInkCanvas
  private modal?: Modal
  private table?: Table
  private capabilities: TMathSymbolCapabilities[] = []
  private actionButtons: {
    checkDiagnostic?: HTMLButtonElement
    editVariables?: HTMLButtonElement
    computeResult?: HTMLButtonElement
    evaluateFunction?: HTMLButtonElement
  } = {}
  private logger = LoggerManager.getLogger(LoggerCategory.MATH)

  constructor(canvas: TInteractiveInkCanvas) {
    this.canvas = canvas
    this.logger.debug("IIMathCapabilitiesTable initialized")
  }

  /**
   * Fetch capabilities for a single math symbol
   */
  private async fetchSymbolCapabilities(jiixBlockId: string): Promise<TMathSymbolCapabilities> {
    let canCheckDiagnostic = false
    let canEditVariables = false
    let canCompute = false
    let canEvaluate = false

    if (jiixBlockId) {
      try {
        const capabilities = await this.canvas.math.getBlockCapabilities(jiixBlockId)
        canCheckDiagnostic = true // Always available if jiixId exists
        canEditVariables = capabilities.canEditVariables
        canCompute = capabilities.canCompute
        canEvaluate = capabilities.canEvaluate
      } catch (error) {
        this.logger.error("Error fetching capabilities for blockId:", jiixBlockId, error)
      }
    }

    return {
      jiixBlockId,
      canCheckDiagnostic,
      canEditVariables,
      canCompute,
      canEvaluate,
    }
  }

  /**
   * Create the table element
   */
  private createTable(capabilities: TMathSymbolCapabilities[]): Table {
    // Store capabilities for action buttons
    this.capabilities = capabilities
    this.logger.debug("Creating capabilities table with capabilities:", capabilities)

    // Prepare rows
    const rows: TTableRow[] = capabilities.map((cap) => {
      // Symbol label cell
      const symbolCell = DOMFactory.span({
        className: "ms-symbol-cell",
        text: this.canvas.jiix.getBlockLabel(cap.jiixBlockId) || "Unknown Symbol",
      })
      symbolCell.title = this.canvas.jiix.getBlockLabel(cap.jiixBlockId) || ""

      // Create capability marks
      const capabilityValues = [cap.canCheckDiagnostic, cap.canEditVariables, cap.canCompute, cap.canEvaluate]

      const capabilityCells = capabilityValues.map((canDo) => {
        return DOMFactory.statusBadge(canDo)
      })

      return {
        cells: [symbolCell, ...capabilityCells],
        data: cap.jiixBlockId, // Store jiixBlockId reference in row data
      }
    })

    // Create table
    const table = new Table({
      columns: [
        { header: "Symbol", align: "left" },
        {
          header: "Check Diagnostic",
          align: "center",
        },
        {
          header: "Edit Variables",
          align: "center",
        },
        {
          header: "Compute Result",
          align: "center",
        },
        {
          header: "Evaluate Function",
          align: "center",
        },
      ],
      rows,
      stickyHeader: false,
      hoverEffect: true,
      selectable: true,
      multiSelect: true,
      onRowClick: this.handleRowSelection.bind(this),
    })

    return table
  }

  /**
   * Handle row selection
   */
  private handleRowSelection(): void {
    this.logger.debug("Row selection changed", this.table?.getSelectedRows())
    if (!this.table) {
      return
    }

    // Get selected symbols from table
    const selectedBlocks = this.table.getSelectedRowsData() as {
      id: string
      label: string
    }[]
    const selectedIds = selectedBlocks.map((s) => s.id)

    // Update canvas selection
    this.canvas.select(selectedIds)

    // Update action buttons state
    this.updateActionButtons()
  }

  /**
   * Update action buttons enabled/disabled state based on selected rows
   */
  private updateActionButtons(): void {
    if (!this.table) {
      return
    }

    const selectedIndices = this.table.getSelectedRows()
    const selectedCapabilities = selectedIndices.map((index) => this.capabilities[index])

    // Check if any selected row can perform each action
    const canCheckDiagnostic = selectedCapabilities.some((cap) => cap.canCheckDiagnostic)
    const canEditVariables = selectedCapabilities.some((cap) => cap.canEditVariables)
    const canCompute = selectedCapabilities.some((cap) => cap.canCompute)
    const canEvaluate = selectedCapabilities.some((cap) => cap.canEvaluate)

    // Update button states
    if (this.actionButtons.checkDiagnostic) {
      this.actionButtons.checkDiagnostic.disabled = !canCheckDiagnostic
      this.actionButtons.checkDiagnostic.style.opacity = canCheckDiagnostic ? "1" : "0.5"
    }
    if (this.actionButtons.editVariables) {
      this.actionButtons.editVariables.disabled = !canEditVariables
      this.actionButtons.editVariables.style.opacity = canEditVariables ? "1" : "0.5"
    }
    if (this.actionButtons.computeResult) {
      this.actionButtons.computeResult.disabled = !canCompute
      this.actionButtons.computeResult.style.opacity = canCompute ? "1" : "0.5"
    }
    if (this.actionButtons.evaluateFunction) {
      this.actionButtons.evaluateFunction.disabled = !canEvaluate
      this.actionButtons.evaluateFunction.style.opacity = canEvaluate ? "1" : "0.5"
    }
  }

  /**
   * Create action buttons container
   */
  private createActionButtons(): HTMLDivElement {
    const container = DOMFactory.div({
      className: "ms-capabilities-actions",
    })

    // Define button configurations
    const buttonConfigs: TButtonElConfig[] = [
      {
        label: "Check Diagnostic",
        variant: "primary",
        onClick: () => this.executeCheckDiagnostic(),
        id: "checkDiagnostic",
      },
      {
        label: "Edit Variables",
        variant: "secondary",
        onClick: () => this.executeEditVariables(),
        id: "editVariables",
      },
      {
        label: "Compute Result",
        variant: "success",
        onClick: () => this.executeComputeResult(),
        id: "computeResult",
      },
      {
        label: "Evaluate Function",
        variant: "info",
        onClick: () => this.executeEvaluateFunction(),
        id: "evaluateFunction",
      },
    ]

    buttonConfigs.forEach((config) => {
      const button = DOMFactory.button({
        id: `btn-${config.id}`,
        label: config.label,
        variant: config.variant || "primary",
        disabled: true,
        onClick: config.onClick,
      })
      this.actionButtons[config.id! as keyof typeof this.actionButtons] = button
      container.appendChild(button)
    })

    return container
  }

  /**
   * Execute Check Diagnostic action for selected rows
   */
  private async executeCheckDiagnostic(): Promise<void> {
    this.logger.debug("Executing Check Diagnostic for selected rows")
    if (!this.table) {
      return
    }

    const selectedIndices = this.table.getSelectedRows()
    const selectedBlockIds = selectedIndices
      .map((index) => this.capabilities[index])
      .filter((cap) => cap.canCheckDiagnostic)
      .map((cap) => cap.jiixBlockId)

    if (selectedBlockIds.length === 0) {
      return
    }

    const checker = new IIMathDiagnosticChecker(this.canvas, selectedBlockIds)
    await checker.show()
  }

  /**
   * Execute Edit Variables action for selected rows
   */
  private async executeEditVariables(): Promise<void> {
    this.logger.debug("Executing Edit Variables for selected rows")
    if (!this.table) {
      return
    }

    const selectedIndices = this.table.getSelectedRows()
    const selectedBlockIds = selectedIndices
      .map((index) => this.capabilities[index])
      .filter((cap) => cap.canEditVariables)
      .map((cap) => cap.jiixBlockId)

    if (selectedBlockIds.length === 0) {
      return
    }

    const variableCanvas = new IIMathVariablePerBlockCanvas(this.canvas, selectedBlockIds)
    await variableCanvas.show()
  }

  /**
   * Execute Compute Result action for selected rows
   */
  private async executeComputeResult(): Promise<void> {
    this.logger.debug("Executing Compute Result for selected rows")
    if (!this.table) {
      return
    }

    const selectedIndices = this.table.getSelectedRows()
    const selectedBlockIds = selectedIndices
      .map((index) => this.capabilities[index])
      .filter((cap) => cap.canCompute)
      .map((cap) => cap.jiixBlockId)

    if (selectedBlockIds.length === 0) {
      return
    }

    await Promise.all(selectedBlockIds.map((id) => this.canvas.math.computeNumericalResult(id)))
  }

  /**
   * Execute Evaluate Function action for selected rows
   */
  private async executeEvaluateFunction(): Promise<void> {
    this.logger.debug("Executing Evaluate Function for selected rows")
    if (!this.table) {
      return
    }

    const selectedIndices = this.table.getSelectedRows()
    const selectedBlockIds = selectedIndices
      .map((index) => this.capabilities[index])
      .filter((cap) => cap.canEvaluate)
      .map((cap) => cap.jiixBlockId)

    if (selectedBlockIds.length === 0) {
      return
    }

    const evaluator = new IIMathFunctionEvaluator(this.canvas, selectedBlockIds)
    await evaluator.show()
  }

  /**
   * Show the capabilities overview modal
   */
  async show(): Promise<void> {
    this.logger.debug("Showing Math Capabilities Overview modal")
    const mathBlocks = this.canvas.model.mathBlocks

    // Fetch capabilities for all symbols
    const capabilities: TMathSymbolCapabilities[] = []
    for (const mb of mathBlocks) {
      const cap = await this.fetchSymbolCapabilities(mb.id)
      capabilities.push(cap)
    }

    this.table = this.createTable(capabilities)
    const actionButtons = this.createActionButtons()
    const container = DOMFactory.div({
      className: "ms-capabilities-content",
    })

    const tableWrapper = DOMFactory.div({
      className: "ms-capabilities-table-wrapper",
    })
    tableWrapper.appendChild(this.table.getElement())

    container.appendChild(tableWrapper)
    container.appendChild(actionButtons)

    // Show modal
    this.modal = new Modal({
      title: `Math Symbols Capabilities (${mathBlocks.length} symbols)`,
      fields: [],
      customContent: container,
      container: this.canvas.layers.ui.root,
    })
    this.modal.open()
  }

  /**
   * Close the modal
   */
  close(): void {
    this.logger.debug("Closing Math Capabilities Overview modal")
    if (this.modal) {
      this.modal.destroy()
      this.modal = undefined
    }
    this.table = undefined
    this.capabilities = []
    this.actionButtons = {}
  }
}
