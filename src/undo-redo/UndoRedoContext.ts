import { IModel } from "../@types/model/Model"
import { TUndoRedoContext } from "../@types/undo-redo/UndoRedoContext"

export class UndoRedoContext implements TUndoRedoContext
{
  stackIndex: number
  stack: IModel[]
  canRedo: boolean
  canUndo: boolean

  constructor(model: IModel)
  {
    this.stackIndex = 0
    this.stack = [model.getClone()]
    this.canRedo = false
    this.canUndo = false
  }
}
