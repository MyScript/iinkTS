import type { IIModel } from "@/model"
import type { TStroke, TSymbol } from "@/symbol"
import { extractStrokes } from "@/symbol"

import { AbstractDiffHistoryManager } from "./AbstractDiffHistoryManager"

/**
 * A math variable's value before and after one step. `undefined` means the variable had no value.
 *
 * Keyed by the block's strokes, not by its `jiixBlockId`: the backend names blocks, and a block
 * whose strokes are erased then restored by undo/redo comes back under a new name. No stroke means
 * a global variable.
 *
 * @group History
 */
export type TIIHistoryVariableChange = {
  strokeIds: string[]
  name: string
  before?: number
  after?: number
}

/**
 * @group History
 */
export type TIIHistoryChanges = {
  /**
   * Values set on the backend, which keeps them nowhere in the document: without this, undoing a
   * block away and redoing it back lost the value it had been given.
   */
  variables?: TIIHistoryVariableChange[]
  added?: TSymbol[]
  /**
   * A before/after pair, and the only way a change to an existing symbol is recorded.
   *
   * `matrix`/`translate`/`rotate`/`scale` and `style` used to sit alongside this, each describing a
   * change by its parameters — a delta, an angle, a colour — so undo could re-derive the old state
   * by applying an inverse. None is needed any more: a transform writes to `symbol.transform` and a
   * restyle to `symbol.style`, both part of the record, so the record *is* the state. Restoring it
   * is exact by construction, where inverting a parameter was arithmetic that could drift — and,
   * for a scale's `1 / scaleX`, could be `Infinity` or ignore the origin it was taken about.
   *
   * A list of pairs, not two parallel lists: `{ oldSymbols, newSymbols }` let the two fall out of
   * step, and a length mismatch silently paired the wrong symbols together on undo. Here the
   * pairing is the type.
   *
   * `before`/`after` rather than `old`/`new`: `new` reads as the operator wherever it appears, and
   * these two words are the ones the rest of this code already uses for a snapshot and its result.
   *
   * Several sources can contribute to a single undoable step — a transform records both the symbols
   * dragged and the connected edges recomputed from them — so append with {@link appendUpdated}
   * rather than assigning.
   */
  updated?: {
    before: TSymbol
    after: TSymbol
  }[]
  erased?: TSymbol[]
  replaced?: {
    oldSymbols: TSymbol[]
    newSymbols: TSymbol[]
  }
  order?: {
    symbols: TSymbol[]
    position: "first" | "last" | "forward" | "backward"
  }
}

/**
 * @group History
 * @remarks used to send messages to the backend on undo or redo
 */
export type TIIHistoryBackendChanges = {
  added?: TStroke[]
  erased?: TStroke[]
  replaced?: {
    oldStrokes: TStroke[]
    newStrokes: TStroke[]
  }
}

/**
 * Appends before/after pairs to `changes.updated`, creating the list if absent.
 *
 * Appending rather than assigning, because one undoable step can gather symbols from more than one
 * source: a transform records the symbols that were dragged *and* the connected edges recomputed
 * from their new position. Assigning `changes.updated` twice dropped the first set silently, which
 * is the mistake this exists to make impossible.
 *
 * @group History
 */
export function appendUpdated(changes: TIIHistoryChanges, pairs: { before: TSymbol; after: TSymbol }[]): void {
  if (!pairs.length) {
    return
  }
  ;(changes.updated ??= []).push(...pairs)
}

/**
 * @group History
 * @remarks converts symbol-level history changes into the stroke-level format the backend
 * understands, so undo/redo can be replayed as a fallback list of explicit modifications.
 */
export function extractIIBackendChanges(changes: TIIHistoryChanges): TIIHistoryBackendChanges {
  const backendChanges: TIIHistoryBackendChanges = {}
  backendChanges.added = extractStrokes(changes.added)
  backendChanges.erased = extractStrokes(changes.erased)

  const oldStrokes = extractStrokes(changes.updated?.map((pair) => pair.before)).concat(
    extractStrokes(changes.replaced?.oldSymbols)
  )
  const newStrokes = extractStrokes(changes.updated?.map((pair) => pair.after)).concat(
    extractStrokes(changes.replaced?.newSymbols)
  )
  if (oldStrokes.length && newStrokes.length) {
    backendChanges.replaced = {
      oldStrokes,
      newStrokes,
    }
  } else {
    backendChanges.added.push(...newStrokes)
    backendChanges.erased.push(...oldStrokes)
  }

  return backendChanges
}

/**
 * @group History
 */
export class IIHistoryManager extends AbstractDiffHistoryManager<TIIHistoryChanges> {
  #liveModel?: IIModel

  // context.empty must reflect whether the canvas is actually empty (ClearMenuAction disables
  // Clear based on it), not just "no changes recorded at this stack index" - so this reads the
  // live model instead of the generic isChangesEmpty-based default.
  protected isStackItemEmpty(): boolean {
    return (this.#liveModel?.symbolCount ?? 0) === 0
  }

  protected isChangesEmpty(changes: TIIHistoryChanges): boolean {
    return !(
      changes.added?.length ||
      changes.updated?.length ||
      changes.erased?.length ||
      changes.replaced?.oldSymbols.length ||
      changes.order?.symbols?.length ||
      changes.variables?.length
    )
  }

  init(model: IIModel): void {
    this.#liveModel = model
    this.initStack({})
  }

  protected reverseChanges(changes: TIIHistoryChanges): TIIHistoryChanges {
    const reversedChanges: TIIHistoryChanges = {}
    // Every symbol list is copied, not shared: the reversed entry is a separate entry, and two
    // entries holding the same array would change together if anything ever appended to one.
    // The symbols inside stay shared — they are values, never mutated in place.
    if (changes.added) {
      reversedChanges.erased = [...changes.added]
    }
    if (changes.erased) {
      reversedChanges.added = [...changes.erased]
    }
    if (changes.updated) {
      reversedChanges.updated = changes.updated.map((pair) => ({ before: pair.after, after: pair.before }))
    }
    if (changes.replaced) {
      reversedChanges.replaced = {
        newSymbols: [...changes.replaced.oldSymbols],
        oldSymbols: [...changes.replaced.newSymbols],
      }
    }
    if (changes.variables) {
      reversedChanges.variables = changes.variables.map((v) => ({ ...v, before: v.after, after: v.before }))
    }
    if (changes.order) {
      const positionMap: Record<string, "first" | "last" | "forward" | "backward"> = {
        first: "last",
        last: "first",
        forward: "backward",
        backward: "forward",
      }
      reversedChanges.order = {
        symbols: [...changes.order.symbols],
        position: positionMap[changes.order.position],
      }
    }

    return reversedChanges
  }
}
