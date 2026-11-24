import type { TBenchCase } from "../lib/harness.ts"
import { sized, RESIDENT_SIZE, type TBenchFixture } from "../lib/fixture.ts"

/**
 * `IIHistoryManager`: the undo stack.
 *
 * It has already been the cause once: writing on a loaded document lagged because every push cloned
 * the whole document, so recording a one-stroke change grew with the document it was recorded
 * against. The stack is diff-only now and nothing else here would notice if that stopped being true.
 * Re-introducing the clone takes this case from 1.06 ms to 758 ms, x683 past the limit.
 *
 * A push followed by its undo and redo leaves the stack where it started, so the case is steady: it
 * saturates at `maxStackSize` rather than growing for the length of the run.
 */

const HISTORY_PASSES = 100 // 1.15 ms measured, one push-undo-redo cycle per pass

export const OBJECT = "history"

export function cases(f: TBenchFixture): TBenchCase[] {
  return [
    {
      name: sized(`history: push then undo and redo @${RESIDENT_SIZE}`, HISTORY_PASSES),
      // A push followed by its undo and redo leaves the stack where it started, so the case is steady:
      // it saturates at `maxStackSize` and stays there rather than growing for the length of the run.
      fn: () => {
        for (let pass = 0; pass < HISTORY_PASSES; pass++) {
          f.history.push(f.historyChanges[pass % f.historyChanges.length])
          f.history.undo()
          f.history.redo()
        }
      },
    },
  ]
}
