import { TUndoRedoContext } from "./UndoRedoContext"

export interface IHistoryManager {
  context: TUndoRedoContext
  undo(): unknown
  redo(): unknown
}
