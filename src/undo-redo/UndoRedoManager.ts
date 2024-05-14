import { LoggerClass } from "../Constants"
import { TUndoRedoConfiguration } from "../configuration"
import { InternalEvent } from "../event"
import { LoggerManager } from "../logger"
import { IModel } from "../model"
import { UndoRedoContext } from "./UndoRedoContext"

/**
 * @group UndoRedo
 */
export class UndoRedoManager
{
  #logger = LoggerManager.getLogger(LoggerClass.UNDO_REDO)

  context: UndoRedoContext
  configuration: TUndoRedoConfiguration

  constructor(configuration: TUndoRedoConfiguration, model: IModel)
  {
    this.#logger.info("constructor", { configuration, model })
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
    this.context.empty = currentModel.symbols.length === 0
  }

  addModelToStack(model: IModel): void
  {
    this.#logger.info("addModelToStack", { model })
    if (this.context.stackIndex + 1 < this.context.stack.length) {
      this.context.stack.splice(this.context.stackIndex + 1)
    }

    this.context.stack.push(model.clone())
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
    this.#logger.info("removeLastModelInStack")
    if (this.context.stackIndex === this.context.stack.length - 1) {
      this.context.stackIndex--
    }
    this.context.stack.pop()
    this.updateCanUndoRedo()
  }

  updateModelInStack(model: IModel): void
  {
    this.#logger.info("updateModelInStack", { model })
    const index = this.context.stack.findIndex(m => m.modificationDate === model.modificationDate)
    if (index > -1) {
      this.context.stack.splice(index, 1, model.clone())
    }
    this.updateCanUndoRedo()
    this.internalEvent.emitContextChange(this.context)
  }

  undo(): IModel
  {
    this.#logger.info("undo")
    if (this.context.canUndo) {
      this.context.stackIndex--
      this.updateCanUndoRedo()
      this.internalEvent.emitContextChange(this.context)
    }
    const previousModel = this.context.stack[this.context.stackIndex].clone()
    this.#logger.debug("undo", previousModel)
    return previousModel
  }

  redo(): IModel
  {
    this.#logger.info("redo")
    if (this.context.canRedo) {
      this.context.stackIndex++
      this.updateCanUndoRedo()
      this.internalEvent.emitContextChange(this.context)
    }
    const nextModel = this.context.stack[this.context.stackIndex].clone()
    this.#logger.debug("redo", nextModel)
    return nextModel
  }

  reset(model: IModel): void
  {
    this.#logger.info("reset", { model })
    this.context = new UndoRedoContext(model)
    this.internalEvent.emitContextChange(this.context)
  }

}
