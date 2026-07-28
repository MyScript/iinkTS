import type { TInteractiveInkCanvas } from "@/canvas/TInteractiveInkCanvas"
import { LoggerCategory } from "@/logger"

import { IIAbstractManager } from "../IIAbstractManager"
import type { IIMathComputationSubManager } from "./IIMathComputationSubManager"
import type { IIMathFunctionEvaluationSubManager } from "./IIMathFunctionEvaluationSubManager"
import type { IIMathVariableSubManager } from "./IIMathVariableSubManager"

/**
 * @group Manager
 */
export type TMathBlockCapabilities = {
  canEditVariables: boolean
  canCompute: boolean
  canEvaluate: boolean
  hasDrawSolverOutputs: boolean
}

/**
 * @group Manager
 * @remarks Derives and caches, per math block, which math operations are available (edit variables, compute, evaluate, manage solver output strokes).
 */
export class IIMathCapabilitiesSubManager extends IIAbstractManager {
  protected managerName = "IIMathCapabilitiesSubManager"

  #variables: IIMathVariableSubManager
  #computation: IIMathComputationSubManager
  #evaluation: IIMathFunctionEvaluationSubManager
  #cache: Map<string, TMathBlockCapabilities> = new Map()

  constructor(
    canvas: TInteractiveInkCanvas,
    variables: IIMathVariableSubManager,
    computation: IIMathComputationSubManager,
    evaluation: IIMathFunctionEvaluationSubManager
  ) {
    super(canvas, LoggerCategory.MATH)
    this.#variables = variables
    this.#computation = computation
    this.#evaluation = evaluation
  }

  async getBlockCapabilities(jiixBlockId: string): Promise<TMathBlockCapabilities> {
    const cached = this.#cache.get(jiixBlockId)
    if (cached) {
      this.logger.debug("getBlockCapabilities", { jiixBlockId, source: "cache" })
      return cached
    }
    this.logger.info("getBlockCapabilities", { jiixBlockId })
    const [actions, variables, evaluables] = await Promise.all([
      this.canvas.client.getAvailableActions(jiixBlockId),
      this.#variables.getVariables(jiixBlockId),
      this.#evaluation.getEvaluables(jiixBlockId),
    ])
    const capabilities: TMathBlockCapabilities = {
      canEditVariables: variables.length > 0,
      canCompute: actions?.includes("numerical-computation") ?? false,
      canEvaluate: evaluables.length > 0,
      hasDrawSolverOutputs: this.#computation.hasDrawSolverOutputs(jiixBlockId),
    }
    this.#cache.set(jiixBlockId, capabilities)
    return capabilities
  }

  invalidateCache(jiixBlockId: string): void {
    if (jiixBlockId === "") {
      this.#cache.clear()
    } else {
      this.#cache.delete(jiixBlockId)
    }
  }
}
