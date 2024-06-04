import { LoggerClass } from "../Constants"
import { TUndoRedoConfiguration } from "../configuration"
import { InternalEvent } from "../event"
import { LoggerManager } from "../logger"
import { OIModel } from "../model"
import { OIDecorator, TSymbol } from "../primitive"
import { TStyle } from "../style"
import { MatrixTransform, TMatrixTransform } from "../transform"
import { IHistoryManager } from "./IHistoryManager"
import { TUndoRedoContext, getInitialUndoRedoContext } from "./UndoRedoContext"

/**
 * @group History
 */
export type TOIActionsTransform = {
  transformationType: "TRANSLATE" | "MATRIX" | "STYLE" | "DECORATOR"
  symbols: TSymbol[]
}

/**
 * @group History
 */
export type TOIActionsTransformStyle = TOIActionsTransform & {
  transformationType: "STYLE"
  style?: TStyle
  fontSize?: number
}

/**
 * @group History
 */
export type TOIActionsTransformDecorator = TOIActionsTransform & {
  transformationType: "DECORATOR"
  decorators: OIDecorator[]
}

/**
 * @group History
 */
export type TOIActionsTransformTranslate = TOIActionsTransform & {
  transformationType: "TRANSLATE"
  tx: number
  ty: number
}

/**
 * @group History
 */
export type TOIActionsTransformMatrix = TOIActionsTransform & {
  transformationType: "MATRIX"
  matrix: TMatrixTransform
}

/**
 * @group History
 * @remarks actions are messages sent to the backend
 */
export type TOIActions = {
  added?: TSymbol[]
  replaced?: { oldSymbols: TSymbol[], newSymbols: TSymbol[]}
  erased?: TSymbol[]
  transformed?: (TOIActionsTransformTranslate | TOIActionsTransformMatrix | TOIActionsTransformStyle | TOIActionsTransformDecorator)[]
}

/**
 * @group History
 */
export type TOIHistoryStackItem = {
  actions: TOIActions
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
    this.context.empty = this.stack[this.context.stackIndex]?.model.symbols.length === 0
  }

  push(model: OIModel, actions: TOIActions): void
  {
    this.#logger.info("push", { model, actions })
    if (this.context.stackIndex + 1 < this.stack.length) {
      this.stack.splice(this.context.stackIndex + 1)
    }

    this.stack.push({model: model.clone(), actions})
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
    if (this.context.stackIndex === this.stack.length - 1) {
      this.context.stackIndex--
    }
    this.stack.pop()
    this.updateContext()
  }

  updateStack(model: OIModel): void
  {
    this.#logger.info("updateStack", { model })
    const index = this.stack.findIndex(m => m.model.modificationDate === model.modificationDate)
    if (index > -1 && this.stack[index]) {
      this.stack[index].model = model.clone()
    }
    this.updateContext()
    this.internalEvent.emitContextChange(this.context)
  }

  inverteActions(actions: TOIActions): TOIActions
  {
    const invertedActions: TOIActions = {}
    if (actions.added) {
      invertedActions.erased = actions.added
    }
    if (actions.erased) {
      invertedActions.added = actions.erased
    }
    if (actions.replaced) {
      invertedActions.replaced = {
        newSymbols: actions.replaced.oldSymbols,
        oldSymbols: actions.replaced.newSymbols,
      }
    }
    if (actions.transformed?.length) {
      invertedActions.transformed = []
      actions.transformed.forEach(a => {
        switch (a.transformationType) {
          case "TRANSLATE":
            invertedActions.transformed?.push({
              transformationType: a.transformationType,
              symbols: a.symbols,
              tx: -a.tx,
              ty: -a.ty,
            })
            break
          case "MATRIX":
            invertedActions.transformed?.push({
              transformationType: a.transformationType,
              symbols: a.symbols,
              matrix: new MatrixTransform(a.matrix.xx, a.matrix.yx, a.matrix.xy, a.matrix.yy, a.matrix.tx, a.matrix.ty).invert()
            })
            break
        }
      })
    }

    return invertedActions
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
      actions: this.inverteActions(currentStackItem.actions)
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
}
