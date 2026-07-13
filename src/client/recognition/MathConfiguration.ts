import type { TEraserConfiguration } from "./EraserConfiguration"
import { DefaultEraserConfiguration } from "./EraserConfiguration"
import type { TMarginConfiguration } from "./MarginConfiguration"
import { DefaultMarginConfiguration } from "./MarginConfiguration"

/**
 * @group Client
 */
export type TRoundingMode = "half up" | "truncate"

/**
 * @group Client
 */
export type TAngleUnit = "deg" | "rad"

/**
 * @group Client
 */
export type TSolverOptions = "algebraic" | "numeric"

/**
 * @group Client
 */
export type TSolverConfiguration = {
  enable?: boolean
  "fractional-part-digits"?: number
  "decimal-separator"?: string
  "rounding-mode"?: TRoundingMode
  "angle-unit"?: TAngleUnit
  options?: TSolverOptions
}

/**
 * @group Client
 * @source
 */
export const DefaultSolverConfiguration: TSolverConfiguration = {
  enable: true,
  "fractional-part-digits": 3,
  "decimal-separator": ".",
  "rounding-mode": "half up",
  "angle-unit": "deg",
}

/**
 * @group Client
 */
export type TUndoRedoMode = "stroke" | "session"

/**
 * @group Client
 */
export type TMathUndoRedoConfiguration = {
  mode: TUndoRedoMode
}

/**
 * @group Client
 * @source
 */
export const DefaultMathUndoRedoConfiguration: TMathUndoRedoConfiguration = {
  mode: "stroke",
}

/**
 * @group Client
 */
export type TMathConfiguration = {
  mimeTypes: ("application/x-latex" | "application/mathml+xml" | "application/vnd.myscript.jiix")[]
  solver?: TSolverConfiguration
  margin: TMarginConfiguration
  "undo-redo"?: TMathUndoRedoConfiguration
  customGrammar?: string
  customGrammarId?: string
  customGrammarContent?: string
  eraser?: TEraserConfiguration
  "session-time"?: number
  "recognition-timeout"?: number
}

/**
 * @group Client
 * @source
 */
export const DefaultMathConfiguration: TMathConfiguration = {
  solver: DefaultSolverConfiguration,
  margin: DefaultMarginConfiguration,
  eraser: DefaultEraserConfiguration,
  "undo-redo": DefaultMathUndoRedoConfiguration,
  mimeTypes: ["application/vnd.myscript.jiix"],
}
