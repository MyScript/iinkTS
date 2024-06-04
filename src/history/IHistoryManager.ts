import { TUndoRedoContext } from "./UndoRedoContext"

/**
 * @group History
 */
export interface IHistoryManager {
  context: TUndoRedoContext
  undo(): unknown
  redo(): unknown
}
