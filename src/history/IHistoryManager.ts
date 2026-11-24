import type { TStroke } from "@/symbol"

import { AbstractDiffHistoryManager } from "./AbstractDiffHistoryManager"

/**
 * @group History
 */
export type TIHistoryChanges = {
  added?: TStroke[]
  removed?: TStroke[]
}

/**
 * @group History
 */
export class IHistoryManager extends AbstractDiffHistoryManager<TIHistoryChanges> {
  protected isChangesEmpty(changes: TIHistoryChanges): boolean {
    return !(changes.added?.length || changes.removed?.length)
  }

  init(): void {
    this.initStack({})
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
}
