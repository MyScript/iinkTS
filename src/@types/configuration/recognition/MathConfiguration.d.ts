import { TMarginConfiguration } from "./MarginConfiguration"
import { TEraserConfiguration } from "./EraserConfiguration"

export type TRoundingMode = 'half up' | 'truncate'

export type TAngleUnit = 'deg' | 'rad'

export type TSolverOptions = 'algebraic' | 'numeric'

export type TSolverConfiguration = {
  enable?: boolean
  'fractional-part-digits'?: number
  'decimal-separator'?: string
  'rounding-mode'?: TRoundingMode
  'angle-unit'?: TAngleUnit
  options?: TSolverOptions
}

export type TUndoRedoMode = 'stroke' | 'session'

export type TUndoRedoConfiguration = {
  mode: TUndoRedoMode
}

export type TMathConfiguration = {
  mimeTypes: ('application/x-latex' | 'application/mathml+xml' | 'application/vnd.myscript.jiix')[]
  solver?: TSolverConfiguration
  margin?: TMarginConfiguration
  'undo-redo'?: TUndoRedoConfiguration
  customGrammar?: string
  customGrammarId?: string
  customGrammarContent?: string
  eraser?: TEraserConfiguration
  'session-time'?: number
  'recognition-timeout'?: number
}