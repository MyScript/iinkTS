import { TUndoRedoConfiguration } from "../@types/configuration/UndoRedoConfiguration"
import { IModel } from "../@types/model/Model"
import { InternalEvent } from "../event/InternalEvent"
import { UndoRedoContext } from "./UndoRedoContext"
import { Logger, LoggerManager } from "../logger"
import { LOGGER_CLASS } from "../Constants"

export class UndoRedoManager
{
  context: UndoRedoContext
  configuration: TUndoRedoConfiguration
  #logger: Logger

  constructor(configuration: TUndoRedoConfiguration, model: IModel)
  {
    this.configuration = configuration
    this.context = new UndoRedoContext(model)
    this.#logger = LoggerManager.getLogger(LOGGER_CLASS.UNDOREDO_MANAGER)
    this.#logger.info("constructor", { configuration, model })
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
    this.#logger.info("addModelToStack", { model })
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
    this.#logger.info("removeLastModelInStack", { })
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
      this.context.stack.splice(index, 1, model.getClone())
    }
    this.internalEvent.emitContextChange(this.context)
  }

  undo(): IModel
  {
    this.#logger.info("undo", { })
    if (this.context.canUndo) {
      this.context.stackIndex--
      this.updateCanUndoRedo()
      this.internalEvent.emitContextChange(this.context)
    }
    this.#logger.debug("undo", this.context.stack[this.context.stackIndex].getClone())
    return this.context.stack[this.context.stackIndex].getClone()
  }

  redo(): IModel
  {
    this.#logger.info("redo", { })
    if (this.context.canRedo) {
      this.context.stackIndex++
      this.updateCanUndoRedo()
      this.internalEvent.emitContextChange(this.context)
    }
    this.#logger.debug("undo", this.context.stack[this.context.stackIndex].getClone())
    return this.context.stack[this.context.stackIndex].getClone()
  }

  reset(model: IModel): void
  {
    this.#logger.info("reset", { model })
    this.context = new UndoRedoContext(model)
    this.internalEvent.emitContextChange(this.context)
  }

}
