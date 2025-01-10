import { DefaultMarginConfiguration, TMarginConfiguration } from "./MarginConfiguration"
import { DefaultEraserConfiguration, TEraserConfiguration } from "./EraserConfiguration"

/**
 * @group Recognizer
 */
export type TRoundingMode = "half up" | "truncate"

/**
 * @group Recognizer
 */
export type TAngleUnit = "deg" | "rad"

/**
 * @group Recognizer
 */
export type TSolverOptions = "algebraic" | "numeric"

/**
 * @group Recognizer
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
 * @group Recognizer
 * @source
 */
export const DefaultSolverConfiguration: TSolverConfiguration = {
  enable: true,
  "fractional-part-digits": 3,
  "decimal-separator": ".",
  "rounding-mode": "half up",
  "angle-unit": "deg"
}

/**
 * @group Recognizer
 */
export type TUndoRedoMode = "stroke" | "session"

/**
 * @group Recognizer
 */
export type TMathUndoRedoConfiguration = {
  mode: TUndoRedoMode
}

/**
 * @group Recognizer
 * @source
 */
export const DefaultMathUndoRedoConfiguration: TMathUndoRedoConfiguration = {
  mode: "stroke"
}

/**
 * @group Recognizer
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
 * @group Recognizer
 * @source
 */
export const DefaultMathConfiguration: TMathConfiguration = {
  solver: DefaultSolverConfiguration,
  margin: DefaultMarginConfiguration,
  eraser: DefaultEraserConfiguration,
  "undo-redo": DefaultMathUndoRedoConfiguration,
  mimeTypes: ["application/vnd.myscript.jiix"],
}
