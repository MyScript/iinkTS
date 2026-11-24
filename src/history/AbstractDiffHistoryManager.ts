import { AbstractHistoryStack } from "./AbstractHistoryStack"

/**
 * @group History
 * @remarks shared push/undo/redo for history managers whose stack item IS the changes
 * record itself (no stored model snapshot). Subclasses only implement isChangesEmpty and
 * reverseChanges; everything else (stack bookkeeping, empty/canUndo/canRedo context) comes
 * from AbstractHistoryStack.
 */
export abstract class AbstractDiffHistoryManager<TChanges> extends AbstractHistoryStack<TChanges> {
  // Interim default until each subclass wires context.empty to its canvas' live model
  // (some consumers, e.g. ClearMenuAction for InteractiveInkCanvas, read context.empty and
  // expect real emptiness, not just "no changes recorded at this step").
  protected isStackItemEmpty(item: TChanges): boolean {
    return this.isChangesEmpty(item)
  }

  protected abstract isChangesEmpty(changes: TChanges): boolean
  protected abstract reverseChanges(changes: TChanges): TChanges

  push(changes: TChanges): void {
    this.logger.info("push", { changes })
    if (this.isChangesEmpty(changes)) {
      return
    }
    this.pushToStack(changes)
  }

  undo(): TChanges {
    this.logger.info("undo")
    const currentChanges = this.stack[this.context.stackIndex]
    this.moveStackIndex(-1, this.context.canUndo)
    const reversed = this.reverseChanges(currentChanges)
    this.logger.debug("undo", reversed)
    return reversed
  }

  redo(): TChanges {
    this.logger.info("redo")
    this.moveStackIndex(1, this.context.canRedo)
    const nextChanges = this.stack[this.context.stackIndex]
    this.logger.debug("redo", nextChanges)
    return nextChanges
  }
}
