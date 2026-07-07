/**
 * @group Manager
 * @summary List all authorized gestures
 */
export type TGestureType = "UNDERLINE" | "SCRATCH" | "JOIN" | "INSERT" | "STRIKETHROUGH" | "SURROUND"

/**
 * @group Manager
 * @remarks
 *  when gestureType = "INSERT", subStrokes represent the two parts
 *  when gestureType = "SCRATCH", subStrokes represent the part to substract at the stroke corresponding fullStrokeId
 */
export type TGesture = {
  gestureType: TGestureType
  gestureStrokeId: string
  strokeIds: string[]
  strokeBeforeIds: string[]
  strokeAfterIds: string[]
  subStrokes?: {
    fullStrokeId: string
    x: number[]
    y: number[]
  }[]
}

/**
 * @group Manager
 * @summary
 * List all action allowed on surround detected
 * @remarks
 * only usable in the case of interactive ink editor
 */
export enum SurroundAction {
  Select = "select",
  Surround = "surround",
  Highlight = "highlight",
}

/**
 * @group Manager
 * @summary
 * List all action allowed on strikeThrough detected
 * @remarks
 * only usable in the case of interactive ink editor
 */
export enum StrikeThroughAction {
  Erase = "erase",
  Draw = "draw",
}

/**
 * @group Manager
 * @summary
 * List all action allowed on underline detected
 * @remarks
 * only usable in the case of interactive ink editor
 */
export enum UnderlineAction {
  Draw = "draw",
  Thicken = "thicken",
}

/**
 * @group Manager
 * @summary
 * List all action allowed on split detected
 * @remarks
 * only usable in the case of interactive ink editor
 */
export enum InsertAction {
  /**
   * @remarks Add line break on gesture place
   */
  LineBreak = "line-break",
  /**
   * @remarks Insert place in gesture place
   */
  Insert = "insert",
}

/**
 * @group Manager
 * @source
 */
export type TGestureConfiguration = {
  surround: SurroundAction
  strikeThrough: StrikeThroughAction
  underline: UnderlineAction
  insert: InsertAction
}

/**
 * @group Manager
 * @source
 */
export const DefaultGestureConfiguration: TGestureConfiguration = {
  surround: SurroundAction.Select,
  strikeThrough: StrikeThroughAction.Draw,
  underline: UnderlineAction.Draw,
  insert: InsertAction.LineBreak,
}
