import { EditorEvent } from "../editor/EditorEvent"
import { LoggerCategory, LoggerManager } from "../logger"
import { IModel } from "../model"
import { IIStroke, TIISymbol } from "../symbol"
import { THistoryContext, getInitialHistoryContext } from "./HistoryContext"
import { THistoryConfiguration } from "./HistoryConfiguration"

/**
 * @group History
 */
export type TIHistoryChanges = {
  added?: TIISymbol[]
  removed?: TIISymbol[]
}

/**
 * @group History
 * @remarks used to send messages to the backend on undo or redo
 */
export type TIHistoryBackendChanges = {
  added?: IIStroke[]
  removed?: IIStroke[]
}

/**
 * @group History
 */
export type TIHistoryStackItem = {
  changes: TIHistoryChanges
  model: IModel
}

/**
 * @group History
 */
export class IHistoryManager {
  #logger = LoggerManager.getLogger(LoggerCategory.HISTORY)

  configuration: THistoryConfiguration
  event: EditorEvent
  context: THistoryContext
  stack: TIHistoryStackItem[]

  constructor(configuration: THistoryConfiguration, event: EditorEvent) {
    this.#logger.info("constructor", { configuration })
    this.configuration = configuration
    this.event = event
    this.context = getInitialHistoryContext()
    this.stack = []
  }

  private updateContext(): void {
    this.context.canRedo = this.stack.length - 1 > this.context.stackIndex
    this.context.canUndo = this.context.stackIndex > 0
    this.context.empty = this.stack[this.context.stackIndex].model.strokes.length === 0
  }

  updateModelStack(model: IModel): void {
    this.#logger.info("updateModelStack", { model })
    const stackIdx = this.stack.findIndex(s => s.model.modificationDate === model.modificationDate)
    if (stackIdx > -1) {
      this.stack[stackIdx].model = model
      this.updateContext()
    }
    this.updateContext()
    this.event.emitChanged(this.context)
  }

  isChangesEmpty(changes: TIHistoryChanges): boolean {
    return !(
      changes.added?.length ||
      changes.removed?.length
    )
  }

  init(model: IModel): void {
    this.stack.push({ model: model.clone(), changes: {} })
    this.event.emitChanged(this.context)
  }

  push(model: IModel, changes: TIHistoryChanges): void {
    this.#logger.info("push", { model, changes })
    if (this.isChangesEmpty(changes)) return

    if (this.context.stackIndex + 1 < this.stack.length) {
      this.stack.splice(this.context.stackIndex + 1)
    }

    this.stack.push({ model: model.clone(), changes })
    this.context.stackIndex = this.stack.length - 1

    if (this.stack.length > this.configuration.maxStackSize) {
      this.stack.shift()
      this.context.stackIndex--
    }

    this.updateContext()
    this.event.emitChanged(this.context)
  }

  pop(): void {
    this.#logger.info("pop")
    this.stack.pop()
    this.context.stackIndex = this.stack.length - 1
    this.updateContext()
  }

  protected reverseChanges(changes: TIHistoryChanges): TIHistoryChanges {
    const reversedChanges: TIHistoryChanges = {}
    if (changes.added) {
      reversedChanges.removed = changes.added
    }
    if (changes.removed) {
      reversedChanges.added = changes.removed
    }
    return reversedChanges
  }

  undo(): TIHistoryStackItem {
    this.#logger.info("undo")
    const currentStackItem = this.stack[this.context.stackIndex]
    if (this.context.canUndo) {
      this.context.stackIndex--
      this.updateContext()
      this.event.emitChanged(this.context)
    }
    const previousStackItem = this.stack[this.context.stackIndex]
    this.#logger.debug("undo", previousStackItem)
    return {
      model: previousStackItem.model,
      changes: this.reverseChanges(currentStackItem.changes)
    }
  }

  redo(): TIHistoryStackItem {
    this.#logger.info("redo")
    if (this.context.canRedo) {
      this.context.stackIndex++
      this.updateContext()
      this.event.emitChanged(this.context)
    }
    const nextStackItem = this.stack[this.context.stackIndex]
    this.#logger.debug("redo", nextStackItem)
    return nextStackItem
  }

  clear(): void {
    this.context = getInitialHistoryContext()
    this.stack = []
  }
}
