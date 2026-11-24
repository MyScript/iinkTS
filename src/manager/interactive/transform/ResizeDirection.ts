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
