import type { IModel } from "@/model"
import type { TSymbol } from "@/symbol"

import { AbstractHistoryStack } from "./AbstractHistoryStack"

/**
 * @group History
 */
export type TIHistoryChanges = {
  added?: TSymbol[]
  removed?: TSymbol[]
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
export class IHistoryManager extends AbstractHistoryStack<TIHistoryStackItem> {
  protected isStackItemEmpty(item: TIHistoryStackItem): boolean {
    return item.model.strokes.length === 0
  }

  updateModelStack(model: IModel): void {
    this.logger.info("updateModelStack", {
      model,
    })
    const stackIdx = this.stack.findIndex((s) => s.model.modificationDate === model.modificationDate)
    if (stackIdx > -1) {
      this.stack[stackIdx].model = model.clone()
    }
    this.updateContext()
    this.event.emitChanged(this.context)
  }

  isChangesEmpty(changes: TIHistoryChanges): boolean {
    return !(changes.added?.length || changes.removed?.length)
  }

  init(model: IModel): void {
    this.initStack({
      model: model.clone(),
      changes: {},
    })
  }

  push(model: IModel, changes: TIHistoryChanges): void {
    this.logger.info("push", { model, changes })
    if (this.isChangesEmpty(changes)) {
      return
    }
    this.pushToStack({
      model: model.clone(),
      changes,
    })
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
    this.logger.info("undo")
    const currentStackItem = this.stack[this.context.stackIndex]
    this.moveStackIndex(-1, this.context.canUndo)
    const previousStackItem = this.stack[this.context.stackIndex]
    this.logger.debug("undo", previousStackItem)
    return {
      model: previousStackItem.model,
      changes: this.reverseChanges(currentStackItem.changes),
    }
  }

  redo(): TIHistoryStackItem {
    this.logger.info("redo")
    this.moveStackIndex(1, this.context.canRedo)
    const nextStackItem = this.stack[this.context.stackIndex]
    this.logger.debug("redo", nextStackItem)
    return nextStackItem
  }
}
