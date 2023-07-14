import { IModel } from "../model/Model"

export type TUndoRedoContext = {
  canUndo: boolean
  canRedo: boolean
  empty: boolean
  stackIndex: number
  possibleUndoCount: number
  stack: IModel[]
}
