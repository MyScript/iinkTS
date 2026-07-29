import { DOMFactory } from "@/components/dom"
import { areValidCoordinates, TWO_PI } from "@/utils"

/**
 * @group Components
 */
export type TChartConfig = {
  width?: number
  height?: number
  title?: string
  xLabel?: string
  yLabel?: string
  lineColor?: string
  lineWidth?: number
  showGrid?: boolean
  showPoints?: boolean
  seriesColors?: string[] // Custom colors for each series
}

/**
 * @hidden
 */
type TViewPort = {
  xMin: number
  xMax: number
  yMin: number
  yMax: number
}

/**
 * @hidden
 */
type TMargin = {
  top: number
  right: number
  bottom: number
  left: number
}

/**
 * @hidden
 */
type TScaleFunctions = {
  scaleX: (x: number) => number
  scaleY: (y: number) => number
}

/**
 * @hidden
 */
type TAxisPositions = {
  xAxisY: number
  yAxisX: number
}

/**
 * @group Components
 */
export class Chart {
  private static readonly CHART_MARGIN: TMargin = { top: 40, right: 40, bottom: 60, left: 60 }
  private static readonly SERIES_COLORS = [
    "#2196F3", // Blue
    "#FF5722", // Red
    "#4CAF50", // Green
    "#9C27B0", // Purple
    "#FF9800", // Orange
    "#00BCD4", // Cyan
    "#E91E63", // Pink
  ]

  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private config: Required<TChartConfig>
  private series: number[][][] = [] // Array of series, each series is an array of [x, y] points
  private container: HTMLDivElement
  private viewport: TViewPort | null = null
  private defaultViewport: TViewPort | null = null
  private isDragging = false
  private lastMousePos = { x: 0, y: 0 }
  private controlsContainer?: HTMLDivElement

  constructor(config: TChartConfig = {}) {
    this.config = {
      width: config.width ?? 500,
      height: config.height ?? 350,
      title: config.title ?? "",
      xLabel: config.xLabel ?? "x",
      yLabel: config.yLabel ?? "y",
      lineColor: config.lineColor ?? "#2196F3",
      lineWidth: config.lineWidth ?? 2,
      showGrid: config.showGrid ?? true,
      showPoints: config.showPoints ?? true,
      seriesColors: config.seriesColors,
    } as Required<TChartConfig>

    // Create container
    this.container = DOMFactory.div({
      className: "ms-chart",
    })

    // Create controls
    this.createControls()

    this.canvas = DOMFactory.canvas()
    this.canvas.width = this.config.width
    this.canvas.height = this.config.height
    this.canvas.className = "ms-chart-canvas"

    const ctx = this.canvas.getContext("2d")
    if (!ctx) {
      throw new Error("Could not get canvas 2D context")
    }
    this.ctx = ctx

    // Add zoom and pan event listeners
    this.setupInteractions()

    this.container.appendChild(this.canvas)
  }

  private createControls(): void {
    this.controlsContainer = DOMFactory.div({
      className: "ms-chart-controls",
    })

    const createChartButton = (label: string, onClick: () => void): HTMLButtonElement => {
      return DOMFactory.button({
        label,
        onClick,
        className: "ms-chart-btn",
      })
    }

    const zoomInBtn = createChartButton("Zoom +", () => this.zoom(1.2))
    const zoomOutBtn = createChartButton("Zoom −", () => this.zoom(0.8))
    const resetBtn = createChartButton("Reset", () => this.resetZoom())
    const togglePointsBtn = createChartButton(this.config.showPoints ? "Hide Points" : "Show Points", () => {
      this.config.showPoints = !this.config.showPoints
      togglePointsBtn.textContent = this.config.showPoints ? "Hide Points" : "Show Points"
      this.draw()
    })

    const label = DOMFactory.span({
      text: "Zoom: ",
      className: "ms-chart-zoom-label",
    })
    const info = DOMFactory.span({
      text: "Use ctrl+mouse wheel to zoom, drag to pan",
      className: "ms-chart-info",
    })

    this.controlsContainer.appendChild(zoomInBtn)
    this.controlsContainer.appendChild(zoomOutBtn)
    this.controlsContainer.appendChild(resetBtn)
    this.controlsContainer.appendChild(togglePointsBtn)
    this.controlsContainer.appendChild(label)
    this.controlsContainer.appendChild(info)

    this.container.appendChild(this.controlsContainer)
  }

  private setupInteractions(): void {
    this.canvas.addEventListener("wheel", (e) => {
      if (!e.ctrlKey) {
        return
      }
      e.preventDefault()
      e.stopPropagation()
      const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9
      this.zoom(zoomFactor, {
        x: e.offsetX,
        y: e.offsetY,
      })
    })

    this.canvas.addEventListener("mousedown", (e) => {
      this.isDragging = true
      this.lastMousePos = {
        x: e.offsetX,
        y: e.offsetY,
      }
      this.setCursor("grabbing")
    })

    this.canvas.addEventListener("mousemove", (e) => {
      if (!this.isDragging || !this.viewport) {
        return
      }

      const dx = e.offsetX - this.lastMousePos.x
      const dy = e.offsetY - this.lastMousePos.y
      this.lastMousePos = {
        x: e.offsetX,
        y: e.offsetY,
      }

      this.pan(dx, dy)
    })

    const stopDragging = () => {
      this.isDragging = false
      this.setCursor("grab")
    }

    this.canvas.addEventListener("mouseup", stopDragging)
    this.canvas.addEventListener("mouseleave", stopDragging)
  }

  /**
   * Set cursor style
   */
  private setCursor(cursor: string): void {
    this.canvas.style.cursor = cursor
  }

  /**
   * Check if a point is valid (not NaN or Infinite)
   */
  private isValidPoint(x: number, y: number): boolean {
    return areValidCoordinates(x, y)
  }

  /**
   * Get series colors
   */
  private getSeriesColors(): string[] {
    // Use custom colors if provided
    if (this.config.seriesColors && this.config.seriesColors.length > 0) {
      return this.config.seriesColors
    }

    // Otherwise use default colors
    const colors = [...Chart.SERIES_COLORS]
    colors[0] = this.config.lineColor
    return colors
  }

  private zoom(factor: number, center?: { x: number; y: number }): void {
    if (!this.viewport) {
      return
    }

    const { chartWidth, chartHeight, margin } = this.getChartDimensions()

    let centerX: number, centerY: number
    let relX: number, relY: number

    if (center) {
      // Zoom towards mouse position
      relX = (center.x - margin.left) / chartWidth
      relY = (center.y - margin.top) / chartHeight
      centerX = this.viewport.xMin + relX * (this.viewport.xMax - this.viewport.xMin)
      centerY = this.viewport.yMax - relY * (this.viewport.yMax - this.viewport.yMin)
    } else {
      // Zoom towards center
      relX = 0.5
      relY = 0.5
      centerX = (this.viewport.xMin + this.viewport.xMax) / 2
      centerY = (this.viewport.yMin + this.viewport.yMax) / 2
    }

    const xRange = (this.viewport.xMax - this.viewport.xMin) / factor
    const yRange = (this.viewport.yMax - this.viewport.yMin) / factor

    // Keep the point under the cursor (relX/relY) fixed on screen after zoom
    this.viewport = {
      xMin: centerX - relX * xRange,
      xMax: centerX + (1 - relX) * xRange,
      yMin: centerY - (1 - relY) * yRange,
      yMax: centerY + relY * yRange,
    }

    this.draw()
  }

  private pan(dx: number, dy: number): void {
    if (!this.viewport) {
      return
    }

    const { chartWidth, chartHeight } = this.getChartDimensions()

    const xRange = this.viewport.xMax - this.viewport.xMin
    const yRange = this.viewport.yMax - this.viewport.yMin

    const xShift = (-dx / chartWidth) * xRange
    const yShift = (dy / chartHeight) * yRange

    this.viewport = {
      xMin: this.viewport.xMin + xShift,
      xMax: this.viewport.xMax + xShift,
      yMin: this.viewport.yMin + yShift,
      yMax: this.viewport.yMax + yShift,
    }

    this.draw()
  }

  private resetZoom(): void {
    this.viewport = this.defaultViewport ? { ...this.defaultViewport } : null
    this.draw()
  }

  /**
   * Get chart dimensions accounting for margins
   */
  private getChartDimensions(): {
    chartWidth: number
    chartHeight: number
    margin: TMargin
  } {
    const margin = Chart.CHART_MARGIN
    const chartWidth = this.config.width - margin.left - margin.right
    const chartHeight = this.config.height - margin.top - margin.bottom
    return { chartWidth, chartHeight, margin }
  }

  /**
   * Compute range with padding for axis bounds
   */
  private computeRangeWithPadding(min: number, max: number, paddingRatio: number = 0.1): { min: number; max: number } {
    const range = max - min
    if (range === 0) {
      const padding = Math.abs(min) * paddingRatio || 1
      return {
        min: min - padding,
        max: max + padding,
      }
    }
    const padding = range * paddingRatio
    return {
      min: min - padding,
      max: max + padding,
    }
  }

  /**
   * Filter outliers using IQR method
   */
  private filterOutliers(values: number[]): number[] {
    if (values.length === 0) {
      return values
    }

    const sorted = [...values].sort((a, b) => a - b)
    const q1Index = Math.floor(sorted.length * 0.25)
    const q3Index = Math.floor(sorted.length * 0.75)
    const q1 = sorted[q1Index]
    const q3 = sorted[q3Index]
    const iqr = q3 - q1
    const lowerBound = q1 - 3 * iqr
    const upperBound = q3 + 3 * iqr

    return values.filter((v) => v >= lowerBound && v <= upperBound)
  }

  /**
   * Calculate default viewport based on median values
   */
  private calculateDefaultViewport(): TViewPort | null {
    // Collect all points from all series
    const allPoints: number[][] = []
    for (const series of this.series) {
      allPoints.push(...series)
    }

    const xValues = allPoints.map((p) => p[0]).filter((v) => areValidCoordinates(v, 0))
    const yValues = allPoints.map((p) => p[1]).filter((v) => areValidCoordinates(0, v))

    if (xValues.length === 0 || yValues.length === 0) {
      return null
    }

    // Filter outliers for better default view
    const filteredYValues = this.filterOutliers(yValues)

    const xMin = Math.min(...xValues)
    const xMax = Math.max(...xValues)
    const yMin = Math.min(...filteredYValues)
    const yMax = Math.max(...filteredYValues)

    // Add padding to ranges
    const { min: finalXMin, max: finalXMax } = this.computeRangeWithPadding(xMin, xMax)
    const { min: finalYMin, max: finalYMax } = this.computeRangeWithPadding(yMin, yMax)

    return {
      xMin: finalXMin,
      xMax: finalXMax,
      yMin: finalYMin,
      yMax: finalYMax,
    }
  }

  /**
   * Set the data points to plot
   * @param data Can be:
   *   - Single series: number[][] or { [key: string]: number }[]
   *   - Multiple series: number[][][] or { [key: string]: number }[][]
   */
  setData(data: number[][] | { [key: string]: number }[] | number[][][] | { [key: string]: number }[][]): void {
    // Detect if we have multiple series or single series
    let multipleSeries = false

    if (Array.isArray(data) && data.length > 0) {
      const firstElement = data[0]

      // Check for multiple series:
      // - number[][][]: data[0] is number[][], data[0][0] is number[], data[0][0][0] is number
      // - { [key: string]: number }[][]: data[0] is { [key: string]: number }[], data[0][0] is object

      if (Array.isArray(firstElement) && firstElement.length > 0) {
        const firstSubElement = firstElement[0]

        // Case 1: number[][][] - firstSubElement is a number[]
        if (Array.isArray(firstSubElement)) {
          multipleSeries = true
        }
        // Case 2: { [key: string]: number }[][] - firstSubElement is an object
        else if (typeof firstSubElement === "object" && firstSubElement !== null && !Array.isArray(firstSubElement)) {
          multipleSeries = true
        }
      }
    }

    if (multipleSeries) {
      // Handle multiple series
      this.series = []
      const seriesArray = data as (number[][] | { [key: string]: number }[])[]

      for (const seriesData of seriesArray) {
        const points = this.convertToPoints(seriesData)
        this.series.push(points)
      }
    } else {
      // Handle single series (backward compatibility)
      const points = this.convertToPoints(data as number[][] | { [key: string]: number }[])
      this.series = [points]
    }

    // Calculate default viewport with outlier filtering
    this.defaultViewport = this.calculateDefaultViewport()
    this.viewport = this.defaultViewport ? { ...this.defaultViewport } : null

    this.draw()
  }

  private convertToPoints(data: number[][] | { [key: string]: number }[]): number[][] {
    // Check if data is array of objects { x: val, y: val }
    if (data.length > 0 && typeof data[0] === "object" && !Array.isArray(data[0])) {
      const objectArray = data as {
        [key: string]: number
      }[]
      return objectArray.map((obj) => [obj[this.config.xLabel], obj[this.config.yLabel]])
    }
    // Check if data is in format [[x1, x2, ...], [y1, y2, ...]] and convert to [[x1, y1], [x2, y2], ...]
    else if (data.length === 2 && Array.isArray(data[0]) && Array.isArray(data[1])) {
      const xValues = data[0] as number[]
      const yValues = data[1] as number[]
      return xValues.map((x, i) => [x, yValues[i]])
    } else {
      return data as number[][]
    }
  }

  /**
   * Get the container element (includes canvas and table)
   */
  getElement(): HTMLDivElement {
    return this.container
  }

  private draw(): void {
    if (this.series.length === 0) {
      return
    }

    const ctx = this.ctx
    const width = this.config.width
    const height = this.config.height

    // Clear canvas
    ctx.clearRect(0, 0, width, height)

    // Setup chart dimensions
    const { margin, chartWidth, chartHeight } = this.getChartDimensions()

    // Calculate viewport bounds
    const bounds = this.calculateViewportBounds()
    if (!bounds) {
      return
    }

    const { xMin, xMax, yMin, yMax } = bounds

    // Create scale functions
    const { scaleX, scaleY } = this.getScaleFunctions(xMin, xMax, yMin, yMax, margin, chartWidth, chartHeight)

    // Calculate axis positions
    const { xAxisY, yAxisX } = this.calculateAxisPositions(
      xMin,
      xMax,
      yMin,
      yMax,
      scaleY,
      scaleX,
      margin,
      chartHeight,
      chartWidth
    )

    // Draw all components
    this.drawTitle(width)
    this.drawGrid(margin, chartWidth, chartHeight)
    this.drawChartBorder(margin, chartWidth, chartHeight)
    this.drawAxes(xAxisY, yAxisX, margin, chartWidth, chartHeight)
    this.drawAxisLabels(width, height)
    this.drawXAxisTicks(xMin, xMax, xAxisY, scaleX, margin, chartHeight)
    this.drawYAxisTicks(yMin, yMax, yAxisX, scaleY, margin, chartWidth)
    this.drawCurves(scaleX, scaleY, margin, chartWidth, chartHeight)

    if (this.config.showPoints) {
      this.drawPoints(scaleX, scaleY, margin, chartWidth, chartHeight)
    }
  }

  /**
   * Calculate viewport bounds (with or without custom viewport)
   */
  private calculateViewportBounds(): TViewPort | null {
    if (this.viewport) {
      return this.viewport
    }

    // Calculate data bounds from all series (filter out NaN values)
    const allPoints = this.series.flat()

    const xValues = allPoints.map((p) => p[0]).filter((v) => this.isValidPoint(v, 0))
    const yValues = allPoints.map((p) => p[1]).filter((v) => this.isValidPoint(0, v))

    if (xValues.length === 0 || yValues.length === 0) {
      return null
    }

    const xMin = xValues.reduce((min, v) => (v < min ? v : min), Infinity)
    const xMax = xValues.reduce((max, v) => (v > max ? v : max), -Infinity)
    const yMin = yValues.reduce((min, v) => (v < min ? v : min), Infinity)
    const yMax = yValues.reduce((max, v) => (v > max ? v : max), -Infinity)

    // Add padding to ranges
    const { min: finalXMin, max: finalXMax } = this.computeRangeWithPadding(xMin, xMax)
    const { min: finalYMin, max: finalYMax } = this.computeRangeWithPadding(yMin, yMax)

    return {
      xMin: finalXMin,
      xMax: finalXMax,
      yMin: finalYMin,
      yMax: finalYMax,
    }
  }

  /**
   * Get scale functions for converting data coordinates to canvas coordinates
   */
  private getScaleFunctions(
    xMin: number,
    xMax: number,
    yMin: number,
    yMax: number,
    margin: TMargin,
    chartWidth: number,
    chartHeight: number
  ): TScaleFunctions {
    const scaleX = (x: number) => margin.left + ((x - xMin) / (xMax - xMin)) * chartWidth
    const scaleY = (y: number) => margin.top + chartHeight - ((y - yMin) / (yMax - yMin)) * chartHeight

    return { scaleX, scaleY }
  }

  /**
   * Calculate axis positions (cross at origin if possible)
   */
  private calculateAxisPositions(
    xMin: number,
    xMax: number,
    yMin: number,
    yMax: number,
    scaleY: (y: number) => number,
    scaleX: (x: number) => number,
    margin: TMargin,
    chartHeight: number,
    chartWidth: number
  ): TAxisPositions {
    let xAxisY: number
    let yAxisX: number

    // X-axis position
    if (yMin <= 0 && yMax >= 0) {
      xAxisY = scaleY(0)
    } else if (yMax < 0) {
      xAxisY = margin.top
    } else {
      xAxisY = margin.top + chartHeight
    }

    // Y-axis position
    if (xMin <= 0 && xMax >= 0) {
      yAxisX = scaleX(0)
    } else if (xMax < 0) {
      yAxisX = margin.left + chartWidth
    } else {
      yAxisX = margin.left
    }

    return { xAxisY, yAxisX }
  }

  /**
   * Draw chart title
   */
  private drawTitle(width: number): void {
    if (!this.config.title) {
      return
    }

    const ctx = this.ctx
    ctx.fillStyle = "#333"
    ctx.font = "bold 24px sans-serif"
    ctx.textAlign = "center"
    ctx.fillText(this.config.title, width / 2, 25)
  }

  /**
   * Draw grid lines
   */
  private drawGrid(margin: TMargin, chartWidth: number, chartHeight: number): void {
    if (!this.config.showGrid) {
      return
    }

    const ctx = this.ctx
    ctx.strokeStyle = "#e0e0e0"
    ctx.lineWidth = 1

    const steps = 10

    // Vertical grid lines
    for (let i = 0; i <= steps; i++) {
      const x = margin.left + (chartWidth / steps) * i
      ctx.beginPath()
      ctx.moveTo(x, margin.top)
      ctx.lineTo(x, margin.top + chartHeight)
      ctx.stroke()
    }

    // Horizontal grid lines
    for (let i = 0; i <= steps; i++) {
      const y = margin.top + (chartHeight / steps) * i
      ctx.beginPath()
      ctx.moveTo(margin.left, y)
      ctx.lineTo(margin.left + chartWidth, y)
      ctx.stroke()
    }
  }

  /**
   * Draw chart border
   */
  private drawChartBorder(margin: TMargin, chartWidth: number, chartHeight: number): void {
    const ctx = this.ctx
    ctx.strokeStyle = "#ccc"
    ctx.lineWidth = 1
    ctx.strokeRect(margin.left, margin.top, chartWidth, chartHeight)
  }

  /**
   * Draw X and Y axes
   */
  private drawAxes(xAxisY: number, yAxisX: number, margin: TMargin, chartWidth: number, chartHeight: number): void {
    const ctx = this.ctx
    ctx.strokeStyle = "#333"
    ctx.lineWidth = 2

    // X-axis
    ctx.beginPath()
    ctx.moveTo(margin.left, xAxisY)
    ctx.lineTo(margin.left + chartWidth, xAxisY)
    ctx.stroke()

    // Y-axis
    ctx.beginPath()
    ctx.moveTo(yAxisX, margin.top)
    ctx.lineTo(yAxisX, margin.top + chartHeight)
    ctx.stroke()
  }

  /**
   * Draw axis labels
   */
  private drawAxisLabels(width: number, height: number): void {
    const ctx = this.ctx
    ctx.fillStyle = "#333"
    ctx.font = "18px sans-serif"
    ctx.textAlign = "center"

    // X-axis label
    ctx.fillText(this.config.xLabel, width / 2, height - 10)

    // Y-axis label (rotated)
    ctx.save()
    ctx.translate(15, height / 2)
    ctx.rotate(-Math.PI / 2)
    ctx.fillText(this.config.yLabel, 0, 0)
    ctx.restore()
  }

  /**
   * Draw X-axis tick marks and labels
   */
  private drawXAxisTicks(
    xMin: number,
    xMax: number,
    xAxisY: number,
    scaleX: (x: number) => number,
    margin: TMargin,
    chartHeight: number
  ): void {
    const ctx = this.ctx
    ctx.fillStyle = "#666"
    ctx.font = "14px sans-serif"
    ctx.textAlign = "center"

    const tickCount = 5
    for (let i = 0; i <= tickCount; i++) {
      const x = xMin + ((xMax - xMin) / tickCount) * i
      const xPos = scaleX(x)

      // Position labels based on axis position
      let labelY: number
      let tickDirection: number

      if (xAxisY <= margin.top + 10) {
        labelY = xAxisY + 15
        tickDirection = 1
      } else if (xAxisY >= margin.top + chartHeight - 10) {
        labelY = xAxisY + 20
        tickDirection = -1
      } else {
        labelY = margin.top + chartHeight + 20
        tickDirection = -1
      }

      ctx.fillText(x.toFixed(2), xPos, labelY)

      // Tick mark
      ctx.strokeStyle = "#333"
      ctx.beginPath()
      ctx.moveTo(xPos, xAxisY)
      ctx.lineTo(xPos, xAxisY + 5 * tickDirection)
      ctx.stroke()
    }
  }

  /**
   * Draw Y-axis tick marks and labels
   */
  private drawYAxisTicks(
    yMin: number,
    yMax: number,
    yAxisX: number,
    scaleY: (y: number) => number,
    margin: TMargin,
    chartWidth: number
  ): void {
    const ctx = this.ctx
    ctx.fillStyle = "#666"
    ctx.font = "14px sans-serif"

    const tickCount = 5
    for (let i = 0; i <= tickCount; i++) {
      const y = yMin + ((yMax - yMin) / tickCount) * i
      const yPos = scaleY(y)

      // Position labels based on axis position
      let labelX: number
      let tickDirection: number

      if (yAxisX >= margin.left + chartWidth - 10) {
        ctx.textAlign = "right"
        labelX = yAxisX - 10
        tickDirection = -1
      } else if (yAxisX <= margin.left + 10) {
        ctx.textAlign = "right"
        labelX = margin.left - 10
        tickDirection = 1
      } else {
        ctx.textAlign = "right"
        labelX = margin.left - 10
        tickDirection = 1
      }

      ctx.fillText(y.toFixed(2), labelX, yPos + 4)

      // Tick mark
      ctx.strokeStyle = "#333"
      ctx.beginPath()
      ctx.moveTo(yAxisX, yPos)
      ctx.lineTo(yAxisX + 5 * tickDirection, yPos)
      ctx.stroke()
    }
  }

  /**
   * Draw all curve series
   */
  private drawCurves(
    scaleX: (x: number) => number,
    scaleY: (y: number) => number,
    margin: TMargin,
    chartWidth: number,
    chartHeight: number
  ): void {
    const ctx = this.ctx
    ctx.save()

    // Clip to chart area
    ctx.beginPath()
    ctx.rect(margin.left, margin.top, chartWidth, chartHeight)
    ctx.clip()

    const colors = this.getSeriesColors()

    // Draw each series
    for (let seriesIndex = 0; seriesIndex < this.series.length; seriesIndex++) {
      const points = this.series[seriesIndex]
      ctx.strokeStyle = colors[seriesIndex % colors.length]
      ctx.lineWidth = this.config.lineWidth
      ctx.beginPath()

      let pathStarted = false
      for (const [x, y] of points) {
        if (!this.isValidPoint(x, y)) {
          pathStarted = false
          continue
        }

        const xPos = scaleX(x)
        const yPos = scaleY(y)

        if (!pathStarted) {
          ctx.moveTo(xPos, yPos)
          pathStarted = true
        } else {
          ctx.lineTo(xPos, yPos)
        }
      }
      ctx.stroke()
    }
    ctx.restore()
  }

  /**
   * Draw points for all series
   */
  private drawPoints(
    scaleX: (x: number) => number,
    scaleY: (y: number) => number,
    margin: TMargin,
    chartWidth: number,
    chartHeight: number
  ): void {
    const ctx = this.ctx
    ctx.save()

    // Clip to chart area
    ctx.beginPath()
    ctx.rect(margin.left, margin.top, chartWidth, chartHeight)
    ctx.clip()

    const colors = this.getSeriesColors()

    // Draw points for each series
    for (let seriesIndex = 0; seriesIndex < this.series.length; seriesIndex++) {
      const points = this.series[seriesIndex]
      const pointColor = colors[seriesIndex % colors.length]

      for (const [x, y] of points) {
        if (!this.isValidPoint(x, y)) {
          continue
        }

        const xPos = scaleX(x)
        const yPos = scaleY(y)

        // Draw white border
        ctx.beginPath()
        ctx.arc(xPos, yPos, 5, 0, TWO_PI)
        ctx.fillStyle = "white"
        ctx.fill()

        // Draw colored point
        ctx.beginPath()
        ctx.arc(xPos, yPos, 4, 0, TWO_PI)
        ctx.fillStyle = pointColor
        ctx.fill()
      }
    }
    ctx.restore()
  }

  /**
   * Update chart configuration and redraw
   */
  updateConfig(config: Partial<TChartConfig>): void {
    Object.assign(this.config, config)
    this.draw()
  }

  /**
   * Destroy the chart
   */
  destroy(): void {
    this.container.remove()
  }
}
