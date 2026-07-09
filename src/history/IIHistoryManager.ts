import type { IIModel } from "@/model"
import type { TStyle } from "@/style"
import type { TPoint, TStroke, TSymbol } from "@/symbol"
import { extractStrokes } from "@/symbol"
import type { TMatrixTransform } from "@/transform"
import { MatrixTransform } from "@/transform"
import type { TPartialDeep } from "@/utils"

import { AbstractHistoryStack } from "./AbstractHistoryStack"

/**
 * @group History
 */
export type TIIHistoryChanges = {
  added?: TSymbol[]
  updated?: TSymbol[]
  erased?: TSymbol[]
  replaced?: {
    oldSymbols: TSymbol[]
    newSymbols: TSymbol[]
  }
  matrix?: {
    symbols: TSymbol[]
    matrix: TMatrixTransform
  }
  translate?: {
    symbols: TSymbol[]
    tx: number
    ty: number
  }[]
  scale?: {
    symbols: TSymbol[]
    scaleX: number
    scaleY: number
    origin: TPoint
  }[]
  rotate?: {
    symbols: TSymbol[]
    angle: number
    center: TPoint
  }[]
  style?: {
    symbols: TSymbol[]
    style?: TPartialDeep<TStyle>
    fontSize?: number
  }
  order?: {
    symbols: TSymbol[]
    position: "first" | "last" | "forward" | "backward"
  }
  group?: { symbols: TSymbol[] }
  ungroup?: { group: TSymbol }
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
  matrix?: {
    strokes: TStroke[]
    matrix: TMatrixTransform
  }
  translate?: {
    strokes: TStroke[]
    tx: number
    ty: number
  }[]
  scale?: {
    strokes: TStroke[]
    scaleX: number
    scaleY: number
    origin: TPoint
  }[]
  rotate?: {
    strokes: TStroke[]
    angle: number
    center: TPoint
  }[]
}

/**
 * @group History
 */
export type TIIHistoryStackItem = {
  changes: TIIHistoryChanges
  model: IIModel
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

  const updated = extractStrokes(changes.updated)

  const oldStrokes = updated.concat(extractStrokes(changes.replaced?.oldSymbols))
  const newStrokes = updated.concat(extractStrokes(changes.replaced?.newSymbols))
  if (oldStrokes.length && newStrokes.length) {
    backendChanges.replaced = {
      oldStrokes,
      newStrokes,
    }
  } else {
    backendChanges.added.push(...newStrokes)
    backendChanges.erased.push(...oldStrokes)
  }

  if (changes.matrix) {
    backendChanges.matrix = {
      strokes: extractStrokes(changes.matrix.symbols),
      matrix: changes.matrix.matrix,
    }
  }

  if (changes.translate?.length) {
    backendChanges.translate = []
    changes.translate.forEach((tr) => {
      const strokes = extractStrokes(tr.symbols)
      if (strokes.length) {
        backendChanges.translate!.push({
          strokes,
          tx: tr.tx,
          ty: tr.ty,
        })
      }
    })
  }
  if (changes.scale?.length) {
    backendChanges.scale = []
    changes.scale.forEach((tr) => {
      const strokes = extractStrokes(tr.symbols)
      if (strokes.length) {
        backendChanges.scale!.push({
          strokes,
          origin: tr.origin,
          scaleX: tr.scaleX,
          scaleY: tr.scaleY,
        })
      }
    })
  }
  if (changes.rotate?.length) {
    backendChanges.rotate = []
    changes.rotate.forEach((tr) => {
      const strokes = extractStrokes(tr.symbols)
      if (strokes.length) {
        backendChanges.rotate!.push({
          strokes,
          center: tr.center,
          angle: tr.angle,
        })
      }
    })
  }
  return backendChanges
}

/**
 * @group History
 */
export class IIHistoryManager extends AbstractHistoryStack<TIIHistoryStackItem> {
  protected isStackItemEmpty(item: TIIHistoryStackItem): boolean {
    return item.model.symbols.length === 0
  }

  isChangesEmpty(changes: TIIHistoryChanges): boolean {
    return !(
      changes.added?.length ||
      changes.updated?.length ||
      changes.erased?.length ||
      changes.replaced?.oldSymbols.length ||
      changes.matrix?.symbols.length ||
      changes.translate?.length ||
      changes.rotate?.length ||
      changes.scale?.length ||
      changes.style?.symbols?.length ||
      changes.order?.symbols?.length ||
      changes.group?.symbols.length ||
      changes.ungroup?.group
    )
  }

  init(model: IIModel): void {
    this.initStack({
      model: model.clone(),
      changes: {},
    })
  }

  push(model: IIModel, changes: TIIHistoryChanges): void {
    this.logger.info("push", { model, changes })
    if (this.isChangesEmpty(changes)) {
      return
    }
    this.pushToStack({
      model: model.clone(),
      changes,
    })
  }

  update(model: IIModel): void {
    this.logger.info("update", { model })
    const stackIdx = this.stack.findIndex((s) => s.model.modificationDate === model.modificationDate)
    if (stackIdx > -1) {
      this.stack[stackIdx].model = model
      this.updateContext()
    }
  }

  protected reverseChanges(changes: TIIHistoryChanges): TIIHistoryChanges {
    const reversedChanges: TIIHistoryChanges = {}
    if (changes.added) {
      reversedChanges.erased = changes.added
    }
    if (changes.erased) {
      reversedChanges.added = changes.erased
    }
    if (changes.updated) {
      reversedChanges.updated = changes.updated
    }
    if (changes.replaced) {
      reversedChanges.replaced = {
        newSymbols: changes.replaced.oldSymbols,
        oldSymbols: changes.replaced.newSymbols,
      }
    }
    if (changes.matrix) {
      reversedChanges.matrix = {
        symbols: changes.matrix.symbols,
        matrix: new MatrixTransform(
          changes.matrix.matrix.xx,
          changes.matrix.matrix.yx,
          changes.matrix.matrix.xy,
          changes.matrix.matrix.yy,
          changes.matrix.matrix.tx,
          changes.matrix.matrix.ty
        ).invert(),
      }
    }
    if (changes.translate?.length) {
      reversedChanges.translate = changes.translate.map((tr) => {
        return {
          symbols: tr.symbols,
          tx: -tr.tx,
          ty: -tr.ty,
        }
      })
    }
    if (changes.rotate?.length) {
      reversedChanges.rotate = changes.rotate.map((tr) => {
        return {
          symbols: tr.symbols,
          angle: -tr.angle,
          center: tr.center,
        }
      })
    }
    if (changes.scale?.length) {
      reversedChanges.scale = changes.scale.map((tr) => {
        return {
          symbols: tr.symbols,
          origin: tr.origin,
          scaleX: 1 / tr.scaleX,
          scaleY: 1 / tr.scaleY,
        }
      })
    }
    if (changes.style) {
      reversedChanges.style = changes.style
    }
    if (changes.order) {
      const positionMap: Record<string, "first" | "last" | "forward" | "backward"> = {
        first: "last",
        last: "first",
        forward: "backward",
        backward: "forward",
      }
      reversedChanges.order = {
        symbols: changes.order.symbols,
        position: positionMap[changes.order.position],
      }
    }

    return reversedChanges
  }

  undo(): TIIHistoryStackItem {
    this.logger.info("undo")
    const currentStackItem = this.stack[this.context.stackIndex]
    this.moveStackIndex(-1, this.context.canUndo)
    const previousStackItem = this.stack[this.context.stackIndex]
    this.logger.debug("undo", previousStackItem)
    const changes = this.reverseChanges(currentStackItem.changes)
    if (currentStackItem.changes.updated?.length) {
      changes.updated = currentStackItem.changes.updated
        .map((sym) => previousStackItem.model.symbols.find((s) => s.id === sym.id))
        .filter((s): s is TSymbol => s !== undefined)
    }
    return {
      model: previousStackItem.model,
      changes,
    }
  }

  redo(): TIIHistoryStackItem {
    this.logger.info("redo")
    this.moveStackIndex(1, this.context.canRedo)
    const nextStackItem = this.stack[this.context.stackIndex]
    this.logger.debug("redo", nextStackItem)
    return nextStackItem
  }
}
