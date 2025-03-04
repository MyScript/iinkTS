import { EditorEvent } from "../editor/EditorEvent"
import { LoggerCategory, LoggerManager } from "../logger"
import { IModel } from "../model"
import { IIDecorator, IIStroke, TIISymbol, TPoint } from "../symbol"
import { TStyle } from "../style"
import { MatrixTransform, TMatrixTransform } from "../transform"
import { THistoryContext, getInitialHistoryContext } from "./HistoryContext"
import { PartialDeep } from "../utils"
import { THistoryConfiguration } from "./HistoryConfiguration"

/**
 * @group History
 */
export type TIHistoryChanges = {
  added?: TIISymbol[]
  updated?: TIISymbol[]
  erased?: TIISymbol[]
  replaced?: { oldSymbols: TIISymbol[], newSymbols: TIISymbol[] }
  matrix?: { symbols: TIISymbol[], matrix: TMatrixTransform }
  translate?: { symbols: TIISymbol[], tx: number, ty: number }[]
  scale?: { symbols: TIISymbol[], scaleX: number, scaleY: number, origin: TPoint }[]
  rotate?: { symbols: TIISymbol[], angle: number, center: TPoint }[]
  style?: { symbols: TIISymbol[], style?: PartialDeep<TStyle>, fontSize?: number }
  order?: { symbols: TIISymbol[], position: "first" | "last" | "forward" | "backward" }
  decorator?: { symbol: TIISymbol, decorator: IIDecorator, added: boolean }[]
  group?: { symbols: TIISymbol[] }
  ungroup?: { group: TIISymbol }
}

/**
 * @group History
 * @remarks used to send messages to the backend on undo or redo
 */
export type TIHistoryBackendChanges = {
  added?: IIStroke[]
  erased?: IIStroke[]
  replaced?: { oldStrokes: IIStroke[], newStrokes: IIStroke[] }
  matrix?: { strokes: IIStroke[], matrix: TMatrixTransform },
  translate?: { strokes: IIStroke[], tx: number, ty: number }[]
  scale?: { strokes: IIStroke[], scaleX: number, scaleY: number, origin: TPoint }[]
  rotate?: { strokes: IIStroke[], angle: number, center: TPoint }[]
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
export class IHistoryManager
{
  #logger = LoggerManager.getLogger(LoggerCategory.HISTORY)

  configuration: THistoryConfiguration
  event: EditorEvent
  context: THistoryContext
  stack: TIHistoryStackItem[]

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
    this.context.empty = this.stack[this.context.stackIndex].model.symbols.length === 0
  }

  isChangesEmpty(changes: TIHistoryChanges): boolean
  {
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
      changes.decorator?.length ||
      changes.group?.symbols.length ||
      changes.ungroup?.group
    )
  }

  init(model: IModel): void
  {
    this.stack.push({ model: model.clone(), changes: {} })
    this.event.emitChanged(this.context)
  }

  push(model: IModel, changes: TIHistoryChanges): void
  {
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

  update(model: IModel): void
  {
    this.#logger.info("pop")
    const stackIdx = this.stack.findIndex(s => s.model.modificationDate === model.modificationDate)
    if (stackIdx > -1) {
      this.stack[stackIdx].model = model
      this.updateContext()
    }
  }

  pop(): void
  {
    this.#logger.info("pop")
    this.stack.pop()
    this.context.stackIndex = this.stack.length - 1
    this.updateContext()
  }

  protected reverseChanges(changes: TIHistoryChanges): TIHistoryChanges
  {
    const reversedChanges: TIHistoryChanges = {}
    if (changes.added) {
      reversedChanges.erased = changes.added
    }
    if (changes.erased) {
      reversedChanges.added = changes.erased
    }
    if (changes.replaced) {
      reversedChanges.replaced = {
        newSymbols: changes.replaced.oldSymbols,
        oldSymbols: changes.replaced.newSymbols
      }
    }
    if (changes.matrix) {
      reversedChanges.matrix = {
        symbols: changes.matrix.symbols,
        matrix: new MatrixTransform(changes.matrix.matrix.xx, changes.matrix.matrix.yx, changes.matrix.matrix.xy, changes.matrix.matrix.yy, changes.matrix.matrix.tx, changes.matrix.matrix.ty).invert()
      }
    }
    if (changes.translate?.length) {
      reversedChanges.translate = changes.translate.map(tr =>
      {
        return {
          symbols: tr.symbols,
          tx: -tr.tx,
          ty: -tr.ty,
        }
      })
    }
    if (changes.rotate?.length) {
      reversedChanges.rotate = changes.rotate.map(tr =>
      {
        return {
          symbols: tr.symbols,
          angle: 2 * Math.PI - tr.angle,
          center: tr.center
        }
      })
    }
    if (changes.scale?.length) {
      reversedChanges.scale = changes.scale.map(tr =>
      {
        return {
          symbols: tr.symbols,
          origin: tr.origin,
          scaleX: 1 / tr.scaleX,
          scaleY: 1 / tr.scaleY
        }
      })
    }

    return reversedChanges
  }

  undo(): TIHistoryStackItem
  {
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

  redo(): TIHistoryStackItem
  {
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

  clear(): void
  {
    this.context = getInitialHistoryContext()
    this.stack = []
  }
}