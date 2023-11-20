import { DefaultMarginConfiguration, TMarginConfiguration } from "./MarginConfiguration"
import { DefaultEraserConfiguration, TEraserConfiguration } from "./EraserConfiguration"

/**
 * @group Configuration
 */
export type TRoundingMode = "half up" | "truncate"

/**
 * @group Configuration
 */
export type TAngleUnit = "deg" | "rad"

/**
 * @group Configuration
 */
export type TSolverOptions = "algebraic" | "numeric"

/**
 * @group Configuration
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
 * @group Configuration
 */
export const DefaultSolverConfiguration: TSolverConfiguration = {
  enable: true,
  "fractional-part-digits": 3,
  "decimal-separator": ".",
  "rounding-mode": "half up",
  "angle-unit": "deg"
}

/**
 * @group Configuration
 */
export type TUndoRedoMode = "stroke" | "session"

/**
 * @group Configuration
 */
export type TMathUndoRedoConfiguration = {
  mode: TUndoRedoMode
}

/**
 * @group Configuration
 */
export const DefaultMathUndoRedoConfiguration: TMathUndoRedoConfiguration = {
  mode: "stroke"
}

/**
 * @group Configuration
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
 * @group Configuration
 */
export const DefaultMathConfiguration: TMathConfiguration = {
  solver: DefaultSolverConfiguration,
  margin: DefaultMarginConfiguration,
  eraser: DefaultEraserConfiguration,
  "undo-redo": DefaultMathUndoRedoConfiguration,
  mimeTypes: ["application/vnd.myscript.jiix"],
}
