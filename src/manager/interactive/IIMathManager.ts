import type { TInteractiveInkEditor } from "@/editor/TInteractiveInkEditor"
import { LoggerCategory } from "@/logger"
import type { TJIIXMathElement } from "@/model"
import type {
  TMathEvaluable,
  TMathVariable,
  TMathVariableDefinition,
  TMathVariableDefinitions,
} from "@/recognizer/RecognizerWebSocketMessage"

import { IIAbstractManager } from "./IIAbstractManager"
import type {
  TMathBlockComputation,
  TMathComputationConfig,
  TMathDependencies,
  TMathInteractionConfig,
  TMathResultMode,
  TMathVariableUsage,
} from "./math"
import { IIMathComputationSubManager, IIMathFunctionEvaluationSubManager, IIMathVariableSubManager } from "./math"

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

  #mathBlockSnapshot = new Map<string, string>()
  #isHandlingSynchronized = false
  #blocksWithRecentSolverAdd = new Set<string>()

  constructor(editor: TInteractiveInkEditor, config?: TMathConfig) {
    super(editor, LoggerCategory.MATH)

    this.#computation = new IIMathComputationSubManager(editor, config?.computation)
    this.#variables = new IIMathVariableSubManager(editor, config?.interaction)
    this.#evaluation = new IIMathFunctionEvaluationSubManager(editor)

    editor.event.addSynchronizedListener(() => {
      this.#onSynchronized()
    })
  }

  async #onSynchronized(): Promise<void> {
    if (this.#isHandlingSynchronized) {
      return
    }
    this.#isHandlingSynchronized = true
    try {
      await this.#clearStaleBlockOutputs()
      if (this.#computation.getConfig().autoCompute) {
        await this.tryAutoCompute()
      }
    } finally {
      this.#isHandlingSynchronized = false
    }
  }

  async #clearStaleBlockOutputs(): Promise<void> {
    const currentBlocks = this.editor.model.mathBlocks
    const currentSnapshot = new Map(currentBlocks.map((b) => [b.id, b.label ?? ""]))

    const changedIds: string[] = []

    for (const [id, prevLabel] of this.#mathBlockSnapshot) {
      const currentLabel = currentSnapshot.get(id)
      if ((currentLabel === undefined || currentLabel !== prevLabel) && !this.#blocksWithRecentSolverAdd.has(id)) {
        changedIds.push(id)
      }
    }

    this.#blocksWithRecentSolverAdd.clear()
    this.#mathBlockSnapshot = currentSnapshot

    for (const blockId of changedIds) {
      await this.#clearSolverOutputsForBlockAndDependents(blockId)
    }
  }

  async #clearSolverOutputsForBlockAndDependents(blockId: string): Promise<void> {
    await this.#computation.clearSolverOutputs(blockId)
    const deps = this.#variables.getDependencies(blockId)
    if (!deps?.dependentBlocks) {
      return
    }
    for (const dependentId of deps.dependentBlocks) {
      await this.#computation.clearSolverOutputs(dependentId)
    }
  }

  /**
   * Compute numerical result for a math symbol
   * @param jiixBlockId - The ID of the math block
   * @param mode - Result display mode ("draw" or "ghost"). Defaults to editor.mathResultMode
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
      return this.#computation.computeNumericalResult(jiixBlockId, mode)
    } catch (error) {
      this.editor.manageError(error as Error)
      throw error
    }
  }

  async computeAllNumericalResults(): Promise<void> {
    return this.#computation.computeAllNumericalResults()
  }

  async clearSolverOutputs(jiixBlockId: string): Promise<void> {
    return this.#computation.clearSolverOutputs(jiixBlockId)
  }

  async clearAllSolverOutputs(): Promise<void> {
    return this.#computation.clearAllSolverOutputs()
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

  /**
   * Set value for a specific variable in a math expression
   * @param jiixBlockId - The ID of the math element (jiixId)
   * @param variableName - Name of the variable to set
   * @param variableValue - Value to assign to the variable
   * @returns Promise that resolves when the variable is set
   */
  async setVariableValue(jiixBlockId: string, variableName: string, variableValue: number): Promise<void> {
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
      if (jiixBlockId) {
        await this.recalculateDependentBlocks(jiixBlockId)
      }
    } catch (error) {
      this.editor.manageError(error as Error)
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
    try {
      this.logger.info("setListVariableValue", {
        jiixBlockId,
        variableValues,
      })

      for (const [variableName, variableValue] of Object.entries(variableValues)) {
        await this.setVariableValue(jiixBlockId, variableName, variableValue)
      }
    } catch (error) {
      this.editor.manageError(error as Error)
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
      return this.#variables.getVariables(jiixBlockId)
    } catch (error) {
      this.editor.manageError(error as Error)
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
      return this.#variables.getVariableValue(jiixBlockId, variableName)
    } catch (error) {
      this.editor.manageError(error as Error)
      throw error
    }
  }

  getDependencies(jiixBlockId: string): TMathDependencies | null {
    return this.#variables.getDependencies(jiixBlockId)
  }

  async enrichMathDependencies(jiixBlockId: string): Promise<void> {
    return this.#variables.enrichMathDependencies(jiixBlockId)
  }

  cleanupMathDependencies(jiixBlockIds: string[]): void {
    this.#variables.cleanupMathDependencies(jiixBlockIds)
  }

  async recalculateDependentBlocks(sourceBlockId: string): Promise<void> {
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
    this.editor.event.emitChanged(this.editor.history.context)
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
    await this.#variables.removeVariableValue(jiixBlockId, variableName)
    await this.recalculateDependentBlocks(jiixBlockId)
  }

  async asVariableDefinition(jiixBlockId: string): Promise<TMathVariableDefinition | null> {
    return this.#variables.asVariableDefinition(jiixBlockId)
  }

  async getVariableDefinitions(): Promise<TMathVariableDefinitions[]> {
    return this.#variables.getVariableDefinitions()
  }

  async getAllVariableUsages(): Promise<TMathVariableUsage[]> {
    return this.#variables.getAllVariableUsages()
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
      return this.#evaluation.evaluateFunction(jiixBlockId, evaluation)
    } catch (error) {
      this.editor.manageError(error as Error)
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
      return this.#evaluation.getEvaluables(jiixBlockId)
    } catch (error) {
      this.editor.manageError(error as Error)
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
      return await this.editor.recognizer.getDiagnostic(jiixBlockId, task)
    } catch (error) {
      this.editor.manageError(error as Error)
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
      return await this.editor.recognizer.getAvailableActions(jiixBlockId)
    } catch (error) {
      this.editor.manageError(error as Error)
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
    this.logger.info("tryAutoCompute")

    const mathBlocks = this.editor.model.mathBlocks

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
        const actions = await this.editor.recognizer.getAvailableActions(mb.id)
        if (actions?.includes("numerical-computation")) {
          const { wasRecomputed, addedStrokesCount } = await this.#computation.computeNumericalResult(mb.id)
          if (wasRecomputed && addedStrokesCount > 0 && this.#computation.getConfig().resultMode === "draw") {
            this.#blocksWithRecentSolverAdd.add(mb.id)
          }
        }
      } catch (error) {
        this.logger.debug("tryAutoCompute", `Cannot auto-compute "${label}":`, (error as Error).message)
      }
    }
    this.editor.selector.redrawSelectedGroup()
  }

  protected onDestroy(): void {
    this.#computation.destroy()
    this.#variables.destroy()
    this.#evaluation.destroy()
  }
}
