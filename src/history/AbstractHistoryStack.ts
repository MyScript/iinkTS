import type { EditorEvent } from "@/editor/EditorEvent"
import { LoggerCategory, LoggerManager } from "@/logger"

import type { THistoryConfiguration } from "./HistoryConfiguration"
import type { THistoryContext } from "./HistoryContext"
import { getInitialHistoryContext } from "./HistoryContext"

/**
 * @group History
 * @remarks shared stack/context bookkeeping for HistoryManager, IHistoryManager and IIHistoryManager,
 * which only differ in the shape of the stack item and of the recorded changes.
 */
export abstract class AbstractHistoryStack<TStackItem> {
  protected logger = LoggerManager.getLogger(LoggerCategory.HISTORY)

  configuration: THistoryConfiguration
  event: EditorEvent
  context: THistoryContext
  stack: TStackItem[]

  constructor(configuration: THistoryConfiguration, event: EditorEvent) {
    this.logger.info("constructor", {
      configuration,
    })
    this.configuration = configuration
    this.event = event
    this.context = getInitialHistoryContext()
    this.stack = []
  }

  protected abstract isStackItemEmpty(item: TStackItem): boolean

  protected updateContext(): void {
    this.context.canRedo = this.stack.length - 1 > this.context.stackIndex
    this.context.canUndo = this.context.stackIndex > 0
    this.context.empty = this.isStackItemEmpty(this.stack[this.context.stackIndex])
  }

  protected initStack(item: TStackItem): void {
    this.stack.push(item)
    this.event.emitChanged(this.context)
  }

  protected pushToStack(item: TStackItem): void {
    if (this.context.stackIndex + 1 < this.stack.length) {
      this.stack.splice(this.context.stackIndex + 1)
    }

    this.stack.push(item)
    this.context.stackIndex = this.stack.length - 1

    if (this.stack.length > this.configuration.maxStackSize) {
      this.stack.shift()
      this.context.stackIndex--
    }

    this.updateContext()
    this.event.emitChanged(this.context)
  }

  protected moveStackIndex(delta: 1 | -1, allowed: boolean): void {
    if (allowed) {
      this.context.stackIndex += delta
      this.updateContext()
      this.event.emitChanged(this.context)
    }
  }

  pop(): void {
    this.logger.info("pop")
    this.stack.pop()
    this.context.stackIndex = this.stack.length - 1
    this.updateContext()
  }

  clear(): void {
    this.context = getInitialHistoryContext()
    this.stack = []
  }
}
