import { DefaultEraserConfiguration } from "./EraserConfiguration"
import { DefaultMarginConfiguration } from "./MarginConfiguration"
import type { TMathConfiguration } from "./MathConfiguration"
import { DefaultMathUndoRedoConfiguration, DefaultSolverConfiguration } from "./MathConfiguration"

/**
 * @group Client
 * @source
 */
export const DefaultMathV2Configuration: TMathConfiguration = {
  solver: DefaultSolverConfiguration,
  margin: DefaultMarginConfiguration,
  eraser: DefaultEraserConfiguration,
  "undo-redo": DefaultMathUndoRedoConfiguration,
  mimeTypes: ["application/x-latex"],
}
