import { IModel } from "../model"

/**
 * @group UndoRedo
 */
export type TUndoRedoContext = {
  canUndo: boolean
  canRedo: boolean
  empty: boolean
  stackIndex: number
  possibleUndoCount: number
  stack: IModel[]
}

/**
 * @group UndoRedo
 */
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
    this.stack = [model.clone()]
  }
}
