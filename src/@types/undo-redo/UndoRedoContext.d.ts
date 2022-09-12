import { IModel } from "../model/Model"

export type TUndoRedoContext = {
  canUndo: boolean
  canRedo: boolean
  stackIndex: number
  stack: IModel[]
}