import {
  IModel,
  TUndoRedoContext
} from "../@types"

export class UndoRedoContext implements TUndoRedoContext
{
  canUndo: boolean
  canRedo: boolean
  empty: boolean
  stackIndex: number
  possibleUndoCount: number
  stack: IModel[]

  constructor(model: IModel)
  {
    this.stackIndex = 0
    this.possibleUndoCount = 0
    this.canRedo = false
    this.canUndo = false
    this.empty = true
    this.stack = [model.getClone()]
  }
}
