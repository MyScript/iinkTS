import { LoggerClass } from "../Constants"
import { TUndoRedoConfiguration } from "../configuration"
import { InternalEvent } from "../event"
import { LoggerManager } from "../logger"
import { IModel } from "../model"
import { IHistoryManager } from "./IHistoryManager"
import { TUndoRedoContext, getInitialUndoRedoContext } from "./UndoRedoContext"

/**
 * @group History
 */
export class HistoryManager implements IHistoryManager
{
  #logger = LoggerManager.getLogger(LoggerClass.HISTORY)

  configuration: TUndoRedoConfiguration
  context: TUndoRedoContext
  stack: IModel[]

  constructor(configuration: TUndoRedoConfiguration)
  {
    this.#logger.info("constructor", { configuration })
    this.configuration = configuration
    this.context = getInitialUndoRedoContext()
    this.stack = []
  }

  get internalEvent(): InternalEvent
  {
    return InternalEvent.getInstance()
  }

  private updateContext(): void
  {
    this.context.canRedo = this.stack.length - 1 > this.context.stackIndex
    this.context.canUndo = this.context.stackIndex > 0
    this.context.empty = this.stack[this.context.stackIndex]?.symbols.length === 0
  }

  push(model: IModel): void
  {
    this.#logger.info("push", { model })
    if (this.context.stackIndex + 1 < this.stack.length) {
      this.stack.splice(this.context.stackIndex + 1)
    }

    this.stack.push(model.clone())
    this.context.stackIndex = this.stack.length - 1

    if (this.stack.length > this.configuration.maxStackSize) {
      this.stack.shift()
      this.context.stackIndex--
    }

    this.updateContext()
    this.internalEvent.emitContextChange(this.context)
  }

  pop(): void
  {
    this.#logger.info("pop")
    if (this.context.stackIndex === this.stack.length - 1) {
      this.context.stackIndex--
    }
    this.stack.pop()
    this.updateContext()
  }

  updateStack(model: IModel): void
  {
    this.#logger.info("updateStack", { model })
    const index = this.stack.findIndex(m => m.modificationDate === model.modificationDate)
    if (index > -1) {
      this.stack.splice(index, 1, model.clone())
    }
    this.updateContext()
    this.internalEvent.emitContextChange(this.context)
  }

  undo(): IModel
  {
    this.#logger.info("undo")
    if (this.context.canUndo) {
      this.context.stackIndex--
      this.updateContext()
      this.internalEvent.emitContextChange(this.context)
    }
    const previousModel = this.stack[this.context.stackIndex].clone()
    this.#logger.debug("undo", previousModel)
    return previousModel
  }

  redo(): IModel
  {
    this.#logger.info("redo")
    if (this.context.canRedo) {
      this.context.stackIndex++
      this.updateContext()
      this.internalEvent.emitContextChange(this.context)
    }
    const nextModel = this.stack[this.context.stackIndex].clone()
    this.#logger.debug("redo", nextModel)
    return nextModel
  }
}
