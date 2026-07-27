import type { TInteractiveInkCanvas } from "@/canvas/TInteractiveInkCanvas"
import { IIMathDiagnosticChecker, IIMathFunctionEvaluator, IIMathVariablePerBlockCanvas } from "@/components"
import { LoggerCategory, LoggerManager } from "@/logger"
import type { TMenuSubMenu } from "@/menu/items/SubMenuItem"
import { SubMenuItem } from "@/menu/items/SubMenuItem"

/** @group Menu */
export type TContextMathItemsConfig = {
  checkDiagnostic?: boolean
  editVariables?: boolean
  compute?: boolean
  evaluate?: boolean
  manageResultStrokes?: boolean
}
/** @group Menu */
export type TContextMathConfig = boolean | TContextMathItemsConfig

/**
 * @group Menu
 * @remarks Menu contextuel Math - Opérations mathématiques sur les symboles
 */
export class MathContextMenu extends SubMenuItem {
  protected logger = LoggerManager.getLogger(LoggerCategory.MENU)

  readonly id: string
  readonly idEditVariables: string
  readonly idNumericalComputation: string
  readonly idCheckDiagnostic: string
  readonly idEvaluate: string
  readonly idSelectResultStrokes: string
  readonly idDeleteResultStrokes: string

  constructor(canvas: TInteractiveInkCanvas, idPrefix = "ms-menu-context", itemsConfig?: TContextMathItemsConfig) {
    const enabled = (key: keyof TContextMathItemsConfig) => itemsConfig?.[key] !== false

    const id = `${idPrefix}-math`
    const idEditVariables = `${id}-variables`
    const idNumericalComputation = `${id}-numerical-computation`
    const idCheckDiagnostic = `${id}-check-diagnostic`
    const idEvaluate = `${id}-evaluate`
    const idSelectResultStrokes = `${id}-select-result-strokes`
    const idDeleteResultStrokes = `${id}-delete-result-strokes`

    const config: TMenuSubMenu = {
      id: id,
      type: "submenu",
      label: "Math",
      position: "right",
      items: [],
    }

    if (enabled("checkDiagnostic")) {
      config.items.push({
        id: idCheckDiagnostic,
        type: "button",
        label: "Check diagnostic",
        action: async () => {
          this.logger.info("Check diagnostic clicked")
          try {
            const jiixBlockIds = canvas.jiix
              .getBlocksForSymbols(canvas.model.symbolsSelected)
              .filter((s) => s.type === "Math")
              .map((s) => s.id)
            if (jiixBlockIds.length === 0) {
              this.logger.warn("No block math selected")
              return
            }
            const checker = new IIMathDiagnosticChecker(canvas, jiixBlockIds)
            await checker.show()
          } catch (error) {
            this.logger.error("Error checking diagnostic:", error)
          }
        },
      })
    }

    if (enabled("editVariables")) {
      config.items.push({
        id: idEditVariables,
        type: "button",
        label: "Edit variables",
        action: async () => {
          const jiixBlockIds = canvas.jiix
            .getBlocksForSymbols(canvas.model.symbolsSelected)
            .filter((s) => s.type === "Math")
            .map((s) => s.id)
          if (jiixBlockIds.length === 0) {
            this.logger.warn("No block math selected")
            return
          }
          const variableCanvas = new IIMathVariablePerBlockCanvas(canvas, jiixBlockIds)
          await variableCanvas.show()
        },
      })
    }

    if (enabled("compute")) {
      config.items.push({
        id: idNumericalComputation,
        type: "button",
        label: "Compute numerical result",
        action: async () => {
          this.logger.info("Compute numerical result clicked")
          try {
            const jiixBlockIds = canvas.jiix
              .getBlocksForSymbols(canvas.model.symbolsSelected)
              .filter((s) => s.type === "Math")
              .map((s) => s.id)
            if (jiixBlockIds.length === 0) {
              this.logger.warn("No block math selected")
              return
            }
            await Promise.all(jiixBlockIds.map((jiixBlockId) => this.canvas.math.computeNumericalResult(jiixBlockId)))
          } catch (error) {
            this.logger.error("Error computing numerical result:", error)
          }
        },
      })
    }

    if (enabled("evaluate")) {
      config.items.push({
        id: idEvaluate,
        type: "button",
        label: "Evaluate function",
        action: async () => {
          this.logger.info("Evaluate function clicked")
          try {
            const jiixBlockIds = canvas.jiix
              .getBlocksForSymbols(canvas.model.symbolsSelected)
              .filter((s) => s.type === "Math")
              .map((s) => s.id)
            if (jiixBlockIds.length === 0) {
              this.logger.warn("No block math selected")
              return
            }
            const evaluator = new IIMathFunctionEvaluator(canvas, jiixBlockIds)
            await evaluator.show()
          } catch (error) {
            this.logger.error("Error evaluating function:", error)
          }
        },
      })
    }

    if (enabled("manageResultStrokes")) {
      config.items.push({
        id: idSelectResultStrokes,
        type: "button",
        label: "Select result strokes",
        action: () => {
          const jiixBlockId = canvas.jiix
            .getBlocksForSymbols(canvas.model.symbolsSelected)
            .find((s) => s.type === "Math")?.id
          if (!jiixBlockId) {
            return
          }
          const ids = canvas.math.getStoredSolverOutputs(jiixBlockId) ?? []
          if (ids.length > 0) {
            canvas.select(ids)
          }
        },
      })

      config.items.push({
        id: idDeleteResultStrokes,
        type: "button",
        label: "Delete result strokes",
        action: async () => {
          const jiixBlockId = canvas.jiix
            .getBlocksForSymbols(canvas.model.symbolsSelected)
            .find((s) => s.type === "Math")?.id
          if (!jiixBlockId) {
            return
          }
          await canvas.math.clearSolverOutputs(jiixBlockId)
        },
      })
    }

    super(config, canvas)
    this.id = id
    this.idEditVariables = idEditVariables
    this.idNumericalComputation = idNumericalComputation
    this.idCheckDiagnostic = idCheckDiagnostic
    this.idEvaluate = idEvaluate
    this.idSelectResultStrokes = idSelectResultStrokes
    this.idDeleteResultStrokes = idDeleteResultStrokes
  }

  setMenuVisibility(
    show: boolean,
    {
      canEditVariables,
      canCompute,
      canEvaluate,
      hasDrawSolverOutputs,
    }: {
      canEditVariables: boolean
      canCompute: boolean
      canEvaluate: boolean
      hasDrawSolverOutputs?: boolean
    }
  ): void {
    const mathMenu = this.getElement()
    if (show) {
      mathMenu.style.removeProperty("display")
      const editVariablesButton = mathMenu.querySelector(`#${this.idEditVariables}`) as HTMLButtonElement
      const numericalComputationButton = mathMenu.querySelector(`#${this.idNumericalComputation}`) as HTMLButtonElement
      const checkDiagnosticButton = mathMenu.querySelector(`#${this.idCheckDiagnostic}`) as HTMLButtonElement
      const evaluateButton = mathMenu.querySelector(`#${this.idEvaluate}`) as HTMLButtonElement
      const selectResultStrokesButton = mathMenu.querySelector(`#${this.idSelectResultStrokes}`) as HTMLButtonElement
      const deleteResultStrokesButton = mathMenu.querySelector(`#${this.idDeleteResultStrokes}`) as HTMLButtonElement

      if (editVariablesButton) {
        editVariablesButton.style.setProperty("display", canEditVariables ? "inline-block" : "none")
      }
      if (numericalComputationButton) {
        numericalComputationButton.style.setProperty("display", canCompute ? "inline-block" : "none")
      }
      if (checkDiagnosticButton) {
        checkDiagnosticButton.style.setProperty("display", "inline-block")
      }
      if (evaluateButton) {
        evaluateButton.style.setProperty("display", canEvaluate ? "inline-block" : "none")
      }
      if (selectResultStrokesButton) {
        selectResultStrokesButton.style.setProperty("display", hasDrawSolverOutputs ? "inline-block" : "none")
      }
      if (deleteResultStrokesButton) {
        deleteResultStrokesButton.style.setProperty("display", hasDrawSolverOutputs ? "inline-block" : "none")
      }
    } else {
      mathMenu.style.setProperty("display", "none")
    }
  }
}
