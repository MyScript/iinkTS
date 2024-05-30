import { Intention, LoggerClass } from "../Constants"
import { OIBehaviors } from "../behaviors"
import { LoggerManager } from "../logger"
import { OIModel } from "../model"
import
{
  OIDecorator,
  OIStroke,
  SymbolType,
  OIText,
  DecoratorKind,
  TSymbol,
} from "../primitive"
import { OIRecognizer } from "../recognizer"
import { OISVGRenderer } from "../renderer"
import { TStyle } from "../style"
import { OIHistoryManager, TOIActions, TOIActionsTransformTranslate } from "../history"
import { getClosestPoints, isBetween, isPointInsidePolygon } from "../utils"
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

  get translator(): OITranslateManager
  {
    return this.behaviors.translator
  }

  get texter(): OITextManager
  {
    return this.behaviors.texter
  }

  get model(): OIModel
  {
    return this.behaviors.model
  }

  get history(): OIHistoryManager
  {
    return this.behaviors.history
  }

  get selector(): OISelectionManager
  {
    return this.behaviors.selector
  }

  get currentStyle(): TStyle
  {
    return this.behaviors.styler.currentPenStyle
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
    const actions: TOIActions = {}
    switch (this.surroundAction) {
      case SurroundAction.Select: {
        this.behaviors.internalEvent.emitIntention(Intention.Select)
        gesture.strokeIds.forEach(id =>
        {
          this.model.selectSymbol(id)
        })
        this.model.symbolsSelected.forEach(s => this.renderer.drawSymbol(s))
        this.selector.drawSelectedGroup(this.model.symbolsSelected)
        this.behaviors.internalEvent.emitSelected(this.model.symbolsSelected)
        break
      }
      case SurroundAction.Highlight: {
        const symbolsToHightlight = this.model.symbols.filter(s => gesture.strokeIds.includes(s.id)) as OIStroke[]
        actions.transformed = []
        symbolsToHightlight.forEach(s =>
        {
          const highlight = new OIDecorator(DecoratorKind.Highlight, this.currentStyle)
          const index = s.decorators.findIndex(d => d.kind === DecoratorKind.Highlight)
          index > -1 ? s.decorators.splice(index, 1, highlight) : s.decorators.push(highlight)
          this.model.updateSymbol(s)
          this.renderer.drawSymbol(s)
          actions.transformed?.push({ transformationType: "DECORATOR", symbols: [s], decorators: [highlight] })
        })
        this.history.push(this.model, actions)
        break
      }
      case SurroundAction.Surround: {
        const symbolsToSurround = this.model.symbols.filter(s => gesture.strokeIds.includes(s.id)) as OIStroke[]
        actions.transformed = []
        symbolsToSurround.forEach(s =>
        {
          const surround = new OIDecorator(DecoratorKind.Surround, this.currentStyle)
          s.decorators.push(surround)
          this.model.updateSymbol(s)
          this.renderer.drawSymbol(s)
          actions.transformed?.push({ transformationType: "DECORATOR", symbols: [s], decorators: [surround] })
        })
        this.history.push(this.model, actions)
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
    const symbolsErased: TSymbol[] = []
    const symbolsReplaced: { oldSymbols: TSymbol[], newSymbols: TSymbol[] } = { oldSymbols: [], newSymbols: [] }

    const shapesOrEdgeToErase = this.model.symbols.filter(s => [SymbolType.Shape.toString(), SymbolType.Edge.toString()].includes(s.type) && gesture.strokeIds.includes(s.id)) as OIText[]
    shapesOrEdgeToErase.forEach(s =>
    {
      this.renderer.removeSymbol(s.id)
      this.model.removeSymbol(s.id)
    })
    symbolsErased.push(...shapesOrEdgeToErase)

    const textScratched = this.model.symbols.filter(s => s.type === SymbolType.Text && gesture.strokeIds.includes(s.id)) as OIText[]
    if (textScratched.length) {
      textScratched.forEach(te =>
      {
        const charsToRemove = te.getCharsOverlaps(gestureStroke.pointers)
        if (te.chars.length == charsToRemove.length) {
          this.renderer.removeSymbol(te.id)
          this.model.removeSymbol(te.id)
          symbolsErased.push(te)
        }
        else {
          const clone = te.clone()
          charsToRemove.forEach(c =>
          {
            const cIndex = te.chars.findIndex(c1 => c1.id === c.id)
            te.chars.splice(cIndex, 1)
          })
          this.model.updateSymbol(te)
          this.texter.updateTextBoundingBox(te)
          this.renderer.drawSymbol(te)
          symbolsReplaced.oldSymbols.push(clone)
          symbolsReplaced.newSymbols.push(te)
        }
      })
      this.texter.adjustText()
    }

    const strokesScratched = this.model.symbols.filter(s => s.type === SymbolType.Stroke && gesture.strokeIds.includes(s.id)) as OIStroke[]
    if (strokesScratched.length) {
      const promises: Promise<void>[] = []
      const strokeIdsToErase: string[] = []
      strokesScratched.forEach(sd =>
      {
        const partPointersToRemove = gesture.subStrokes?.find(ss => ss.fullStrokeId === sd.id)
        if (partPointersToRemove) {
          const strokePartToErase = new OIStroke({}, "eraser")
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
            symbolsReplaced.oldSymbols.push(sd.clone())
            symbolsReplaced.newSymbols.push(...newStrokes)
            promises.push(this.recognizer.replaceStrokes([sd.id], newStrokes))
            this.model.replaceSymbol(sd.id, newStrokes)
            this.renderer.replaceSymbol(sd.id, newStrokes)
          }
          else {
            symbolsErased.push(sd)
            strokeIdsToErase.push(sd.id)
            this.model.removeSymbol(sd.id)
            this.renderer.removeSymbol(sd.id)
          }
        }
        else {
          symbolsErased.push(sd)
          strokeIdsToErase.push(sd.id)
          this.model.removeSymbol(sd.id)
          this.renderer.removeSymbol(sd.id)
        }
      })

      if (strokeIdsToErase.length) {
        promises.push(this.recognizer.eraseStrokes(strokeIdsToErase))
      }
      await Promise.all(promises)
    }
    const actions: TOIActions = {}
    if (symbolsErased.length) {
      actions.erased = symbolsErased
    }
    if (symbolsReplaced.newSymbols.length) {
      actions.replaced = symbolsReplaced
    }
    this.history.push(this.model, actions)
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
    const symbolsBeforeInCurrentRow = currentRow?.symbols.filter(s => s.boundingBox.xMid < gestureStroke.boundingBox.xMid)
    const symbolsAfterInCurrentRow = currentRow?.symbols.filter(s => s.boundingBox.xMid > gestureStroke.boundingBox.xMid)

    const transformed: TOIActionsTransformTranslate[] = []
    if (symbolsBeforeInCurrentRow?.length && symbolsAfterInCurrentRow?.length) {
      const lastXBefore = Math.max(...symbolsBeforeInCurrentRow.map(s => s.boundingBox.xMax))
      const firstXAfter = Math.min(...symbolsAfterInCurrentRow.map(s => s.boundingBox.xMin))
      const translateX = lastXBefore - firstXAfter
      promises.push(this.translator.translate(symbolsAfterInCurrentRow, translateX, 0))
      transformed.push({ transformationType: "TRANSLATE", symbols: symbolsAfterInCurrentRow, tx: translateX, ty: 0 })
    }
    else if (symbolsBeforeInCurrentRow?.length) {
      if (currentRow?.symbols.length) {
        const nextRow = nextRows.find(r => r.index === currentRowIndex + 1)
        if (nextRow) {
          const symbolInNextRow = nextRow.symbols
          const lastXBefore = Math.max(...currentRow.symbols.map(s => s.boundingBox.xMax))
          const xMin = Math.min(...symbolInNextRow.map(s => s.boundingBox.xMin))
          const translateX = lastXBefore + SPACE_BETWEEN_STROKE - xMin
          promises.push(this.translator.translate(symbolInNextRow, translateX, -this.rowHeight))
          transformed.push({ transformationType: "TRANSLATE", symbols: symbolInNextRow, tx: translateX, ty: -this.rowHeight })
        }

        const symbolsAfterNextRow = nextRows.filter(r => r.index > currentRowIndex + 1).flatMap(r => r.symbols)
        promises.push(this.translator.translate(symbolsAfterNextRow, 0, -this.rowHeight))
        transformed.push({ transformationType: "TRANSLATE", symbols: symbolsAfterNextRow, tx: 0, ty: -this.rowHeight })
      }
      else {
        const nextSymbols = nextRows.filter(r => r.index > currentRowIndex + 1).flatMap(r => r.symbols)
        promises.push(this.translator.translate(nextSymbols, 0, -this.rowHeight))
        transformed.push({ transformationType: "TRANSLATE", symbols: nextSymbols, tx: 0, ty: -this.rowHeight })
      }

    }
    else if (symbolsAfterInCurrentRow?.length) {
      if (previousRow) {
        const lastXBefore = Math.max(...previousRow.symbols.map(s => s.boundingBox.xMax))
        const xMin = Math.min(...symbolsAfterInCurrentRow.map(s => s.boundingBox.xMin))
        const translateX = lastXBefore + SPACE_BETWEEN_STROKE - xMin
        promises.push(this.translator.translate(symbolsAfterInCurrentRow, translateX, -this.rowHeight))
        transformed.push({ transformationType: "TRANSLATE", symbols: symbolsAfterInCurrentRow, tx: translateX, ty: -this.rowHeight })

        const afterNextSymbols = nextRows.flatMap(r => r.symbols)
        if (afterNextSymbols.length) {
          promises.push(this.translator.translate(afterNextSymbols, 0, -this.rowHeight))
          transformed.push({ transformationType: "TRANSLATE", symbols: afterNextSymbols, tx: 0, ty: -this.rowHeight })
        }
      }
      else {
        const nextSymbols = [...symbolsAfterInCurrentRow, ...nextRows.flatMap(r => r.symbols)]
        promises.push(this.translator.translate(nextSymbols, 0, -this.rowHeight))
        transformed.push({ transformationType: "TRANSLATE", symbols: nextSymbols, tx: 0, ty: -this.rowHeight })
      }
    }

    this.history.push(this.model, transformed.length ? { transformed } : {})
    await Promise.all(promises)
  }

  async applyInsertGesture(gestureStroke: OIStroke, gesture: TGesture): Promise<void>
  {
    this.#logger.debug("applyInsertGesture", { gesture })

    const promises: Promise<void>[] = []
    const currentRowIndex = this.model.getSymbolRowIndex(gestureStroke)
    const rows = this.model.getSymbolsByRowOrdered()
    const currentRow = rows.find(r => r.index === currentRowIndex)
    const nextRows = rows.filter(r => r.index > currentRowIndex)
    const symbolsBeforeInCurrentRow = currentRow?.symbols.filter(s => s.boundingBox.xMid < gestureStroke.boundingBox.xMid)
    const symbolsAfterInCurrentRow = currentRow?.symbols.filter(s => s.boundingBox.xMid > gestureStroke.boundingBox.xMid)

    const transformed: TOIActionsTransformTranslate[] = []
    const symbolsReplaced: { oldSymbols: TSymbol[], newSymbols: TSymbol[] } = { oldSymbols: [], newSymbols: [] }

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
        this.translator.applyToSymbol(newStrokes.after, SPACE_BETWEEN_STROKE, 0)
        this.model.replaceSymbol(strokeToSplit.id, [newStrokes.before, newStrokes.after])
        this.renderer.removeSymbol(strokeToSplit.id)
        this.renderer.drawSymbol(newStrokes.before)
        this.renderer.drawSymbol(newStrokes.after)
        promises.push(this.recognizer.replaceStrokes([strokeToSplit.id], [newStrokes.before, newStrokes.after]))
        symbolsReplaced.oldSymbols.push(strokeToSplit)
        symbolsReplaced.newSymbols.push(newStrokes.before, newStrokes.after)
      }

      if (symbolsAfterInCurrentRow?.length) {
        promises.push(this.translator.translate(symbolsAfterInCurrentRow.filter(s => s.id !== strokeToSplit.id), SPACE_BETWEEN_STROKE, 0))
        transformed.push({ transformationType: "TRANSLATE", symbols: symbolsAfterInCurrentRow, tx: SPACE_BETWEEN_STROKE, ty: 0 })
      }
    }
    else if (symbolsAfterInCurrentRow?.length) {
      let translateX = 0
      if (symbolsBeforeInCurrentRow?.length) {
        translateX = Math.min(...symbolsBeforeInCurrentRow.map(s => s.boundingBox.xMin)) - Math.min(...symbolsAfterInCurrentRow.map(s => s.boundingBox.xMin))
      }
      promises.push(this.translator.translate(symbolsAfterInCurrentRow, translateX, this.rowHeight))
      transformed.push({ transformationType: "TRANSLATE", symbols: symbolsAfterInCurrentRow, tx: translateX, ty: this.rowHeight })

      const nextSymbols = nextRows.filter(r => r.index > currentRowIndex).flatMap(r => r.symbols)
      if (nextSymbols.length) {
        promises.push(this.translator.translate(nextSymbols, 0, this.rowHeight))
        transformed.push({ transformationType: "TRANSLATE", symbols: nextSymbols, tx: 0, ty: this.rowHeight })
      }
    }
    else if (symbolsBeforeInCurrentRow?.length) {
      const nextSymbols = nextRows.filter(r => r.index > currentRowIndex).flatMap(r => r.symbols)
      if (nextSymbols.length) {
        promises.push(this.translator.translate(nextSymbols, 0, this.rowHeight))
        transformed.push({ transformationType: "TRANSLATE", symbols: nextSymbols, tx: 0, ty: this.rowHeight })
      }
    }
    const actions: TOIActions = {}
    if (transformed.length) {
      actions.transformed = transformed
    }
    if (symbolsReplaced.newSymbols.length) {
      actions.replaced = symbolsReplaced
    }
    this.history.push(this.model, actions)
    await Promise.all(promises)
  }

  async applyUnderlineGesture(gesture: TGesture): Promise<void>
  {
    this.#logger.debug("applyUnderlineGesture", { gesture })
    if (!gesture.strokeIds.length) {
      this.#logger.warn("applyUnderlineGesture", "Unable to apply underline because there are no strokes")
      return
    }
    const symbolsToUnderline = this.model.symbols.filter(s => gesture.strokeIds.includes(s.id)) as (OIStroke | OIText)[]
    if (symbolsToUnderline.length) {
      const actions: TOIActions = { transformed: [] }
      symbolsToUnderline.forEach(s =>
      {
        const underline = new OIDecorator(DecoratorKind.Underline, this.currentStyle)
        const index = s.decorators.findIndex(d => d.kind === DecoratorKind.Underline)
        index > -1 ? s.decorators.splice(index, 1, underline) : s.decorators.push(underline)
        this.model.updateSymbol(s)
        this.renderer.drawSymbol(s)
        actions.transformed?.push({ transformationType: "DECORATOR", symbols: [s], decorators: [underline] })
      })
      if (actions.transformed?.length) {
        this.history.push(this.model, actions)
      }
    }
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
        const symbolsToStrikethrough = this.model.symbols.filter(s => gesture.strokeIds.includes(s.id)) as (OIStroke | OIText)[]
        const actions: TOIActions = { transformed: [] }
        symbolsToStrikethrough.forEach(s =>
        {
          const strikethrough = new OIDecorator(DecoratorKind.Strikethrough, this.currentStyle)
          const index = s.decorators.findIndex(d => d.kind === DecoratorKind.Strikethrough)
          index > -1 ? s.decorators.splice(index, 1, strikethrough) : s.decorators.push(strikethrough)
          this.model.updateSymbol(s)
          this.renderer.drawSymbol(s)
          actions.transformed?.push({ transformationType: "DECORATOR", symbols: [s], decorators: [strikethrough] })
        })
        if (actions.transformed?.length) {
          this.history.push(this.model, actions)
        }
        break
      }
      case StrikeThroughAction.Erase: {
        const symbolsToErase: TSymbol[] = this.model.symbols.filter(s => gesture.strokeIds.includes(s.id))
        gesture.strokeIds.forEach(id =>
        {
          this.model.removeSymbol(id)
          this.renderer.removeSymbol(id)
        })
        await this.recognizer.eraseStrokes(gesture.strokeIds)
        if (symbolsToErase.length) {
          this.history.push(this.model, { erased: symbolsToErase })
        }
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
        const symbolsToSelect = this.model.symbols.filter(s =>
        {
          return stroke.boundingBox.containsPoint({ x: s.boundingBox.xMid, y: s.boundingBox.yMid })
        })
        if (symbolsToSelect.length) {
          return {
            gestureType: "SURROUND",
            gestureStrokeId: stroke.id,
            strokeAfterIds: [],
            strokeBeforeIds: [],
            strokeIds: symbolsToSelect.map(s => s.id),
          }
        }
        return
      }
      case "left-right":
      case "right-left": {
        const symbolsToUnderline = this.model.symbols.filter(s =>
        {
          return [SymbolType.Text.toString(), SymbolType.Stroke.toString()].includes(s.type) &&
            stroke.pointers.some(p => isBetween(p.x, s.boundingBox.xMin, s.boundingBox.xMax)) &&
            isBetween(stroke.boundingBox.yMid, s.boundingBox.y + s.boundingBox.height * 3 / 4, s.boundingBox.y + s.boundingBox.height * 5 / 4)
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
            stroke.pointers.some(p => isBetween(p.x, s.boundingBox.xMin, s.boundingBox.xMax)) &&
            isBetween(stroke.boundingBox.yMid, s.boundingBox.y + s.boundingBox.height / 4, s.boundingBox.y + s.boundingBox.height * 3 / 4)
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
          return SymbolType.Stroke === s.type && stroke.boundingBox.overlaps(s.boundingBox) ||
            SymbolType.Text === s.type && stroke.pointers.some(p => isPointInsidePolygon(p, s.vertices)) ||
            stroke.boundingBox.contains(s.boundingBox)
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
        const hasShapeInRow = this.model.symbols.some(s => isBetween(s.boundingBox.yMid, stroke.boundingBox.yMin, stroke.boundingBox.yMax))
        if (hasShapeInRow) {
          return {
            gestureType: "JOIN",
            gestureStrokeId: stroke.id,
            strokeAfterIds: [],
            strokeBeforeIds: [],
            strokeIds: [],
          }
        }
        return
      }
      case "top-bottom": {
        const hasShapeInRow = this.model.symbols.some(s => isBetween(s.boundingBox.yMid, stroke.boundingBox.yMin, stroke.boundingBox.yMax))
        if (hasShapeInRow) {
          return {
            gestureType: "INSERT",
            gestureStrokeId: stroke.id,
            strokeAfterIds: [],
            strokeBeforeIds: [],
            strokeIds: [],
          }
        }
        return
      }
      case "none":
      default:
        return
    }
  }
}
