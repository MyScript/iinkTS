import { LoggerClass } from "../Constants"
import { OIBehaviors } from "../behaviors"
import { LoggerManager } from "../logger"
import { OIModel } from "../model"
import
{
  OIDecoratorHighlight,
  OIDecoratorSurround,
  OIStroke,
  OIDecoratorStrikethrough,
  OIDecoratorUnderline,
  SymbolType,
  TOISymbolDecorable,
  OIText,
} from "../primitive"
import { OIRecognizer } from "../recognizer"
import { OISVGRenderer } from "../renderer"
import { TStyle } from "../style"
import { UndoRedoManager } from "../undo-redo"
import { getClosestPoints, isBetween } from "../utils"
import { TGesture, StrikeThroughAction, SurroundAction } from "../gesture"
import { OITranslateManager } from "./OITranslateManager"
import { OISelectionManager } from "./OISelectionManager"
import { OITextManager } from "./OITextManager"

const SPACE_BETWEEN_STROKE = 50

/**
 * @group Manager
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

  get translateManager(): OITranslateManager
  {
    return this.behaviors.translateManager
  }

  get textManager(): OITextManager
  {
    return this.behaviors.textManager
  }

  get model(): OIModel
  {
    return this.behaviors.model
  }

  get undoRedoManager(): UndoRedoManager
  {
    return this.behaviors.undoRedoManager
  }

  get selector(): OISelectionManager
  {
    return this.behaviors.selector
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
        // TODO wait editor intention menu
        // this.behaviors.internalEvent.emitIntention(Intention.Select)
        gesture.strokeIds.forEach(id =>
        {
          this.model.selectSymbol(id)
        })
        this.selector.drawSelectedGroup(this.model.symbolsSelected)
        this.behaviors.internalEvent.emitSelected(this.model.symbolsSelected)
        break
      }
      case SurroundAction.Highlight: {
        const symbolsToHightlight = this.model.symbols.filter(s => gesture.strokeIds.includes(s.id)) as OIStroke[]
        const highlight = new OIDecoratorHighlight(this.currentStyle, symbolsToHightlight)
        this.model.addSymbol(highlight)
        symbolsToHightlight.forEach(s =>
        {
          s.decorators.push(highlight)
          this.model.updateSymbol(s)
          this.renderer.drawSymbol(s)
        })
        this.undoRedoManager.addModelToStack(this.model)
        break
      }
      case SurroundAction.Surround: {
        const symbolsToSurround = this.model.symbols.filter(s => gesture.strokeIds.includes(s.id)) as OIStroke[]
        const surround = new OIDecoratorSurround(this.currentStyle, symbolsToSurround)
        this.model.addSymbol(surround)
        symbolsToSurround.forEach(s =>
        {
          s.decorators.push(surround)
          this.model.updateSymbol(s)
          this.renderer.drawSymbol(s)
        })
        break
      }
      default:
        this.#logger.error("applySurroundGesture", `Unknow surroundAction: ${ this.surroundAction }, values allowed are: ${ SurroundAction.Highlight }, ${ SurroundAction.Select }, ${ SurroundAction.Surround }`)
        break
    }
    return
  }

  async applyScratchGesture(gestureStroke: OIStroke, gesture: TGesture): Promise<void>
  {
    this.#logger.debug("applyScratchGesture", { gesture })
    if (!gesture.strokeIds.length) {
      this.#logger.warn("applyScratchGesture", "Unable to apply underline because there are no strokes")
      return
    }
    const textToErase = this.model.symbols.filter(s => s.type === SymbolType.Text && gesture.strokeIds.includes(s.id)) as OIText[]
    if (textToErase.length) {
      textToErase.forEach(te =>
      {
        te.chars = te.chars.filter(c => !gestureStroke.boundingBox.overlaps(c.boundingBox))
        if (te.chars.length) {
          this.model.updateSymbol(te)
          this.renderer.drawSymbol(te)
        }
        else {
          this.renderer.removeSymbol(te.id)
          this.model.removeSymbol(te.id)
        }
      })
      this.textManager.adjustText()
    }
    const strokesToErase = this.model.symbols.filter(s => s.type === SymbolType.Stroke && gesture.strokeIds.includes(s.id)) as OIStroke[]
    if (strokesToErase.length) {
      const promises: Promise<void>[] = []
      const strokeIdsToErase: string[] = strokesToErase.map(s => s.id)
      strokesToErase.forEach(sd =>
      {
        const partPointersToRemove = gesture.subStrokes?.find(ss => ss.fullStrokeId === sd.id)
        if (partPointersToRemove) {
          const strokePartToErase = new OIStroke({}, 1, "eraser")
          partPointersToRemove.x.forEach((x, i) =>
          {
            strokePartToErase.addPointer({ x, y: partPointersToRemove.y[i], p: 1, t: 1 })
          })
          const result = OIStroke.substract(sd, strokePartToErase)
          const newStrokes: OIStroke[] = []
          if (result.before) {
            newStrokes.push(result.before)
          }
          if (result.after) {
            newStrokes.push(result.after)
          }
          if (newStrokes.length) {
            strokeIdsToErase.splice(strokeIdsToErase.findIndex(id => id === sd.id), 1)
            promises.push(this.recognizer.replaceStrokes([sd.id], newStrokes))

            sd.decorators.forEach(d => this.renderer.removeSymbol(d.id))
            this.model.replaceSymbol(sd.id, newStrokes)
            this.renderer.replaceSymbol(sd.id, newStrokes)
          }
        }
      })
      strokeIdsToErase.forEach(id => this.model.removeSymbol(id).forEach(idDelete => this.renderer.removeSymbol(idDelete)))
      if (strokeIdsToErase.length) {
        promises.push(this.recognizer.eraseStrokes(strokeIdsToErase))
      }
      await Promise.all(promises)
    }
    this.model.updatePositionSent()
    this.model.updatePositionReceived()
    this.undoRedoManager.addModelToStack(this.model)
  }

  async applyJoinGesture(gestureStroke: OIStroke): Promise<void>
  {
    this.#logger.debug("applyJoinGesture", { gestureStroke })
    const promises: Promise<void>[] = []
    const currentRowIndex = this.model.getSymbolRowIndex(gestureStroke)
    const rows = this.model.getSymbolsByRowOrdered()
    const previousRow = rows.find(r => r.index === currentRowIndex - 1)
    const currentRow = rows.find(r => r.index === currentRowIndex)
    const nextRows = rows.filter(r => r.index > currentRowIndex)
    const symbolsBeforeInCurrentRow = currentRow?.symbols.filter(s => s.boundingBox.xMiddle < gestureStroke.boundingBox.xMiddle)
    const symbolsAfterInCurrentRow = currentRow?.symbols.filter(s => s.boundingBox.xMiddle > gestureStroke.boundingBox.xMiddle)

    if (symbolsBeforeInCurrentRow?.length && symbolsAfterInCurrentRow?.length) {
      const lastXBefore = Math.max(...symbolsBeforeInCurrentRow.map(s => s.boundingBox.xMax))
      const firstXAfter = Math.min(...symbolsAfterInCurrentRow.map(s => s.boundingBox.xMin))
      const translateX = lastXBefore - firstXAfter
      promises.push(this.translateManager.translate(symbolsAfterInCurrentRow, translateX, 0))
    }
    else if (symbolsBeforeInCurrentRow?.length) {
      if (currentRow?.symbols.length) {
        const nextRow = nextRows.find(r => r.index === currentRowIndex + 1)
        if (nextRow) {
          const symbolInNextRow = nextRow.symbols
          const lastXBefore = Math.max(...currentRow.symbols.map(s => s.boundingBox.xMax))
          const xMin = Math.min(...symbolInNextRow.map(s => s.boundingBox.xMin))
          const translateX = lastXBefore + SPACE_BETWEEN_STROKE - xMin
          promises.push(this.translateManager.translate(symbolInNextRow, translateX, -this.rowHeight))
        }

        const symbolsAfterNextRow = nextRows.filter(r => r.index > currentRowIndex + 1).flatMap(r => r.symbols)
        promises.push(this.translateManager.translate(symbolsAfterNextRow, 0, -this.rowHeight))
      }
      else {
        const nextSymbols = nextRows.filter(r => r.index > currentRowIndex + 1).flatMap(r => r.symbols)
        promises.push(this.translateManager.translate(nextSymbols, 0, -this.rowHeight))
      }
    }
    else if (symbolsAfterInCurrentRow?.length) {
      if (previousRow) {
        const lastXBefore = Math.max(...previousRow.symbols.map(s => s.boundingBox.xMax))
        const xMin = Math.min(...symbolsAfterInCurrentRow.map(s => s.boundingBox.xMin))
        const translateX = lastXBefore + SPACE_BETWEEN_STROKE - xMin
        promises.push(this.translateManager.translate(symbolsAfterInCurrentRow, translateX, -this.rowHeight))

        const afterNextSymbols = nextRows.flatMap(r => r.symbols)
        if (afterNextSymbols.length) {
          promises.push(this.translateManager.translate(afterNextSymbols, 0, -this.rowHeight))
        }
      }
      else {
        const nextSymbols = [...symbolsAfterInCurrentRow, ...nextRows.flatMap(r => r.symbols)]
        promises.push(this.translateManager.translate(nextSymbols, 0, -this.rowHeight))
      }
    }

    this.undoRedoManager.addModelToStack(this.model)
    await Promise.all(promises)
    this.undoRedoManager.updateModelInStack(this.model)
  }

  async applyInsertGesture(gestureStroke: OIStroke, gesture: TGesture): Promise<void>
  {
    this.#logger.debug("applyInsertGesture", { gesture })

    const promises: Promise<void>[] = []
    const currentRowIndex = this.model.getSymbolRowIndex(gestureStroke)
    const rows = this.model.getSymbolsByRowOrdered()
    const currentRow = rows.find(r => r.index === currentRowIndex)
    const nextRows = rows.filter(r => r.index > currentRowIndex)
    const symbolsBeforeInCurrentRow = currentRow?.symbols.filter(s => s.boundingBox.xMiddle < gestureStroke.boundingBox.xMiddle)
    const symbolsAfterInCurrentRow = currentRow?.symbols.filter(s => s.boundingBox.xMiddle > gestureStroke.boundingBox.xMiddle)

    if (gesture.strokeIds.length && gesture.subStrokes?.length) {
      // we can split only one stroke
      const strokeToSplit = this.model.symbols.find(s => gesture.strokeIds[0] === s.id) as OIStroke
      const intersectPoint = {
        x: gesture.subStrokes[0].x.at(-1) as number,
        y: gesture.subStrokes[0].y.at(-1) as number
      }
      const nearestPoint = getClosestPoints([intersectPoint], strokeToSplit.pointers)
      const indexToSplit = strokeToSplit.pointers.findIndex(p => nearestPoint.p2.x === p.x && nearestPoint.p2.y === p.y)
      if (indexToSplit > -1) {
        const newStrokes = OIStroke.split(strokeToSplit, indexToSplit)
        this.translateManager.applyToSymbol(newStrokes.after, SPACE_BETWEEN_STROKE, 0)
        this.model.replaceSymbol(strokeToSplit.id, [newStrokes.before, newStrokes.after])
        this.renderer.removeSymbol(strokeToSplit.id)
        this.renderer.drawSymbol(newStrokes.before)
        this.renderer.drawSymbol(newStrokes.after)
        promises.push(this.recognizer.replaceStrokes([strokeToSplit.id], [newStrokes.before, newStrokes.after]))
      }

      if (symbolsAfterInCurrentRow?.length) {
        promises.push(this.translateManager.translate(symbolsAfterInCurrentRow.filter(s => s.id !== strokeToSplit.id), SPACE_BETWEEN_STROKE, 0))
      }
    }
    else if (symbolsAfterInCurrentRow?.length) {
      let translateX = 0
      if (symbolsBeforeInCurrentRow?.length) {
        translateX = Math.min(...symbolsBeforeInCurrentRow.map(s => s.boundingBox.xMin)) - Math.min(...symbolsAfterInCurrentRow.map(s => s.boundingBox.xMin))
      }
      promises.push(this.translateManager.translate(symbolsAfterInCurrentRow, translateX, this.rowHeight))

      const nextSymbols = nextRows.filter(r => r.index > currentRowIndex).flatMap(r => r.symbols)
      if (nextSymbols.length) {
        promises.push(this.translateManager.translate(nextSymbols, 0, this.rowHeight))
      }
    }
    else if (symbolsBeforeInCurrentRow?.length) {
      const nextSymbols = nextRows.filter(r => r.index > currentRowIndex).flatMap(r => r.symbols)
      if (nextSymbols.length) {
        promises.push(this.translateManager.translate(nextSymbols, 0, this.rowHeight))
      }
    }

    this.model.updatePositionSent()
    this.model.updatePositionReceived()
    this.undoRedoManager.addModelToStack(this.model)
    await Promise.all(promises)
    this.undoRedoManager.updateModelInStack(this.model)
  }

  async applyUnderlineGesture(gesture: TGesture): Promise<void>
  {
    this.#logger.debug("applyUnderlineGesture", { gesture })
    if (!gesture.strokeIds.length) {
      this.#logger.warn("applyUnderlineGesture", "Unable to apply underline because there are no strokes")
      return
    }
    const symbolsToUnderline = this.model.symbols.filter(s => gesture.strokeIds.includes(s.id)) as TOISymbolDecorable[]
    symbolsToUnderline.forEach(s =>
    {
      const underline = new OIDecoratorUnderline(this.currentStyle, [s])
      this.model.addSymbol(underline)
      s.decorators.push(underline)
      this.model.updateSymbol(s)
      this.renderer.drawSymbol(s)
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
        const symbolsToStrikethrough = this.model.symbols.filter(s => gesture.strokeIds.includes(s.id)) as TOISymbolDecorable[]
        symbolsToStrikethrough.forEach(s =>
        {
          const strikethrough = new OIDecoratorStrikethrough(this.currentStyle, [s])
          this.renderer.drawSymbol(strikethrough)
          this.model.addSymbol(strikethrough)
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

  async apply(gestureStroke?: OIStroke, gesture?: TGesture): Promise<void>
  {
    this.#logger.info("apply", { gestureStroke, gesture })
    if (gestureStroke && gesture) {
      this.model.removeSymbol(gesture.gestureStrokeId)
      this.renderer.removeSymbol(gesture.gestureStrokeId)
      switch (gesture.gestureType) {
        case "UNDERLINE":
          return this.applyUnderlineGesture(gesture)
        case "SCRATCH":
          return this.applyScratchGesture(gestureStroke, gesture)
        case "JOIN":
          return this.applyJoinGesture(gestureStroke)
        case "INSERT":
          return this.applyInsertGesture(gestureStroke, gesture)
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

  async getGestureFromContextLess(stroke: OIStroke): Promise<TGesture | undefined>
  {
    const gesture = await this.recognizer.recognizeGesture([stroke])
    if (!gesture?.gestures.length) return
    switch (gesture.gestures[0].type) {
      case "surround": {
        const symbolsToSelect = this.model.symbols.filter(s => stroke.boundingBox.contains(s.boundingBox))
        return {
          gestureType: "SURROUND",
          gestureStrokeId: stroke.id,
          strokeAfterIds: [],
          strokeBeforeIds: [],
          strokeIds: symbolsToSelect.map(s => s.id),
        }
      }
      case "left-right":
      case "right-left": {
        const symbolsToUnderline = this.model.symbols.filter(s =>
        {
          return [SymbolType.Text.toString(), SymbolType.Stroke.toString()].includes(s.type) &&
            isBetween(stroke.boundingBox.yMiddle, s.boundingBox.y + s.boundingBox.height * 3 / 4, s.boundingBox.y + s.boundingBox.height * 5 / 4)
        })
        if (symbolsToUnderline.length) {
          return {
            gestureType: "UNDERLINE",
            gestureStrokeId: stroke.id,
            strokeAfterIds: [],
            strokeBeforeIds: [],
            strokeIds: symbolsToUnderline.map(s => s.id),
          }
        }
        const symbolsToStrikeThrough = this.model.symbols.filter(s =>
        {
          return [SymbolType.Text.toString(), SymbolType.Stroke.toString()].includes(s.type) &&
            isBetween(stroke.boundingBox.yMiddle, s.boundingBox.y + s.boundingBox.height / 4, s.boundingBox.y + s.boundingBox.height * 3 / 4)
        })
        if (symbolsToStrikeThrough.length) {
          return {
            gestureType: "STRIKETHROUGH",
            gestureStrokeId: stroke.id,
            strokeAfterIds: [],
            strokeBeforeIds: [],
            strokeIds: symbolsToStrikeThrough.map(s => s.id),
          }
        }
        return
      }
      case "scratch": {
        const symbolsToErase = this.model.symbols.filter(s =>
        {
          return [SymbolType.Stroke.toString(), SymbolType.Text.toString()].includes(s.type) && stroke.boundingBox.overlaps(s.boundingBox)
        })
        if (symbolsToErase.length) {
          return {
            gestureType: "SCRATCH",
            gestureStrokeId: stroke.id,
            strokeAfterIds: [],
            strokeBeforeIds: [],
            strokeIds: symbolsToErase.map(s => s.id),
          }
        }
        return
      }
      case "bottom-top": {
        // TODO IIC-989
        return
      }
      case "top-bottom": {
        // TODO IIC-989
        return
      }
      case "none":
      default:
        return
    }
  }
}
