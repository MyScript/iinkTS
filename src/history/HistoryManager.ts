import { EditorEvent } from "../editor/EditorEvent"
import { LoggerCategory, LoggerManager } from "../logger"
import { Model } from "../model"
import { THistoryConfiguration } from "./HistoryConfiguration"
import { THistoryContext, getInitialHistoryContext } from "./HistoryContext"

/**
 * @group History
 */
export class HistoryManager
{
  #logger = LoggerManager.getLogger(LoggerCategory.HISTORY)

  configuration: THistoryConfiguration
  event: EditorEvent
  context: THistoryContext
  stack: Model[]

  constructor(configuration: THistoryConfiguration, event: EditorEvent)
  {
    this.#logger.info("constructor", { configuration })
    this.configuration = configuration
    this.event = event
    this.context = getInitialHistoryContext()
    this.stack = []
  }

  private updateContext(): void
  {
    this.context.canRedo = this.stack.length - 1 > this.context.stackIndex
    this.context.canUndo = this.context.stackIndex > 0
    this.context.empty = this.stack[this.context.stackIndex].symbols.length === 0
  }

  push(model: Model): void
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
    this.event.emitChanged(this.context)
  }

  updateStack(model: Model): void
  {
    this.#logger.info("updateStack", { model })
    const index = this.stack.findIndex(m => m.modificationDate === model.modificationDate)
    if (index > -1) {
      this.stack.splice(index, 1, model.clone())
    }
    this.updateContext()
    this.event.emitChanged(this.context)
  }

  undo(): Model
  {
    this.#logger.info("undo")
    if (this.context.canUndo) {
      this.context.stackIndex--
      this.updateContext()
      this.event.emitChanged(this.context)
    }
    const previousModel = this.stack[this.context.stackIndex].clone()
    this.#logger.debug("undo", previousModel)
    return previousModel
  }

  redo(): Model
  {
    this.#logger.info("redo")
    if (this.context.canRedo) {
      this.context.stackIndex++
      this.updateContext()
      this.event.emitChanged(this.context)
    }
    const nextModel = this.stack[this.context.stackIndex].clone()
    this.#logger.debug("redo", nextModel)
    return nextModel
  }
}
