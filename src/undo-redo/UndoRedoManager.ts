import { TUndoRedoConfiguration } from "../@types/configuration/UndoRedoConfiguration"
import { IModel } from "../@types/model/Model"
import { TUndoRedoContext } from "../@types/undo-redo/UndoRedoContext"
import { EventHelper } from "../event/EventHelper"
import { UndoRedoContext } from "./UndoRedoContext"

export class UndoRedoManager
{
  context: TUndoRedoContext
  configuration: TUndoRedoConfiguration

  constructor(configuration: TUndoRedoConfiguration, model: IModel)
  {
    this.configuration = configuration
    this.context = new UndoRedoContext(model)
  }

  get events(): EventHelper
  {
    return EventHelper.getInstance()
  }

  private updateCanUndoRedo(): void {
    this.context.canRedo = this.context.stack.length - 1 > this.context.stackIndex
    this.context.canUndo = this.context.stackIndex > 0
  }

  addModelToStack(model: IModel): void {
    if (this.context.stackIndex + 1 < this.context.stack.length) {
      this.context.stack.splice(this.context.stackIndex + 1)
    }

    this.context.stackIndex++
    this.context.stack.push(model.getClone())

    if (this.context.stack.length > this.configuration.maxStackSize) {
      this.context.stack.shift()
      this.context.stackIndex--
    }

    this.updateCanUndoRedo()
    this.events.emitChange(this.context)
  }

  updateModelInStack(model: IModel): void {
    const index = this.context.stack.findIndex(m => m.modificationDate === model.modificationDate)
    if (index > -1) {
      this.context.stack.splice(index, 1, model.getClone())
    }
  }

  undo(): IModel {
    if (this.context.canUndo) {
      this.context.stackIndex--
      this.updateCanUndoRedo()
      this.events.emitChange(this.context)
    }
    return this.context.stack[this.context.stackIndex].getClone()
  }

  redo(): IModel {
    if (this.context.canRedo) {
      this.context.stackIndex++
      this.updateCanUndoRedo()
      this.events.emitChange(this.context)
    }
    return this.context.stack[this.context.stackIndex].getClone()
  }

  reset(model: IModel): void {
    this.context = new UndoRedoContext(model)
    this.events.emitChange(this.context)
  }

}
