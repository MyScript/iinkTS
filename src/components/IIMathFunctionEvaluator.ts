import type { TInteractiveInkCanvas } from "@/canvas/TInteractiveInkCanvas"
import { DOMFactory } from "@/components/dom"
import { LoggerCategory, LoggerManager } from "@/logger"

import { Chart } from "./Chart"
import { Modal } from "./Modal"
import type { TTableRow } from "./Table"
import { Table } from "./Table"

/**
 * @group Components
 */
export type TMathEvaluableFunction = {
  jiixBlockId: string
  evaluables: Array<{
    inputName: string
    outputName: string
  }>
  selectedEvaluableIndex: number
  color: string
}

/**
 * @group Components
 */
export type TEvaluationResult = {
  func: TMathEvaluableFunction
  points: { [key: string]: number }[][]
}

/**
 * @group Components
 * @remarks Component for evaluating and displaying multiple math functions
 */
export class IIMathFunctionEvaluator {
  private canvas: TInteractiveInkCanvas
  private jiixBlockIds: string[]
  private modal?: Modal
  private evaluationResults?: TEvaluationResult[]
  private tabContent?: HTMLDivElement
  private currentTab: "graph" | "table" = "graph"
  private functionsToEvaluate: TMathEvaluableFunction[] = []
  private logger = LoggerManager.getLogger(LoggerCategory.MATH)

  // Chart colors for multiple functions
  private static readonly COLORS = [
    "#2196F3", // Blue
    "#F44336", // Red
    "#4CAF50", // Green
    "#FF9800", // Orange
    "#9C27B0", // Purple
    "#00BCD4", // Cyan
    "#FFC107", // Amber
    "#E91E63", // Pink
    "#009688", // Teal
    "#795548", // Brown
  ]

  constructor(canvas: TInteractiveInkCanvas, jiixBlockIds: string[]) {
    this.canvas = canvas
    this.jiixBlockIds = [...new Set(jiixBlockIds)]
  }

  /**
   * Show the function evaluator modal
   */
  async show(): Promise<void> {
    // Fetch evaluables for all symbols
    this.functionsToEvaluate = []

    for (let i = 0; i < this.jiixBlockIds.length; i++) {
      const jiixBlockId = this.jiixBlockIds[i]
      if (!jiixBlockId) {
        continue
      }

      try {
        const evaluables = await this.canvas.math.getEvaluables(jiixBlockId)
        if (evaluables.length > 0) {
          this.functionsToEvaluate.push({
            jiixBlockId,
            evaluables: evaluables,
            selectedEvaluableIndex: 0,
            color: IIMathFunctionEvaluator.COLORS[i % IIMathFunctionEvaluator.COLORS.length],
          })
        }
      } catch (error) {
        this.logger.error(`Error fetching evaluables for symbol ${jiixBlockId}:`, error)
      }
    }

    if (this.functionsToEvaluate.length === 0) {
      this.logger.warn("No evaluable functions found in the selected symbols")
      return
    }

    // Create modal content
    const container = this.createModalContent(this.functionsToEvaluate)

    // Create modal
    this.modal = new Modal({
      title: "Evaluate Function",
      fields: [],
      customContent: container,
      container: this.canvas.layers.ui.root,
    })

    this.modal.open()
  }

  /**
   * Create the modal content with inputs and tabs
   */
  private createModalContent(functions: TMathEvaluableFunction[]): HTMLDivElement {
    const container = DOMFactory.div({
      className: "ms-evaluator-content",
    })

    // Inputs section
    const inputsSection = this.createInputsSection(functions)
    container.appendChild(inputsSection)

    // Tabs section
    const tabsSection = this.createTabsSection()
    container.appendChild(tabsSection)

    return container
  }

  /**
   * Create a single function item for display
   */
  private createFunctionItem(func: TMathEvaluableFunction): HTMLDivElement {
    const funcItem = DOMFactory.div({
      className: "ms-function-item",
    })

    const colorDot = DOMFactory.colorDot(func.color)

    const selectedEvaluable = func.evaluables[func.selectedEvaluableIndex]
    const label = DOMFactory.span({
      text: `${selectedEvaluable.outputName} = f(${selectedEvaluable.inputName})`,
      style: `font-family: monospace; flex-shrink: 0;`,
    })

    const blockLabel = this.canvas.jiix.getBlockLabel(func.jiixBlockId) || "N/A"
    const symbolLabel = DOMFactory.span({
      text: ` - ${blockLabel}`,
      className: "ms-symbol-label",
    })

    funcItem.appendChild(colorDot)
    funcItem.appendChild(label)
    funcItem.appendChild(symbolLabel)

    // Add select dropdown if multiple evaluables
    if (func.evaluables.length > 1) {
      const selectWrapper = DOMFactory.div({
        className: "ms-select-wrapper",
      })

      const selectLabel = DOMFactory.span({
        text: "Variant:",
        className: "ms-select-label",
      })

      const select = DOMFactory.select({
        id: `evaluable-select-${func.jiixBlockId}`,
        className: "ms-menu-input",
        options: func.evaluables.map((ev, evIndex) => ({
          value: String(evIndex),
          label: `${ev.outputName} = f(${ev.inputName})`,
          selected: evIndex === func.selectedEvaluableIndex,
        })),
        onChange: (value) => {
          func.selectedEvaluableIndex = parseInt(value)
          const newEvaluable = func.evaluables[func.selectedEvaluableIndex]
          label.textContent = `${newEvaluable.outputName} = f(${newEvaluable.inputName})`
          // Clear evaluation results when changing evaluable
          this.evaluationResults = undefined
          this.renderCurrentTab()
        },
      })

      selectWrapper.appendChild(selectLabel)
      selectWrapper.appendChild(select)
      funcItem.appendChild(selectWrapper)
    }

    return funcItem
  }

  /**
   * Create the functions list display
   */
  private createFunctionsList(functions: TMathEvaluableFunction[]): HTMLDivElement {
    const functionsDiv = DOMFactory.div({
      className: "ms-functions-card",
    })

    const functionsTitle = DOMFactory.div({
      text: "Functions to evaluate:",
      className: "ms-functions-title",
    })
    functionsDiv.appendChild(functionsTitle)

    functions.forEach((func) => {
      const funcItem = this.createFunctionItem(func)
      functionsDiv.appendChild(funcItem)
    })

    return functionsDiv
  }

  /**
   * Create the evaluation inputs grid (from, to, points, step)
   */
  private createEvaluationInputsGrid(): {
    grid: HTMLDivElement
    inputs: {
      from: HTMLDivElement
      to: HTMLDivElement
      pointCount: HTMLDivElement
      step: HTMLDivElement
    }
  } {
    const inputGrid = DOMFactory.div({
      className: "ms-input-grid-4",
    })

    const fromInput = DOMFactory.labeledInput({
      id: "from",
      label: "From:",
      defaultValue: -10,
    }).wrapper
    const toInput = DOMFactory.labeledInput({
      id: "to",
      label: "To:",
      defaultValue: 10,
    }).wrapper
    const pointCountInput = DOMFactory.labeledInput({
      id: "pointCount",
      label: "Points:",
      defaultValue: 21,
    }).wrapper
    const stepInput = DOMFactory.labeledInput({
      id: "step",
      label: "Step:",
      defaultValue: 1,
    }).wrapper

    inputGrid.appendChild(fromInput)
    inputGrid.appendChild(toInput)
    inputGrid.appendChild(pointCountInput)
    inputGrid.appendChild(stepInput)

    return {
      grid: inputGrid,
      inputs: {
        from: fromInput,
        to: toInput,
        pointCount: pointCountInput,
        step: stepInput,
      },
    }
  }

  /**
   * Create the evaluate button
   */
  private createEvaluateButton(
    fromInput: HTMLDivElement,
    toInput: HTMLDivElement,
    pointCountInput: HTMLDivElement
  ): HTMLButtonElement {
    const evaluateBtn = DOMFactory.button({
      label: "Evaluate",
      variant: "primary",
      onClick: () => {
        this.evaluateFunctions(this.functionsToEvaluate, fromInput, toInput, pointCountInput)
      },
    })
    evaluateBtn.style.marginTop = "var(--ms-ink-spacing-lg)"
    evaluateBtn.style.width = "100%"
    return evaluateBtn
  }

  /**
   * Create the inputs section
   */
  private createInputsSection(functions: TMathEvaluableFunction[]): HTMLDivElement {
    const section = DOMFactory.div({
      className: "ms-section",
    })

    // Functions list
    const functionsList = this.createFunctionsList(functions)
    section.appendChild(functionsList)

    // Input grid
    const { grid: inputGrid, inputs } = this.createEvaluationInputsGrid()
    section.appendChild(inputGrid)

    // Evaluate button
    const evaluateBtn = this.createEvaluateButton(inputs.from, inputs.to, inputs.pointCount)
    section.appendChild(evaluateBtn)

    // Setup input synchronization
    this.setupInputSynchronization(inputs.from, inputs.to, inputs.pointCount, inputs.step)

    return section
  }

  /**
   * Setup input synchronization (step/pointCount)
   */
  private setupInputSynchronization(
    fromWrapper: HTMLDivElement,
    toWrapper: HTMLDivElement,
    pointCountWrapper: HTMLDivElement,
    stepWrapper: HTMLDivElement
  ): void {
    const fromInput = fromWrapper.querySelector("input") as HTMLInputElement
    const toInput = toWrapper.querySelector("input") as HTMLInputElement
    const pointCountInput = pointCountWrapper.querySelector("input") as HTMLInputElement
    const stepInput = stepWrapper.querySelector("input") as HTMLInputElement

    let isUpdatingStep = false
    let isUpdatingPointCount = false
    let lastModified: "step" | "pointCount" = "pointCount"

    const updateStep = () => {
      if (isUpdatingStep) {
        return
      }
      isUpdatingPointCount = true

      const from = parseFloat(fromInput.value)
      const to = parseFloat(toInput.value)
      const pointCount = parseInt(pointCountInput.value)

      if (!isNaN(from) && !isNaN(to) && !isNaN(pointCount) && pointCount > 1) {
        const step = (to - from) / (pointCount - 1)
        stepInput.value = step.toFixed(6)
      }

      isUpdatingPointCount = false
    }

    const updatePointCount = () => {
      if (isUpdatingPointCount) {
        return
      }
      isUpdatingStep = true

      const from = parseFloat(fromInput.value)
      const to = parseFloat(toInput.value)
      const step = parseFloat(stepInput.value)

      if (!isNaN(from) && !isNaN(to) && !isNaN(step) && step > 0) {
        const pointCount = Math.floor((to - from) / step) + 1
        pointCountInput.value = String(Math.max(2, pointCount))
      }

      isUpdatingStep = false
    }

    const updateBasedOnLastModified = () => {
      if (lastModified === "pointCount") {
        updateStep()
      } else {
        updatePointCount()
      }
    }

    fromInput.addEventListener("input", updateBasedOnLastModified)
    toInput.addEventListener("input", updateBasedOnLastModified)
    pointCountInput.addEventListener("input", () => {
      lastModified = "pointCount"
      updateStep()
    })
    stepInput.addEventListener("input", () => {
      lastModified = "step"
      updatePointCount()
    })

    // Initial calculation
    updateStep()
  }

  /**
   * Create the tabs section (Graph and Table)
   */
  private createTabsSection(): HTMLDivElement {
    const section = DOMFactory.div({
      className: "ms-tabs-section",
    })

    // Tab headers
    const tabHeaders = DOMFactory.div({
      className: "ms-tab-headers",
    })

    const graphTab = this.createTabHeader("Graph", true)
    const tableTab = this.createTabHeader("Table", false)

    tabHeaders.appendChild(graphTab)
    tabHeaders.appendChild(tableTab)
    section.appendChild(tabHeaders)

    // Tab content
    const tabContent = DOMFactory.div({
      className: "ms-tab-content",
    })
    section.appendChild(tabContent)

    // Store reference
    this.tabContent = tabContent

    // Initial message
    const initialMessage = DOMFactory.div({
      text: "Click 'Evaluate' to display results",
      className: "ms-tab-empty",
    })
    tabContent.appendChild(initialMessage)

    // Tab switching
    graphTab.addEventListener("click", () => {
      if (this.currentTab === "graph") {
        return
      }
      this.currentTab = "graph"
      graphTab.classList.add("active")
      tableTab.classList.remove("active")
      this.renderCurrentTab()
    })

    tableTab.addEventListener("click", () => {
      if (this.currentTab === "table") {
        return
      }
      this.currentTab = "table"
      tableTab.classList.add("active")
      graphTab.classList.remove("active")
      this.renderCurrentTab()
    })

    return section
  }

  /**
   * Create a tab header
   */
  private createTabHeader(label: string, active: boolean): HTMLButtonElement {
    const tab = DOMFactory.button({
      label,
      className: active ? "ms-tab-header active" : "ms-tab-header",
    })
    return tab
  }

  /**
   * Evaluate all functions
   */
  private async evaluateFunctions(
    functions: TMathEvaluableFunction[],
    fromWrapper: HTMLDivElement,
    toWrapper: HTMLDivElement,
    pointCountWrapper: HTMLDivElement
  ): Promise<void> {
    const fromInput = fromWrapper.querySelector("input") as HTMLInputElement
    const toInput = toWrapper.querySelector("input") as HTMLInputElement
    const pointCountInput = pointCountWrapper.querySelector("input") as HTMLInputElement

    const from = parseFloat(fromInput.value)
    const to = parseFloat(toInput.value)
    const pointCount = parseInt(pointCountInput.value)

    if (isNaN(from) || isNaN(to) || isNaN(pointCount)) {
      this.logger.warn("Invalid input values")
      return
    }

    try {
      // Evaluate all functions
      const allResults: TEvaluationResult[] = []

      for (const func of functions) {
        const selectedEvaluable = func.evaluables[func.selectedEvaluableIndex]
        const points = await this.canvas.math.evaluateFunction(func.jiixBlockId, {
          inputVariableName: selectedEvaluable.inputName,
          outputVariableName: selectedEvaluable.outputName,
          from,
          to,
          pointCount,
        })
        allResults.push({ func, points })
      }

      // Store results for rendering
      this.evaluationResults = allResults

      // Render current tab
      this.renderCurrentTab()
    } catch (error) {
      this.logger.error("Error evaluating functions:", error)
      this.logger.error("Error evaluating functions")
    }
  }

  /**
   * Render the current tab content
   */
  private renderCurrentTab(): void {
    if (!this.tabContent) {
      return
    }

    // Clear container
    this.tabContent.innerHTML = ""

    const results = this.evaluationResults

    if (!results || results.length === 0) {
      const message = DOMFactory.div({
        text: "Click 'Evaluate' to display results",
        className: "ms-tab-empty",
      })
      this.tabContent.appendChild(message)
      return
    }

    if (this.currentTab === "graph") {
      this.renderGraph(results)
    } else {
      this.renderTable(results)
    }
  }

  /**
   * Render the graph tab
   */
  private renderGraph(results: TEvaluationResult[]): void {
    if (!this.tabContent) {
      return
    }

    const tabContent = this.tabContent

    const groupedByInput = this.groupResultsByInputName(results)

    // Create a chart for each input group
    groupedByInput.forEach((groupResults, inputName) => {
      // Collect all output names for this group
      const outputNames = new Set<string>()
      groupResults.forEach((result) => {
        const evalSelected = result.func.evaluables[result.func.selectedEvaluableIndex]
        outputNames.add(evalSelected.outputName)
      })

      // Collect data for this group and collect colors
      const normalizedData: number[][][] = []
      const seriesColors: string[] = []

      groupResults.forEach((result) => {
        const evalSelected = result.func.evaluables[result.func.selectedEvaluableIndex]
        const inputVarName = evalSelected.inputName
        const outputVarName = evalSelected.outputName

        // Process each series of points
        // Normalize to [[x, y], [x, y], ...] format
        result.points.forEach((pointSeries) => {
          const normalizedSeries = pointSeries.map((point) => [point[inputVarName], point[outputVarName]])
          normalizedData.push(normalizedSeries)
          seriesColors.push(result.func.color)
        })
      })

      // Create chart title with input and outputs
      const outputNamesStr = Array.from(outputNames).join(", ")
      const chartTitle = `${outputNamesStr} = f(${inputName})`

      // Create chart with actual variable names
      const chart = new Chart({
        width: Math.max(650, window.innerWidth * 0.6),
        height: 400,
        title: chartTitle,
        xLabel: inputName,
        yLabel: outputNamesStr,
        lineColor: "var(--ms-ink-primary)",
        showGrid: true,
        showPoints: true,
        seriesColors: seriesColors,
      })

      chart.setData(normalizedData)
      tabContent.appendChild(chart.getElement())

      // Add spacing between charts
      if (groupedByInput.size > 1) {
        const spacer = DOMFactory.div({
          style: "height: 20px;",
        })
        tabContent.appendChild(spacer)
      }
    })
  }

  /**
   * Group evaluation results by input variable name
   */
  private groupResultsByInputName(results: TEvaluationResult[]): Map<string, TEvaluationResult[]> {
    const groupedByInput = new Map<string, TEvaluationResult[]>()

    results.forEach((result) => {
      const evalSelected = result.func.evaluables[result.func.selectedEvaluableIndex]
      const inputName = evalSelected.inputName

      if (!groupedByInput.has(inputName)) {
        groupedByInput.set(inputName, [])
      }
      groupedByInput.get(inputName)!.push(result)
    })

    return groupedByInput
  }

  /**
   * Create table title element
   */
  private createTableTitle(inputName: string): HTMLDivElement {
    return DOMFactory.div({
      text: `Input: ${inputName}`,
      className: "ms-table-title-header",
    })
  }

  /**
   * Create table columns for a group of results
   */
  private createTableColumns(
    groupResults: TEvaluationResult[],
    inputName: string
  ): (
    | string
    | {
        header: string | HTMLElement
        align?: "left" | "center" | "right"
        width?: string
      }
  )[] {
    const columns: (
      | string
      | {
          header: string | HTMLElement
          align?: "left" | "center" | "right"
          width?: string
        }
    )[] = [
      { header: "#", align: "center" as const },
      {
        header: inputName,
        align: "center" as const,
      },
    ]

    // Add columns for each function and each series
    groupResults.forEach((result) => {
      const evalSelected = result.func.evaluables[result.func.selectedEvaluableIndex]
      const outputName = evalSelected.outputName || "y"
      const color = result.func.color

      if (result.points.length === 1) {
        // Single series: one column
        const header = DOMFactory.span({
          text: outputName,
          style: `color: ${color}; font-weight: 600;`,
        })
        columns.push({
          header: header,
          align: "center" as const,
        })
      } else {
        // Multiple series: multiple columns
        result.points.forEach((_, seriesIndex) => {
          const header = DOMFactory.span({
            text: `${outputName} #${seriesIndex + 1}`,
            style: `color: ${color}; font-weight: 600;`,
          })
          columns.push({
            header: header,
            align: "center" as const,
          })
        })
      }
    })

    return columns
  }

  /**
   * Create table rows for a group of results
   */
  private createTableRows(groupResults: TEvaluationResult[], numPoints: number): TTableRow[] {
    const rows: TTableRow[] = []

    for (let i = 0; i < numPoints; i++) {
      const cells: HTMLElement[] = []

      // Row number
      const indexCell = DOMFactory.span({
        text: String(i + 1),
        style: "font-weight: 500;",
      })
      cells.push(indexCell)

      // Input value - get from first result's first series
      const firstEvalSelected = groupResults[0].func.evaluables[groupResults[0].func.selectedEvaluableIndex]
      const xValue = groupResults[0].points[0][i][firstEvalSelected.inputName]
      const xCell = DOMFactory.span({
        text: typeof xValue === "number" ? xValue.toFixed(4) : String(xValue),
        style: "font-family: monospace;",
      })
      cells.push(xCell)

      // Output values for each function and each series
      groupResults.forEach((result) => {
        const evalSelected = result.func.evaluables[result.func.selectedEvaluableIndex]
        const color = result.func.color

        result.points.forEach((pointSeries) => {
          const yValue = pointSeries[i][evalSelected.outputName]
          const yCell = DOMFactory.span()

          if (typeof yValue === "number") {
            if (isNaN(yValue)) {
              yCell.textContent = "NaN"
              yCell.style.color = "#999"
              yCell.style.fontStyle = "italic"
            } else if (!isFinite(yValue)) {
              yCell.textContent = yValue > 0 ? "+∞" : "-∞"
              yCell.style.color = "#ff9800"
              yCell.style.fontWeight = "bold"
            } else {
              yCell.textContent = yValue.toFixed(4)
              yCell.style.color = color
            }
          } else {
            yCell.textContent = String(yValue)
          }

          yCell.style.fontFamily = "monospace"
          cells.push(yCell)
        })
      })

      rows.push({ cells })
    }

    return rows
  }

  /**
   * Render the table tab
   */
  private renderTable(results: TEvaluationResult[]): void {
    if (!this.tabContent) {
      return
    }

    const tabContent = this.tabContent

    // Group results by inputName
    const groupedByInput = this.groupResultsByInputName(results)

    // Create a table for each input group
    groupedByInput.forEach((groupResults, inputName) => {
      // Add title for this table if multiple groups
      if (groupedByInput.size > 1) {
        const tableTitle = this.createTableTitle(inputName)
        tabContent.appendChild(tableTitle)
      }

      // Get the number of points from first result's first series
      const numPoints = groupResults[0].points[0].length

      // Build columns and rows
      const columns = this.createTableColumns(groupResults, inputName)
      const rows = this.createTableRows(groupResults, numPoints)

      // Create table
      const table = new Table({
        columns,
        rows,
        stickyHeader: true,
        hoverEffect: true,
      })

      const tableWrapper = DOMFactory.div({
        className: "ms-table-wrapper",
      })
      tableWrapper.appendChild(table.getElement())
      tabContent.appendChild(tableWrapper)
    })
  }

  /**
   * Close the evaluator
   */
  close(): void {
    if (this.modal) {
      this.modal.destroy()
      this.modal = undefined
    }
    this.tabContent = undefined
    this.evaluationResults = undefined
    this.currentTab = "graph"
    this.functionsToEvaluate = []
  }
}
