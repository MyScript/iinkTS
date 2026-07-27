/**
 * @group Canvas
 * @summary
 * List the possibilities of interactions
 */
export enum CanvasTool {
  Write = "write",
  Erase = "erase",
  /**
   * @remarks only usable in the case of interactive ink canvas
   */
  Select = "select",
  /**
   * @remarks only usable in the case of interactive ink canvas
   */
  Move = "move",
}

/**
 * @group Canvas
 * @summary
 * List all the shapes that can be drawn
 * @remarks
 * only usable in the case of interactive ink canvas
 */
export enum CanvasWriteTool {
  Pencil = "pencil",
  Rectangle = "rectangle",
  Rhombus = "rhombus",
  Circle = "circle",
  Ellipse = "ellipse",
  Triangle = "triangle",
  Parallelogram = "parallelogram",
  Line = "line",
  Arrow = "arrow",
  DoubleArrow = "double-arrow",
}

/**
 * @group Renderer
 * @summary
 * List all svg elements roles
 * @remarks
 * only usable in the case of interactive ink canvas
 */
export enum SvgElementRole {
  Guide = "guide",
  InteractElementsGroup = "interact-elements-group",
  Translate = "translate",
  Resize = "resize",
  Rotate = "rotate",
}

/**
 * @group Renderer
 * @summary
 * List all svg elements resize direction
 * @remarks
 * only usable in the case of interactive ink canvas
 */
export const enum ResizeDirection {
  North = "n-resize",
  East = "e-resize",
  South = "s-resize",
  West = "w-resize",
  NorthEast = "ne-resize",
  NorthWest = "nw-resize",
  SouthEast = "se-resize",
  SouthWest = "sw-resize",
}

/**
 * @group Renderer
 */
export const SELECTION_MARGIN = 10 as const

/**
 * @group Constants
 */
export * from "./constants/MathDiagnosticMessages"
