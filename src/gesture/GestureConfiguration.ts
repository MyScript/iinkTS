import { InsertAction, StrikeThroughAction, SurroundAction } from "./Gesture"

/**
 * @group Gesture
 * @source
 */
export type TGestureConfiguration = {
  surround: SurroundAction
  strikeThrough: StrikeThroughAction
  insert: InsertAction
}

/**
 * @group Gesture
 * @source
 */
export const DefaultGestureConfiguration: TGestureConfiguration = {
  surround: SurroundAction.Select,
  strikeThrough: StrikeThroughAction.Draw,
  insert: InsertAction.LineBreak
}
