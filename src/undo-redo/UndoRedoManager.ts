import { TUndoRedoConfiguration } from "../@types/configuration/UndoRedoConfiguration"
import { IModel } from "../@types/model/Model"
import { InternalEvent } from "../event/InternalEvent"
import { UndoRedoContext } from "./UndoRedoContext"

export class UndoRedoManager
{
  context: UndoRedoContext
  configuration: TUndoRedoConfiguration

  constructor(configuration: TUndoRedoConfiguration, model: IModel)
  {
    this.configuration = configuration
    this.context = new UndoRedoContext(model)
  }

  get internalEvent(): InternalEvent
  {
    return InternalEvent.getInstance()
  }

  private updateCanUndoRedo(): void
  {
    this.context.canRedo = this.context.stack.length - 1 > this.context.stackIndex
    this.context.canUndo = this.context.stackIndex > 0
    const currentModel = this.context.stack[this.context.stackIndex]
    this.context.empty = currentModel.rawStrokes.length === 0
  }

  addModelToStack(model: IModel): void
  {
    if (this.context.stackIndex + 1 < this.context.stack.length) {
      this.context.stack.splice(this.context.stackIndex + 1)
    }

    this.context.stack.push(model.getClone())
    this.context.stackIndex = this.context.stack.length - 1

    if (this.context.stack.length > this.configuration.maxStackSize) {
      this.context.stack.shift()
      this.context.stackIndex--
    }

    this.updateCanUndoRedo()
    this.internalEvent.emitContextChange(this.context)
  }

  removeLastModelInStack(): void
  {
    if (this.context.stackIndex === this.context.stack.length - 1) {
      this.context.stackIndex--
    }
    this.context.stack.pop()
    this.updateCanUndoRedo()
  }

  updateModelInStack(model: IModel): void
  {
    const index = this.context.stack.findIndex(m => m.modificationDate === model.modificationDate)
    if (index > -1) {
      this.context.stack.splice(index, 1, model.getClone())
    }
    this.internalEvent.emitContextChange(this.context)
  }

  undo(): IModel
  {
    if (this.context.canUndo) {
      this.context.stackIndex--
      this.updateCanUndoRedo()
      this.internalEvent.emitContextChange(this.context)
    }
    return this.context.stack[this.context.stackIndex].getClone()
  }

  redo(): IModel
  {
    if (this.context.canRedo) {
      this.context.stackIndex++
      this.updateCanUndoRedo()
      this.internalEvent.emitContextChange(this.context)
    }
    return this.context.stack[this.context.stackIndex].getClone()
  }

  reset(model: IModel): void
  {
    this.context = new UndoRedoContext(model)
    this.internalEvent.emitContextChange(this.context)
  }

}
