import type { Model } from "@/model"

import { AbstractHistoryStack } from "./AbstractHistoryStack"

/**
 * @group History
 */
export class HistoryManager extends AbstractHistoryStack<Model> {
  protected isStackItemEmpty(item: Model): boolean {
    return item.symbols.length === 0
  }

  push(model: Model): void {
    this.logger.info("push", { model })
    this.pushToStack(model.clone())
  }

  updateStack(model: Model): void {
    this.logger.info("updateStack", { model })
    const index = this.stack.findIndex((m) => m.modificationDate === model.modificationDate)
    if (index > -1) {
      this.stack.splice(index, 1, model.clone())
    }
    this.updateContext()
    this.event.emitChanged(this.context)
  }

  undo(): Model {
    this.logger.info("undo")
    this.moveStackIndex(-1, this.context.canUndo)
    const previousModel = this.stack[this.context.stackIndex].clone()
    this.logger.debug("undo", previousModel)
    return previousModel
  }

  redo(): Model {
    this.logger.info("redo")
    this.moveStackIndex(1, this.context.canRedo)
    const nextModel = this.stack[this.context.stackIndex].clone()
    this.logger.debug("redo", nextModel)
    return nextModel
  }
}
