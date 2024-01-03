import { LoggerClass,  } from "../Constants"
import { OIBehaviors } from "../behaviors"
import { LoggerManager } from "../logger"
import { OIModel } from "../model"
import { OIDecoratorHighlight, OIDecoratorSurround, OIStroke, OIDecoratorStrikethrough, OIDecoratorUnderline } from "../primitive"
import { OIRecognizer } from "../recognizer"
import { OISVGRenderer } from "../renderer"
import { TStyle } from "../style"
import { UndoRedoManager } from "../undo-redo"
import { TGesture, StrikeThroughAction, SurroundAction } from "./Gesture"

const SPACE_BETWEEN_STROKE = 50

/**
 * @group Gesture
 */
export class OIGestureManager
{
  #logger = LoggerManager.getLogger(LoggerClass.GESTURE)

  surroundAction: SurroundAction = SurroundAction.Select
  strikeThroughAction: StrikeThroughAction = StrikeThroughAction.Draw
  behaviors: OIBehaviors

  constructor(behaviors: OIBehaviors)
  {
    this.#logger.info("constructor")
    this.behaviors = behaviors
  }

  get renderer(): OISVGRenderer
  {
    return this.behaviors.renderer
  }

  get recognizer(): OIRecognizer
  {
    return this.behaviors.recognizer
  }

  get model(): OIModel
  {
    return this.behaviors.model
  }

  get undoRedoManager(): UndoRedoManager
  {
    return this.behaviors.undoRedoManager
  }

  get currentStyle(): TStyle
  {
    return this.behaviors.styleManager.currentPenStyle
  }

  get rowHeight(): number
  {
    return this.behaviors.configuration.rendering.guides.gap
  }

  async applySurroundGesture(gesture: TGesture): Promise<void>
  {
    this.#logger.info("applySurroundGesture", { gesture })
    if (!gesture.strokeIds.length) {
      this.#logger.warn("applySurroundGesture", "Unable to apply surround because there are no strokes")
      return
    }
    switch (this.surroundAction) {
      case SurroundAction.Select: {
        gesture.strokeIds.forEach(id =>
        {
          this.model.selectSymbol(id)
        })
        this.behaviors.renderer.drawSelectedGroup(this.model.selection)
        this.behaviors.internalEvent.emitSelected(this.model.selection)
        break
      }
      case SurroundAction.Highlight: {
        const symbolsToHightlight = this.model.symbols.filter(s => gesture.strokeIds.includes(s.id)) as OIStroke[]
        const highlight = new OIDecoratorHighlight(this.currentStyle, symbolsToHightlight)
        this.renderer.drawSymbol(highlight)
        this.model.addSymbol(highlight)
        symbolsToHightlight.forEach(s =>
        {
          s.decorators.push(highlight)
          this.model.updateSymbol(s)
        })
        this.undoRedoManager.addModelToStack(this.model)
        break
      }
      case SurroundAction.Surround: {
        const symbolsToSurround = this.model.symbols.filter(s => gesture.strokeIds.includes(s.id)) as OIStroke[]
        const surround = new OIDecoratorSurround(this.currentStyle, symbolsToSurround)
        this.renderer.drawSymbol(surround)
        this.model.addSymbol(surround)
        symbolsToSurround.forEach(s =>
        {
          s.decorators.push(surround)
          this.model.updateSymbol(s)
        })
        this.undoRedoManager.addModelToStack(this.model)
        break
      }
      default:
        this.#logger.warn("applySurroundGesture", `Unknow surroundAction: ${ this.surroundAction }, values allowed are: ${ SurroundAction.Highlight }, ${ SurroundAction.Select }, ${ SurroundAction.Surround }`)
        break
    }
    return
  }

  async applyScratchGesture(gesture: TGesture): Promise<void>
  {
    this.#logger.debug("applyScratchGesture", { gesture })
    if (!gesture.strokeIds.length) {
      this.#logger.warn("applyScratchGesture", "Unable to apply underline because there are no strokes")
      return
    }
    this.undoRedoManager.addModelToStack(this.model)
    gesture.strokeIds.forEach(id => this.model.removeSymbol(id).forEach(idDelete => this.renderer.removeSymbol(idDelete)))
    this.model.updatePositionSent()
    await this.recognizer.eraseStrokes(gesture.strokeIds)
    this.model.updatePositionReceived()
    this.undoRedoManager.updateModelInStack(this.model)
  }

  async applyJoinGesture(gesture: TGesture): Promise<void>
  {
    this.#logger.debug("applyJoinGesture", { gesture })
    const promises: Promise<void>[] = []
    const result: { strokes: OIStroke[], tx: number, ty: number }[] = []
    const strokesBefore = this.model.symbols.filter(s => gesture.strokeBeforeIds.includes(s.id)) as OIStroke[]
    const strokesAfter = this.model.symbols.filter(s => gesture.strokeAfterIds.includes(s.id)) as OIStroke[]
    if (gesture.strokeBeforeIds.length && strokesAfter.length) {
      const lastXBefore = Math.max(...strokesBefore.map(s => s.boundingBox.xMax))
      const firstXAfter = Math.min(...strokesAfter.map(s => s.boundingBox.xMin))

      const translateX = firstXAfter - lastXBefore
      if (translateX !== 0) {
        const joinStrokes: { strokes: OIStroke[], tx: number, ty: number } = { strokes: [], tx: -translateX, ty: 0 }
        strokesAfter.forEach(s =>
        {
          s.pointers.forEach(p => p.x -= translateX)
          this.model.updateSymbol(s)
          joinStrokes.strokes.push(s)
        })
        result.push(joinStrokes)
      }
    }
    else if (strokesAfter.length) {
      const strokesToGoOnPreviousRow: { strokes: OIStroke[], tx: number, ty: number } = { strokes: [], tx: 0, ty: -this.rowHeight }
      const xMin = Math.min(...strokesAfter.map(s => s.boundingBox.xMin))
      const yMin = Math.min(...strokesAfter.map(s => s.boundingBox.yMin))
      const symbolsHigher = this.model.getSymbolsHigher(yMin)
      if (symbolsHigher.length) {
        const lastSymbolBefore = symbolsHigher.reduce((s1, s2) => s1.boundingBox.x < s2.boundingBox.x ? s1 : s2)
        const lastXBefore = lastSymbolBefore.boundingBox.x + lastSymbolBefore.boundingBox.width
        const strokesToGoOnPreviousRowWithStrokes: { strokes: OIStroke[], tx: number, ty: number } = { strokes: [], tx: lastXBefore + SPACE_BETWEEN_STROKE - xMin, ty: -this.rowHeight }
        strokesAfter.forEach(s =>
        {
          s.pointers.forEach(p => {
            p.x += strokesToGoOnPreviousRowWithStrokes.tx
            p.y += strokesToGoOnPreviousRowWithStrokes.ty
          })
          this.model.updateSymbol(s)
          strokesToGoOnPreviousRowWithStrokes.strokes.push(s)
        })
        result.push(strokesToGoOnPreviousRow)
      }
      else {
        strokesAfter.forEach(s =>
        {
          s.pointers.forEach(p => {
            p.x += strokesToGoOnPreviousRow.tx
            p.y += strokesToGoOnPreviousRow.ty
          })
          this.model.updateSymbol(s)
          strokesToGoOnPreviousRow.strokes.push(s)
        })
        result.push(strokesToGoOnPreviousRow)
      }
    }

    if (result.length) {
      this.model.updatePositionSent()
      this.undoRedoManager.addModelToStack(this.model)
      result.forEach(r =>
      {
        r.strokes.forEach(s => this.renderer.drawSymbol(s))
        promises.push(this.recognizer.translateStrokes(r.strokes.map(s => s.id), r.tx, r.ty))
      })
      this.model.updatePositionReceived()
      await Promise.all(promises)
      this.undoRedoManager.updateModelInStack(this.model)
    }
  }

  async applyInsertGesture(gesture: TGesture): Promise<void>
  {
    this.#logger.debug("applyInsertGesture", { gesture })
    if (!gesture.strokeIds.length) {
      this.#logger.warn("applyInsertGesture", "Unable to apply underline because there are no strokes")
      return
    }
    const promises: Promise<void>[] = []

    const result: { newStrokes: OIStroke[], deletedStrokeIds: string[], translations: { strokes: OIStroke[], tx: number, ty: number }[] } = { newStrokes: [], deletedStrokeIds: [], translations: [] }

    const strokesAfter = this.model.symbols.filter(s => gesture.strokeAfterIds.includes(s.id)) as OIStroke[]

    if (gesture.strokeIds.length) {
      if (gesture.subStrokes?.length) {
        const strokesToSplit = this.model.symbols.filter(s => gesture.strokeIds.includes(s.id)) as OIStroke[]
        const intersectPoint = {
          x: gesture.subStrokes[0].x.at(-1) as number,
          y: gesture.subStrokes[0].y.at(-1) as number
        }
        strokesToSplit.forEach((ss) =>
        {
          const indexToSplit = ss.pointers.findIndex(p => Math.abs(p.x - intersectPoint.x) < 10 && Math.abs(p.y - intersectPoint.y) < 10)
          if (indexToSplit > -1) {
            const newStrokes = this.model.splitStroke(ss, indexToSplit)
            newStrokes.after.pointers.forEach(p => p.x += SPACE_BETWEEN_STROKE)
            this.model.updateSymbol(newStrokes.after)

            result.deletedStrokeIds.push(ss.id)

            result.newStrokes.push(newStrokes.before)
            result.newStrokes.push(newStrokes.after)
          }
        })
        if (strokesAfter.length) {
          const translationInRow: { strokes: OIStroke[], tx: number, ty: number } = { strokes: [], tx: SPACE_BETWEEN_STROKE, ty: 0 }
          strokesAfter.forEach(s =>
          {
            s.pointers.forEach(p => p.x += translationInRow.tx)
            translationInRow.strokes.push(s)
            this.model.updateSymbol(s)
          })
          if (translationInRow.strokes.length) {
            result.translations.push(translationInRow)
          }
        }
      }
    }

    if (result.deletedStrokeIds.length || result.newStrokes.length || result.translations.length) {
      this.model.updatePositionSent()
      this.undoRedoManager.addModelToStack(this.model)
      if (result.deletedStrokeIds.length) {
        result.deletedStrokeIds.forEach(id => this.renderer.removeSymbol(id))
        promises.push(this.recognizer.eraseStrokes(result.deletedStrokeIds))
      }
      if (result.newStrokes.length) {
        result.newStrokes.forEach(s => this.renderer.drawSymbol(s))
        promises.push(this.recognizer.addStrokes(result.newStrokes, false) as Promise<void>)
      }
      if (result.translations.length) {
        result.translations.forEach(t =>
        {
          t.strokes.forEach(s => this.renderer.drawSymbol(s))
          promises.push(this.recognizer.translateStrokes(t.strokes.map(s => s.id), t.tx, t.ty))
        })
      }
      this.model.updatePositionReceived()
      await Promise.all(promises)
      this.undoRedoManager.updateModelInStack(this.model)
    }
  }

  async applyUnderlineGesture(gesture: TGesture): Promise<void>
  {
    this.#logger.debug("applyUnderlineGesture", { gesture })
    if (!gesture.strokeIds.length) {
      this.#logger.warn("applyUnderlineGesture", "Unable to apply underline because there are no strokes")
      return
    }
    const symbolsToUnderline = this.model.symbols.filter(s => gesture.strokeIds.includes(s.id)) as OIStroke[]
    const underline = new OIDecoratorUnderline(this.currentStyle, symbolsToUnderline)
    this.renderer.drawSymbol(underline)
    this.model.addSymbol(underline)
    symbolsToUnderline.forEach(s =>
    {
      s.decorators.push(underline)
      this.model.updateSymbol(s)
    })
    this.undoRedoManager.addModelToStack(this.model)
  }

  async applyStrikeThroughGesture(gesture: TGesture): Promise<void>
  {
    this.#logger.debug("applyStrikeThroughGesture", { gesture })
    if (!gesture.strokeIds.length) {
      this.#logger.warn("applyStrikeThroughGesture", "Unable to apply strikethrough because there are no strokes")
      return
    }
    switch (this.strikeThroughAction) {
      case StrikeThroughAction.Draw: {
        const symbolsToStrikethrough = this.model.symbols.filter(s => gesture.strokeIds.includes(s.id)) as OIStroke[]
        const strikethrough = new OIDecoratorStrikethrough(this.currentStyle, symbolsToStrikethrough)
        this.renderer.drawSymbol(strikethrough)
        this.model.addSymbol(strikethrough)
        symbolsToStrikethrough.forEach(s =>
        {
          s.decorators.push(strikethrough)
          this.model.updateSymbol(s)
        })
        this.undoRedoManager.addModelToStack(this.model)
        break
      }
      case StrikeThroughAction.Erase: {
        this.model.updatePositionSent()
        gesture.strokeIds.forEach(id =>
        {
          this.model.removeSymbol(id)
            .forEach(idDelete => this.renderer.removeSymbol(idDelete))
        })
        await this.recognizer.eraseStrokes(gesture.strokeIds)
        this.model.updatePositionReceived()
        this.undoRedoManager.addModelToStack(this.model)
        break
      }
      default:
        this.#logger.warn("#applyStrikeThroughGesture", `Unknow OnStrikeThrough: ${ this.strikeThroughAction }, values allowed are: ${ StrikeThroughAction.Draw }, ${ StrikeThroughAction.Erase }`)
        break
    }
  }

  async apply(gesture?: TGesture): Promise<void>
  {
    this.#logger.info("apply", { gesture })
    if (gesture) {
      this.model.positions.lastSentPosition--
      this.model.positions.lastReceivedPosition--
      this.model.removeSymbol(gesture.gestureStrokeId)
      this.renderer.removeSymbol(gesture.gestureStrokeId)
      this.undoRedoManager.removeLastModelInStack()
      switch (gesture.gestureType) {
        case "UNDERLINE":
          return this.applyUnderlineGesture(gesture)
        case "SCRATCH":
          return this.applyScratchGesture(gesture)
        case "JOIN":
          return this.applyJoinGesture(gesture)
        case "INSERT":
          return this.applyInsertGesture(gesture)
        case "STRIKETHROUGH":
          return this.applyStrikeThroughGesture(gesture)
        case "SURROUND":
          return this.applySurroundGesture(gesture)
        default:
          this.#logger.warn("apply", `Gesture unknow: ${ gesture.gestureType }`)
          break
      }
    }
    return Promise.resolve()
  }
}
