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
