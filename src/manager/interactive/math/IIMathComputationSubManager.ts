import type { TInteractiveInkCanvas } from "@/canvas/TInteractiveInkCanvas"
import { LoggerCategory } from "@/logger"
import type { TJIIXMathElement, TJIIXMathExpression } from "@/model"
import type { TStyle } from "@/style/Style"
import type { TBox, TPoint, TStroke } from "@/symbol"
import { BoxOps, isStroke, OBBOps } from "@/symbol"
import { StrokeOps } from "@/symbol/stroke/Stroke"
import type { MatrixTransform } from "@/transform"
import { convertMillimeterToPixel } from "@/utils"
import { isDeepEqualIgnoring } from "@/utils/object"
import { createUUID } from "@/utils/uuid"

import { IIAbstractManager } from "../IIAbstractManager"

/**
 * Result display mode for math solver output
 * - "draw": add result strokes to the model (sent to backend, interactive)
 * - "ghost": render result strokes as SVG overlays (not in model, opacity 0.5, non-interactive)
 * @group Manager
 */
export type TMathResultMode = "draw" | "ghost"

/**
 * Configuration for math computation behavior
 * @group Manager
 */
export type TMathComputationConfig = {
  /** How solver output is displayed */
  resultMode: TMathResultMode
  /** Automatically compute results when blocks end with = or ? */
  autoCompute: boolean
  /** Color applied to result strokes (both draw and ghost modes) */
  resultColor: string
}

/**
 * Computation data for a math block
 * @group Manager
 */
export type TMathBlockComputation = {
  /** Computed result from the solver */
  computedResult?: unknown
  /** IDs of strokes that are solver outputs */
  solverOutputStrokeIds?: string[]
  /** Last computation timestamp */
  lastComputedAt?: number
}

/**
 * Sub-manager responsible for tracking math block computations and running numerical solver operations
 * @group Manager
 */
export class IIMathComputationSubManager extends IIAbstractManager {
  protected managerName = "IIMathComputationSubManager"

  static readonly DEFAULT_CONFIG: TMathComputationConfig = {
    resultMode: "draw",
    autoCompute: false,
    resultColor: "#4caf50",
  }

  #config: TMathComputationConfig
  #computations = new Map<string, TMathBlockComputation>()
  #ghostStrokeElementIds = new Map<string, string[]>()
  #ghostStrokes = new Map<string, TStroke[]>()
  #lastComputationResult = new Map<string, TJIIXMathElement>()

  constructor(canvas: TInteractiveInkCanvas, config: Partial<TMathComputationConfig> = {}) {
    super(canvas, LoggerCategory.MATH)
    this.#config = {
      ...IIMathComputationSubManager.DEFAULT_CONFIG,
      ...config,
    }
  }

  getConfig(): TMathComputationConfig {
    return { ...this.#config }
  }

  updateConfig(config: Partial<TMathComputationConfig>): void {
    this.logger.debug("updateConfig", config)
    this.#config = { ...this.#config, ...config }
  }

  get computations(): ReadonlyMap<string, TMathBlockComputation> {
    return this.#computations
  }

  updateComputationResult(jiixBlockId: string, result: unknown): void {
    this.logger.debug("updateComputationResult", {
      jiixBlockId,
      result,
    })

    const computation = this.#computations.get(jiixBlockId) ?? {}
    this.#computations.set(jiixBlockId, {
      ...computation,
      computedResult: result,
      lastComputedAt: Date.now(),
    })
  }

  updateSolverOutputs(jiixBlockId: string, solverOutputStrokeIds: string[]): void {
    this.logger.debug("updateSolverOutputs", {
      jiixBlockId,
      count: solverOutputStrokeIds.length,
    })

    const computation = this.#computations.get(jiixBlockId) ?? {}
    this.#computations.set(jiixBlockId, {
      ...computation,
      solverOutputStrokeIds,
    })
  }

  updateSolverOutputsForAll(solverOutputStrokeIds: string[]): void {
    this.logger.debug("updateSolverOutputsForAll", { count: solverOutputStrokeIds.length })

    for (const [id, computation] of this.#computations) {
      this.#computations.set(id, {
        ...computation,
        solverOutputStrokeIds,
      })
    }
  }

  getMathBlock(jiixBlockId: string): TMathBlockComputation | undefined {
    return this.#computations.get(jiixBlockId)
  }

  removeMathBlock(jiixBlockId: string): void {
    this.logger.debug("removeMathBlock", {
      jiixBlockId,
    })
    this.#computations.delete(jiixBlockId)
  }

  getStoredSolverOutputs(jiixBlockId: string): string[] | undefined {
    return this.#computations.get(jiixBlockId)?.solverOutputStrokeIds
  }

  protected buildGhostStrokePath(points: TPoint[]): string {
    if (points.length === 0) {
      return ""
    }
    const [first, ...rest] = points
    const start = `M ${first.x},${first.y}`
    const tail = rest.map((p) => `L ${p.x},${p.y}`).join(" ")
    return tail.length > 0 ? `${start} ${tail}` : start
  }

  protected addGhostOutputStrokes(result: TJIIXMathElement, style?: TStyle): TStroke[] {
    this.logger.info("addGhostOutputStrokes", {
      result,
    })

    const solverStrokes = this.extractSolverOutputStrokes(result)
    const strokes: TStroke[] = []
    const strokeColor = style?.color ?? this.#config.resultColor
    const strokeWidth = style?.width ?? 5

    for (const strokeData of solverStrokes) {
      if (!strokeData.X || !strokeData.Y) {
        continue
      }

      const points: TPoint[] = strokeData.X.map((x, i) => ({
        x: convertMillimeterToPixel(x),
        y: convertMillimeterToPixel(strokeData.Y[i]),
      }))
      const pathData = this.buildGhostStrokePath(points)
      const stroke = StrokeOps.createFromPartial({
        id: `ghost-stroke-${createUUID()}`,
        pointers: points.map((p, i) => ({
          x: p.x,
          y: p.y,
          p: strokeData.F?.[i] || 1,
          t: strokeData.T?.[i] || i,
        })),
        style: {
          color: strokeColor,
          width: strokeWidth,
          opacity: 0.5,
        },
        isSolverOutput: true,
      })
      if (!pathData) {
        continue
      }

      this.renderer.drawSymbol(stroke)
      strokes.push(stroke)
    }

    this.logger.debug("addGhostOutputStrokes", `Added ${strokes.length} ghost stroke elements`)
    return strokes
  }

  hasSolverOutputs(jiixBlockId: string): boolean {
    const ghostIds = this.#ghostStrokeElementIds.get(jiixBlockId)
    if (ghostIds && ghostIds.length > 0) {
      return true
    }
    return !!this.#computations.get(jiixBlockId)?.solverOutputStrokeIds?.length
  }

  hasDrawSolverOutputs(jiixBlockId: string): boolean {
    return !!this.#computations.get(jiixBlockId)?.solverOutputStrokeIds?.length
  }

  hasGhostStrokes(jiixBlockId: string): boolean {
    const ghostIds = this.#ghostStrokeElementIds.get(jiixBlockId)
    return !!(ghostIds && ghostIds.length > 0)
  }

  /** Element ids of a block's ghost strokes, for live CSS-transform following during a drag. */
  getGhostStrokeIds(jiixBlockId: string): string[] {
    return this.#ghostStrokeElementIds.get(jiixBlockId) ?? []
  }

  /**
   * Merged bounds of a block's ghost strokes, for inclusion in the selection rectangle
   * while the block has no frozen draw result yet. Undefined if the block has no ghost.
   */
  getGhostBounds(jiixBlockId: string): TBox | undefined {
    const strokes = this.#ghostStrokes.get(jiixBlockId)
    if (!strokes || strokes.length === 0) {
      return undefined
    }
    return BoxOps.createFromBoxes(strokes.map((s) => OBBOps.toBox(s.bounds)))
  }

  /**
   * Moves and redraws a block's ghost strokes in place, so they passively follow a
   * translate/resize/rotate of the block's source strokes instead of visually detaching.
   */
  applyTransformToGhostStrokes(jiixBlockId: string, matrix: MatrixTransform): void {
    const strokes = this.#ghostStrokes.get(jiixBlockId)
    if (!strokes || strokes.length === 0) {
      return
    }
    strokes.forEach((stroke) => {
      stroke.pointers.forEach((p) => {
        const np = matrix.applyToPoint(p)
        p.x = +np.x.toFixed(3)
        p.y = +np.y.toFixed(3)
      })
      StrokeOps.updateBounds(stroke)
      this.renderer.drawSymbol(stroke)
    })
  }

  clearGhostStrokes(jiixBlockId: string): void {
    this.logger.debug("clearGhostStrokes", {
      jiixBlockId,
    })

    const elementIds = this.#ghostStrokeElementIds.get(jiixBlockId) ?? []
    elementIds.forEach((id) => this.renderer.removeSymbol(id))
    this.#ghostStrokeElementIds.delete(jiixBlockId)
    this.#ghostStrokes.delete(jiixBlockId)
    this.#lastComputationResult.delete(jiixBlockId)
  }

  clearAllGhostStrokes(): void {
    this.logger.info("clearAllGhostStrokes")

    for (const jiixBlockId of this.#ghostStrokeElementIds.keys()) {
      this.clearGhostStrokes(jiixBlockId)
    }
  }

  async clearSolverOutputs(jiixBlockId: string): Promise<void> {
    this.logger.info("clearSolverOutputs", {
      jiixBlockId,
    })

    const solverOutputStrokes = this.canvas.model.symbols.filter(
      (s) => isStroke(s) && s.jiixBlockId === jiixBlockId && s.isSolverOutput
    )

    if (solverOutputStrokes.length > 0) {
      await this.canvas.removeSymbols(
        solverOutputStrokes.map((s) => s.id),
        false
      )
    }

    this.updateSolverOutputs(jiixBlockId, [])
    // clearGhostStrokes also invalidates #lastComputationResult
    this.clearGhostStrokes(jiixBlockId)
  }

  async clearAllSolverOutputs(): Promise<void> {
    this.logger.info("clearAllSolverOutputs")

    const solverOutputStrokes = this.canvas.model.symbols.filter((s) => isStroke(s) && s.isSolverOutput)

    if (solverOutputStrokes.length > 0) {
      await this.canvas.removeSymbols(
        solverOutputStrokes.map((s) => s.id),
        false
      )
    }

    this.updateSolverOutputsForAll([])
    this.clearAllGhostStrokes()
  }

  async computeNumericalResult(
    jiixBlockId: string,
    mode: TMathResultMode = this.#config.resultMode
  ): Promise<{
    result: TJIIXMathElement
    addedStrokesCount: number
    value?: number
    wasRecomputed: boolean
  }> {
    this.logger.info("computeNumericalResult", {
      jiixBlockId,
      mode,
    })

    if (!jiixBlockId) {
      throw new Error("Math block does not have jiixBlockId")
    }

    if (this.hasDrawSolverOutputs(jiixBlockId)) {
      const cachedResult = this.#lastComputationResult.get(jiixBlockId)
      if (cachedResult) {
        this.logger.debug("computeNumericalResult", "Draw result is frozen, skipping recompute", { jiixBlockId })
        const addedStrokesCount = this.#computations.get(jiixBlockId)?.solverOutputStrokeIds?.length ?? 0
        const value = this.#computations.get(jiixBlockId)?.computedResult as number | undefined
        return { result: cachedResult, addedStrokesCount, value, wasRecomputed: false }
      }
    }

    const result = await this.canvas.client.getNumericalComputation(jiixBlockId)
    this.logger.info("computeNumericalResult", "Numerical computation completed successfully", result)

    const lastResult = this.#lastComputationResult.get(jiixBlockId)
    if (lastResult && isDeepEqualIgnoring(lastResult, result, ["timestamp"])) {
      this.logger.debug("computeNumericalResult", "Result unchanged, skipping re-render", { jiixBlockId })
      const addedStrokesCount =
        mode === "ghost"
          ? (this.#ghostStrokeElementIds.get(jiixBlockId)?.length ?? 0)
          : (this.#computations.get(jiixBlockId)?.solverOutputStrokeIds?.length ?? 0)
      const value = this.#computations.get(jiixBlockId)?.computedResult as number | undefined
      return { result, addedStrokesCount, value, wasRecomputed: false }
    }

    await this.clearSolverOutputs(jiixBlockId)
    this.#lastComputationResult.set(jiixBlockId, result)

    let addedStrokesCount = 0

    if (mode === "draw") {
      const wasBlockSelected = this.canvas.selector.isMathBlockSelected(jiixBlockId)
      const addedStrokes = await this.addSolverOutputStrokes(result)
      addedStrokesCount = addedStrokes.length
      this.logger.info("computeNumericalResult", `Added ${addedStrokesCount} solver output strokes`)
      this.updateSolverOutputs(
        jiixBlockId,
        addedStrokes.map((s) => s.id)
      )
      if (wasBlockSelected && addedStrokes.length > 0) {
        this.canvas.select([...this.canvas.model.selectedIds, ...addedStrokes.map((s) => s.id)])
      }
    } else if (mode === "ghost") {
      const strokes = this.addGhostOutputStrokes(result)
      addedStrokesCount = strokes.length
      this.logger.info("computeNumericalResult", `Added ${addedStrokesCount} ghost stroke elements`)
      this.#ghostStrokeElementIds.set(
        jiixBlockId,
        strokes.map((s) => s.id)
      )
      this.#ghostStrokes.set(jiixBlockId, strokes)
    }

    let value: number | undefined
    if (result.expressions && Array.isArray(result.expressions)) {
      const equalExpression = result.expressions.find(
        (expr) =>
          expr && expr.type === "=" && "value" in expr && typeof (expr as { value?: unknown }).value === "number"
      )
      if (equalExpression && "value" in equalExpression) {
        value = (equalExpression as { value: number }).value
        this.logger.info("computeNumericalResult", "Extracted numerical value", { value })
        this.updateComputationResult(jiixBlockId, value)
      }
    }

    return { result, addedStrokesCount, value, wasRecomputed: true }
  }

  async computeAllNumericalResults(): Promise<void> {
    this.logger.info("computeAllNumericalResults")

    const { resultMode: mode } = this.#config
    const jiixBlocks = this.canvas.model.mathBlocks

    for (const mathSymbol of jiixBlocks) {
      try {
        await this.computeNumericalResult(mathSymbol.id, mode)
      } catch (error) {
        this.logger.error(
          "computeAllNumericalResults",
          `Error computing numerical result for block ${mathSymbol.id}:`,
          error
        )
      }
    }
  }

  /**
   * Clear then recompute numerical results for the given math blocks, or all blocks if none given.
   */
  async forceCompute(jiixBlockIds?: string[]): Promise<void> {
    this.logger.info("forceCompute", { jiixBlockIds })

    const ids = jiixBlockIds ?? this.canvas.model.mathBlocks.map((mathSymbol) => mathSymbol.id)
    const { resultMode: mode } = this.#config

    for (const jiixBlockId of ids) {
      try {
        await this.clearSolverOutputs(jiixBlockId)
        await this.computeNumericalResult(jiixBlockId, mode)
      } catch (error) {
        this.logger.error("forceCompute", `Error force computing block ${jiixBlockId}:`, error)
      }
    }
  }

  protected extractSolverOutputStrokesFromExpression(expression: TJIIXMathExpression): Array<{
    X: number[]
    Y: number[]
    F?: number[]
    T?: number[]
  }> {
    const items: Array<{
      X: number[]
      Y: number[]
      F?: number[]
      T?: number[]
    }> = []

    const exprRecord = expression as Record<string, unknown>
    if (
      expression?.type === "number" &&
      exprRecord["solver-output"] === true &&
      exprRecord.items &&
      Array.isArray(exprRecord.items)
    ) {
      items.push(
        ...(exprRecord.items as Array<{
          X: number[]
          Y: number[]
          F?: number[]
          T?: number[]
        }>)
      )
    }

    if ("operands" in expression && expression.operands && Array.isArray(expression.operands)) {
      expression.operands.forEach((operand: TJIIXMathExpression) => {
        items.push(...this.extractSolverOutputStrokesFromExpression(operand))
      })
    }
    return items
  }

  protected extractSolverOutputStrokes(mathElement: TJIIXMathElement): Array<{
    X: number[]
    Y: number[]
    F?: number[]
    T?: number[]
  }> {
    this.logger.debug(
      "extractSolverOutputStrokes",
      "Extracting solver output strokes from math element",
      mathElement.id
    )
    const strokes: Array<{
      X: number[]
      Y: number[]
      F?: number[]
      T?: number[]
    }> = []

    if (mathElement.expressions && Array.isArray(mathElement.expressions)) {
      mathElement.expressions.forEach((expression: TJIIXMathExpression) => {
        strokes.push(...this.extractSolverOutputStrokesFromExpression(expression))
      })
    }

    this.logger.debug("extractSolverOutputStrokes", `Found ${strokes.length} solver output stroke(s)`)
    return strokes
  }

  async addSolverOutputStrokes(result: TJIIXMathElement, style?: TStyle): Promise<TStroke[]> {
    this.logger.info("addSolverOutputStrokes", {
      result,
    })

    const solverStrokes = this.extractSolverOutputStrokes(result)
    this.logger.debug("addSolverOutputStrokes", `Found ${solverStrokes.length} solver output strokes`)

    const addedStrokes: TStroke[] = []
    const defaultStyle = style || {
      color: this.#config.resultColor,
      width: 5,
    }
    for (const strokeData of solverStrokes) {
      if (!strokeData.X || !strokeData.Y) {
        this.logger.warn("addSolverOutputStrokes", "Stroke data missing X or Y coordinates")
        continue
      }

      const pointers = strokeData.X.map((x: number, i: number) => ({
        x: convertMillimeterToPixel(x),
        y: convertMillimeterToPixel(strokeData.Y[i]),
        p: strokeData.F?.[i] || 1,
        t: strokeData.T?.[i] || i,
      }))

      const stroke = StrokeOps.createFromPartial({
        id: `solver-stroke-${createUUID()}`,
        pointers,
        style: defaultStyle,
        isSolverOutput: true,
        jiixBlockId: result.id,
      })

      addedStrokes.push(stroke)
      this.logger.debug("addSolverOutputStrokes", "Added solver output stroke:", stroke.id)
    }
    await this.canvas.addSymbols(addedStrokes)
    return addedStrokes
  }

  clear(): void {
    this.logger.info("clear", "Clearing all math computations")
    this.clearAllGhostStrokes()
    this.#computations.clear()
    this.#lastComputationResult.clear()
  }

  protected onDestroy(): void {
    this.clear()
  }
}
