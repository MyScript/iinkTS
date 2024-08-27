import { TUndoRedoConfiguration } from "../configuration"
import { InternalEvent } from "../event"
import { LoggerClass, LoggerManager } from "../logger"
import { OIModel } from "../model"
import { OIDecorator, OIStroke, TOISymbol } from "../primitive"
import { TStyle } from "../style"
import { MatrixTransform, TMatrixTransform } from "../transform"
import { IHistoryManager } from "./IHistoryManager"
import { TUndoRedoContext, getInitialUndoRedoContext } from "./UndoRedoContext"

/**
 * @group History
 */
export type TOIHistoryChanges = {
  added?: TOISymbol[]
  updated?: TOISymbol[]
  erased?: TOISymbol[]
  replaced?: { oldSymbols: TOISymbol[], newSymbols: TOISymbol[] }
  matrix?: { symbols: TOISymbol[], matrix: TMatrixTransform }
  translate?: { symbols: TOISymbol[], tx: number, ty: number }[]
  style?: { symbols: TOISymbol[], style?: TStyle, fontSize?: number }
  order?: { symbols: TOISymbol[], position: "first" | "last" | "forward" | "backward" }
  decorator?: { symbol: TOISymbol, decorator: OIDecorator, added: boolean }[]
  group?: { symbols: TOISymbol[] }
  ungroup?: { group: TOISymbol }
}

/**
 * @group History
 * @remarks used to send messages to the backend on undo or redo
 */
export type TOIHistoryBackendChanges = {
  added?: OIStroke[]
  erased?: OIStroke[]
  replaced?: { oldStrokes: OIStroke[], newStrokes: OIStroke[] }
  matrix?: { strokes: OIStroke[], matrix: TMatrixTransform },
  translate?: { strokes: OIStroke[], tx: number, ty: number }[]
}

/**
 * @group History
 */
export type TOIHistoryStackItem = {
  changes: TOIHistoryChanges
  model: OIModel
}

/**
 * @group History
 */
export class OIHistoryManager implements IHistoryManager
{
  #logger = LoggerManager.getLogger(LoggerClass.HISTORY)

  configuration: TUndoRedoConfiguration
  context: TUndoRedoContext
  stack: TOIHistoryStackItem[]

  constructor(configuration: TUndoRedoConfiguration)
  {
    this.#logger.info("constructor", { configuration })
    this.configuration = configuration
    this.context = getInitialUndoRedoContext()
    this.stack = []
  }

  get internalEvent(): InternalEvent
  {
    return InternalEvent.getInstance()
  }

  private updateContext(): void
  {
    this.context.canRedo = this.stack.length - 1 > this.context.stackIndex
    this.context.canUndo = this.context.stackIndex > 0
    this.context.empty = this.stack[this.context.stackIndex].model.symbols.length === 0
  }

  isChangesEmpty(changes: TOIHistoryChanges): boolean
  {
    return !(
      changes.added?.length ||
      changes.updated?.length ||
      changes.erased?.length ||
      changes.replaced?.oldSymbols.length ||
      changes.matrix?.symbols.length ||
      changes.translate?.length ||
      changes.style?.symbols?.length ||
      changes.order?.symbols?.length ||
      changes.decorator?.length ||
      changes.group?.symbols.length ||
      changes.ungroup?.group
    )
  }

  init(model: OIModel): void
  {
    this.stack.push({ model: model.clone(), changes: {} })
    this.internalEvent.emitContextChange(this.context)
  }

  push(model: OIModel, changes: TOIHistoryChanges): void
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
    this.internalEvent.emitContextChange(this.context)
  }

  pop(): void
  {
    this.#logger.info("pop")
    this.stack.pop()
    this.context.stackIndex = this.stack.length - 1
    this.updateContext()
  }

  protected reverseChanges(changes: TOIHistoryChanges): TOIHistoryChanges
  {
    const reversedChanges: TOIHistoryChanges = {}
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

    return reversedChanges
  }

  undo(): TOIHistoryStackItem
  {
    this.#logger.info("undo")
    const currentStackItem = this.stack[this.context.stackIndex]
    if (this.context.canUndo) {
      this.context.stackIndex--
      this.updateContext()
      this.internalEvent.emitContextChange(this.context)
    }
    const previousStackItem = this.stack[this.context.stackIndex]
    this.#logger.debug("undo", previousStackItem)
    return {
      model: previousStackItem.model,
      changes: this.reverseChanges(currentStackItem.changes)
    }
  }

  redo(): TOIHistoryStackItem
  {
    this.#logger.info("redo")
    if (this.context.canRedo) {
      this.context.stackIndex++
      this.updateContext()
      this.internalEvent.emitContextChange(this.context)
    }
    const nextStackItem = this.stack[this.context.stackIndex]
    this.#logger.debug("redo", nextStackItem)
    return nextStackItem
  }

  clear(): void
  {
    this.context = getInitialUndoRedoContext()
    this.stack = []
  }
}
