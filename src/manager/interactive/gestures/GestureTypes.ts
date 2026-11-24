/**
 * @group Manager
 * @summary List all authorized gestures
 */
export type { TGesture, TGestureType } from "@/client"

/**
 * @group Manager
 * @summary
 * List all action allowed on surround detected
 * @remarks
 * only usable in the case of interactive ink canvas
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
 * only usable in the case of interactive ink canvas
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
 * only usable in the case of interactive ink canvas
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
 * only usable in the case of interactive ink canvas
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
 * @summary
 * List all action allowed on join detected
 * @remarks
 * only usable in the case of interactive ink canvas
 */
export enum JoinAction {
  /**
   * @remarks Glue the two words around the gesture into one, or pull the next row up to the end of the row
   */
  Join = "join",
  /**
   * @remarks Close the gap around the gesture down to a single word space, keeping words apart and rows in place
   */
  CloseGap = "close-gap",
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
  join: JoinAction
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
  join: JoinAction.Join,
}
