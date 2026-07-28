import type { TInteractiveInkCanvas } from "@/canvas/TInteractiveInkCanvas"
import type {
  TMathEvaluable,
  TMathVariable,
  TMathVariableDefinition,
  TMathVariableDefinitions,
} from "@/client/WebSocketClientMessage"
import { LoggerCategory } from "@/logger"
import type { TJIIXMathElement } from "@/model"
import type { TBox } from "@/symbol"
import type { MatrixTransform } from "@/transform"

import { IIAbstractManager } from "./IIAbstractManager"
import type {
  TMathBlockCapabilities,
  TMathBlockComputation,
  TMathComputationConfig,
  TMathDependencies,
  TMathInteractionConfig,
  TMathResultMode,
  TMathVariableUsage,
} from "./math"
import {
  IIMathCapabilitiesSubManager,
  IIMathComputationSubManager,
  IIMathFunctionEvaluationSubManager,
  IIMathVariableSubManager,
} from "./math"

/**
 * Configuration passed to {@link IIMathManager} at load time.
 * Forwarded to the relevant sub-managers.
 * @group Manager
 */
export type TMathConfig = {
  /** Override defaults for the computation sub-manager (resultMode, autoCompute) */
  computation?: Partial<TMathComputationConfig>
  /** Override defaults for the variable/interaction sub-manager (showDependencyOnHover, highlightOnSelect, dimOpacity) */
  interaction?: Partial<TMathInteractionConfig>
}

/**
 * Main Math manager that orchestrates all math-related sub-managers.
 *
 * Sub-managers:
 * - computation: Computation cache, solver I/O, numerical result ops
 * - variables: Variable state, dependency tracking, visual interactions (hover/select)
 * - evaluation: Function evaluation
 *
 * @group Manager
 */
export class IIMathManager extends IIAbstractManager {
  protected managerName = "IIMathManager"

  // Sub-managers
  #computation: IIMathComputationSubManager
  #variables: IIMathVariableSubManager
  #evaluation: IIMathFunctionEvaluationSubManager
  #capabilities: IIMathCapabilitiesSubManager

  #isHandlingSynchronized = false

  constructor(canvas: TInteractiveInkCanvas, config?: TMathConfig) {
    super(canvas, LoggerCategory.MATH)

    this.#computation = new IIMathComputationSubManager(canvas, config?.computation)
    this.#variables = new IIMathVariableSubManager(canvas, config?.interaction)
    this.#evaluation = new IIMathFunctionEvaluationSubManager(canvas)
    this.#capabilities = new IIMathCapabilitiesSubManager(canvas, this.#variables, this.#computation, this.#evaluation)

    canvas.event.addSynchronizedListener(() => {
      this.#onSynchronized()
    })
  }

  async #onSynchronized(): Promise<void> {
    if (this.#isHandlingSynchronized) {
      return
    }
    this.#isHandlingSynchronized = true
    try {
      if (this.#computation.getConfig().autoCompute) {
        await this.tryAutoCompute()
      }
    } finally {
      this.#isHandlingSynchronized = false
    }
  }

  /**
   * Compute numerical result for a math symbol
   * @param jiixBlockId - The ID of the math block
   * @param mode - Result display mode ("draw" or "ghost"). Defaults to canvas.mathResultMode
   * @returns Promise with the computation result, number of added strokes, and numeric value
   */
  async computeNumericalResult(
    jiixBlockId: string,
    mode?: TMathResultMode
  ): Promise<{
    result: TJIIXMathElement
    addedStrokesCount: number
    value?: number
    wasRecomputed: boolean
  }> {
    try {
      const computation = await this.canvas.trackOperation("Computing", async () =>
        this.#computation.computeNumericalResult(jiixBlockId, mode)
      )
      this.#capabilities.invalidateCache(jiixBlockId)
      return computation
    } catch (error) {
      this.canvas.manageError(error as Error)
      throw error
    }
  }

  async computeAllNumericalResults(): Promise<void> {
    return this.canvas.trackOperation("Computing", async () => this.#computation.computeAllNumericalResults())
  }

  async clearSolverOutputs(jiixBlockId: string): Promise<void> {
    return this.canvas.trackOperation("Computing", async () => this.#computation.clearSolverOutputs(jiixBlockId))
  }

  async clearAllSolverOutputs(): Promise<void> {
    return this.canvas.trackOperation("Computing", async () => this.#computation.clearAllSolverOutputs())
  }

  getComputation(jiixBlockId: string): TMathBlockComputation | undefined {
    return this.#computation.getMathBlock(jiixBlockId)
  }

  getStoredSolverOutputs(jiixBlockId: string): string[] | undefined {
    return this.#computation.getStoredSolverOutputs(jiixBlockId)
  }

  clearGhostStrokes(jiixBlockId: string): void {
    this.#computation.clearGhostStrokes(jiixBlockId)
  }

  hasSolverOutputs(jiixBlockId: string): boolean {
    return this.#computation.hasSolverOutputs(jiixBlockId)
  }

  hasDrawSolverOutputs(jiixBlockId: string): boolean {
    return this.#computation.hasDrawSolverOutputs(jiixBlockId)
  }

  hasGhostStrokes(jiixBlockId: string): boolean {
    return this.#computation.hasGhostStrokes(jiixBlockId)
  }

  getGhostStrokeIds(jiixBlockId: string): string[] {
    return this.#computation.getGhostStrokeIds(jiixBlockId)
  }

  getGhostBounds(jiixBlockId: string): TBox | undefined {
    return this.#computation.getGhostBounds(jiixBlockId)
  }

  applyTransformToGhostStrokes(jiixBlockId: string, matrix: MatrixTransform): void {
    this.#computation.applyTransformToGhostStrokes(jiixBlockId, matrix)
  }

  /**
   * Set value for a specific variable in a math expression
   * @param jiixBlockId - The ID of the math element (jiixId)
   * @param variableName - Name of the variable to set
   * @param variableValue - Value to assign to the variable
   * @returns Promise that resolves when the variable is set
   */
  async setVariableValue(jiixBlockId: string, variableName: string, variableValue: number): Promise<void> {
    return this.canvas.trackOperation("Updating variables", async () =>
      this.#setVariableValueInternal(jiixBlockId, variableName, variableValue)
    )
  }

  async #setVariableValueInternal(jiixBlockId: string, variableName: string, variableValue: number): Promise<void> {
    try {
      this.logger.info("setVariableValue", {
        jiixBlockId,
        variableName,
        variableValue,
      })
      if (jiixBlockId) {
        await this.#computation.clearSolverOutputs(jiixBlockId)
      }
      await this.#variables.setVariableValue(jiixBlockId, variableName, variableValue)
      this.#capabilities.invalidateCache(jiixBlockId)
      if (jiixBlockId) {
        await this.recalculateDependentBlocks(jiixBlockId)
      }
    } catch (error) {
      this.canvas.manageError(error as Error)
      throw error
    }
  }

  /**
   * Set multiple variable values for a math symbol
   * @param jiixBlockId - The ID of the math block
   * @param variableValues - Object with variable names as keys and their values
   * @returns Promise that resolves when all variables are set
   */
  async setListVariableValue(jiixBlockId: string, variableValues: Record<string, number>): Promise<void> {
    return this.canvas.trackOperation("Updating variables", async () =>
      this.#setListVariableValueInternal(jiixBlockId, variableValues)
    )
  }

  async #setListVariableValueInternal(jiixBlockId: string, variableValues: Record<string, number>): Promise<void> {
    try {
      this.logger.info("setListVariableValue", {
        jiixBlockId,
        variableValues,
      })

      for (const [variableName, variableValue] of Object.entries(variableValues)) {
        await this.setVariableValue(jiixBlockId, variableName, variableValue)
      }
    } catch (error) {
      this.canvas.manageError(error as Error)
      throw error
    }
  }

  /**
   * Get variables from a math expression
   * @param jiixBlockId - The ID of the math element (jiixId)
   * @returns Promise with array of variables
   */
  async getVariables(jiixBlockId: string): Promise<TMathVariable[]> {
    try {
      return this.canvas.trackOperation("Loading variables", async () => this.#variables.getVariables(jiixBlockId))
    } catch (error) {
      this.canvas.manageError(error as Error)
      throw error
    }
  }

  /**
   * Get variable value from a math expression
   * @param jiixBlockId - The ID of the math element (jiixId)
   * @param variableName - Name of the variable
   * @returns Promise with the value of the variable
   */
  async getVariableValue(jiixBlockId: string, variableName: string): Promise<number | null> {
    try {
      return this.canvas.trackOperation("Loading variables", async () =>
        this.#variables.getVariableValue(jiixBlockId, variableName)
      )
    } catch (error) {
      this.canvas.manageError(error as Error)
      throw error
    }
  }

  getDependencies(jiixBlockId: string): TMathDependencies | null {
    return this.#variables.getDependencies(jiixBlockId)
  }

  async enrichMathDependencies(jiixBlockId: string, isStale?: () => boolean): Promise<void> {
    await this.canvas.trackOperation("Loading variables", async () =>
      this.#variables.enrichMathDependencies(jiixBlockId, isStale)
    )
    this.#capabilities.invalidateCache(jiixBlockId)
  }

  cleanupMathDependencies(jiixBlockIds: string[]): void {
    this.#variables.cleanupMathDependencies(jiixBlockIds)
  }

  async recalculateDependentBlocks(sourceBlockId: string): Promise<void> {
    return this.canvas.trackOperation("Computing", async () => this.#recalculateDependentBlocksInternal(sourceBlockId))
  }

  async #recalculateDependentBlocksInternal(sourceBlockId: string): Promise<void> {
    this.logger.info("recalculateDependentBlocks", { sourceBlockId })

    const deps = this.#variables.getDependencies(sourceBlockId)
    if (!deps?.dependentBlocks || deps.dependentBlocks.length === 0) {
      this.logger.debug("recalculateDependentBlocks", "No dependent blocks to recalculate")
      return
    }

    this.logger.info("recalculateDependentBlocks", `Found ${deps.dependentBlocks.length} dependent blocks`)

    for (const dependentBlockId of deps.dependentBlocks) {
      try {
        this.logger.info("recalculateDependentBlocks", `Computing numerical result for ${dependentBlockId}`)
        await this.#computation.computeNumericalResult(dependentBlockId)
      } catch (computeError) {
        this.logger.error("recalculateDependentBlocks", `Error computing ${dependentBlockId}:`, computeError)
      }
    }

    this.logger.info("recalculateDependentBlocks", "All dependent blocks recalculated")
    this.canvas.event.emitChanged(this.canvas.history.context)
  }

  selectBlock(jiixBlockId: string): void {
    this.#variables.selectBlock(jiixBlockId)
  }

  clearBlockSelection(): void {
    this.#variables.clearBlockSelection()
  }

  onSymbolHover(jiixBlockId: string | null): void {
    this.#variables.onSymbolHover(jiixBlockId)
  }

  getVariablesConfig(): TMathInteractionConfig {
    return this.#variables.getConfig()
  }

  updateVariablesConfig(config: Partial<TMathInteractionConfig>): void {
    this.#variables.updateConfig(config)
  }

  async removeVariable(jiixBlockId: string, variableName: string): Promise<void> {
    return this.canvas.trackOperation("Updating variables", async () => {
      await this.#variables.removeVariableValue(jiixBlockId, variableName)
      await this.recalculateDependentBlocks(jiixBlockId)
    })
  }

  async asVariableDefinition(jiixBlockId: string): Promise<TMathVariableDefinition | null> {
    return this.canvas.trackOperation("Loading variables", async () =>
      this.#variables.asVariableDefinition(jiixBlockId)
    )
  }

  async getVariableDefinitions(): Promise<TMathVariableDefinitions[]> {
    return this.canvas.trackOperation("Loading variables", async () => this.#variables.getVariableDefinitions())
  }

  async getAllVariableUsages(): Promise<TMathVariableUsage[]> {
    return this.canvas.trackOperation("Loading variables", async () => this.#variables.getAllVariableUsages())
  }

  clearVariableInteractions(): void {
    this.#variables.clearAll()
  }

  /**
   * Evaluate a math function for a math symbol
   * @param jiixBlockId - The ID of the math element (jiixId)
   * @param evaluation - Evaluation parameters
   * @returns Promise with evaluation points
   */
  async evaluateFunction(
    jiixBlockId: string,
    evaluation: {
      inputVariableName: string
      outputVariableName: string
      from: number
      to: number
      pointCount: number
    }
  ): Promise<{ [key: string]: number }[][]> {
    try {
      return this.canvas.trackOperation("Evaluating", async () =>
        this.#evaluation.evaluateFunction(jiixBlockId, evaluation)
      )
    } catch (error) {
      this.canvas.manageError(error as Error)
      throw error
    }
  }

  /**
   * Get evaluables from a math expression
   * @param jiixBlockId - The ID of the math element (jiixId)
   * @returns Promise with array of evaluables
   */
  async getEvaluables(jiixBlockId: string): Promise<TMathEvaluable[]> {
    try {
      return this.canvas.trackOperation("Evaluating", async () => this.#evaluation.getEvaluables(jiixBlockId))
    } catch (error) {
      this.canvas.manageError(error as Error)
      throw error
    }
  }

  /**
   * Get diagnostic result for a specific math task
   * @param jiixBlockId - The ID of the math element (jiixId)
   * @param task - The task to diagnose (e.g., "numerical-computation", "evaluation")
   * @returns Promise with diagnostic result (e.g., "ALLOWED", "NOT_ALLOWED")
   */
  async getDiagnostic(jiixBlockId: string, task: string): Promise<string> {
    try {
      this.logger.info("getDiagnostic", {
        jiixBlockId,
        task,
      })
      return await this.canvas.trackOperation("Checking", async () =>
        this.canvas.client.getDiagnostic(jiixBlockId, task)
      )
    } catch (error) {
      this.canvas.manageError(error as Error)
      throw error
    }
  }

  /**
   * Get available math solver actions for a specific math element
   * @param jiixBlockId - The ID of the math element (jiixId)
   * @returns Promise with array of available actions
   */
  async getAvailableActions(jiixBlockId: string): Promise<string[]> {
    try {
      this.logger.info("getAvailableActions", {
        jiixBlockId,
      })
      return await this.canvas.trackOperation("Checking", async () =>
        this.canvas.client.getAvailableActions(jiixBlockId)
      )
    } catch (error) {
      this.canvas.manageError(error as Error)
      throw error
    }
  }

  /**
   * Get which math operations (edit variables, compute, evaluate, manage solver output strokes)
   * are available for a math block. Result is cached per block until the block's variables,
   * computation state, or diagnostics change.
   * @param jiixBlockId - The ID of the math block
   */
  async getBlockCapabilities(jiixBlockId: string): Promise<TMathBlockCapabilities> {
    try {
      return await this.canvas.trackOperation("Checking", async () =>
        this.#capabilities.getBlockCapabilities(jiixBlockId)
      )
    } catch (error) {
      this.canvas.manageError(error as Error)
      throw error
    }
  }

  // ==========================================
  // Computation config
  // ==========================================

  getComputationConfig(): TMathComputationConfig {
    return this.#computation.getConfig()
  }

  updateComputationConfig(config: Partial<TMathComputationConfig>): void {
    this.#computation.updateConfig(config)
  }

  // ==========================================
  // Auto-compute
  // ==========================================

  async tryAutoCompute(): Promise<void> {
    return this.canvas.trackOperation("Computing", async () => this.#tryAutoComputeInternal())
  }

  async #tryAutoComputeInternal(): Promise<void> {
    this.logger.info("tryAutoCompute")

    // A prior ink mutation (e.g. erasing/rewriting a BLOCK variable's defining stroke) clears
    // model.exports, and nothing else guarantees it's been refreshed by the time this runs -
    // without this, model.mathBlocks can be stale/empty and a dependent block silently never
    // gets recomputed. export() is a no-op if the jiix export is already current.
    await this.canvas.export(["application/vnd.myscript.jiix"])

    const mathBlocks = this.canvas.model.mathBlocks
    for (const mb of mathBlocks) {
      if (!mb.id) {
        continue
      }
      const label = mb.label ?? ""

      if (!(label.endsWith("=") || label.endsWith("?"))) {
        if (this.#computation.hasGhostStrokes(mb.id)) {
          this.#computation.clearGhostStrokes(mb.id)
        }
        continue
      }

      try {
        const actions = await this.canvas.client.getAvailableActions(mb.id)
        if (actions?.includes("numerical-computation")) {
          await this.#computation.computeNumericalResult(mb.id)
        } else if (this.#computation.hasGhostStrokes(mb.id)) {
          this.#computation.clearGhostStrokes(mb.id)
        }
      } catch (error) {
        this.logger.debug("tryAutoCompute", `Cannot auto-compute "${label}":`, (error as Error).message)
      }
    }
    this.canvas.selector.redrawSelectedGroup()
  }

  protected onDestroy(): void {
    this.#computation.destroy()
    this.#variables.destroy()
    this.#evaluation.destroy()
  }
}
