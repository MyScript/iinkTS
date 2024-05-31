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
  OISymbolGroup,
  TOISymbol,
} from "../primitive"
import { OIRecognizer } from "../recognizer"
import { OISVGRenderer } from "../renderer"
import { TStyle } from "../style"
import { OIHistoryManager, TOIHistoryChanges } from "../history"
import { getClosestPoints, isBetween, isPointInsidePolygon } from "../utils"
import { TGesture, StrikeThroughAction, SurroundAction } from "../gesture"
import { OITranslateManager } from "./OITranslateManager"
import { OITextManager } from "./OITextManager"


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

  get currentStyle(): TStyle
  {
    return this.behaviors.styler.currentPenStyle
  }

  get rowHeight(): number
  {
    return this.behaviors.configuration.rendering.guides.gap
  }

  get strokeSpaceWidth(): number
  {
    return this.rowHeight / 2
  }

  async applySurroundGesture(gestureStroke: OIStroke, gesture: TGesture): Promise<void>
  {
    this.#logger.info("applySurroundGesture", { gestureStroke, gesture })
    const changes: TOIHistoryChanges = {}
    switch (this.surroundAction) {
      case SurroundAction.Select: {
        const ids = this.model.symbols.filter(s => gestureStroke.boundingBox.contains(s.boundingBox)).map(s => s.id)
        if (ids.length) {
          this.behaviors.internalEvent.emitIntention(Intention.Select)
          this.behaviors.select(ids)
        }
        break
      }
      case SurroundAction.Highlight: {
        const symbolIds: string[] = []
        changes.decorator = []
        gesture.strokeIds.forEach(id =>
        {
          const sym = this.model.getRootSymbol(id)
          if (sym && [SymbolType.Group.toString(), SymbolType.Stroke.toString(), SymbolType.Text.toString()].includes(sym.type) && !symbolIds.includes(sym.id)) {
            const symWithDec = sym as (OIText | OIStroke | OISymbolGroup)
            const highlight = new OIDecorator(DecoratorKind.Highlight, this.currentStyle)
            const index = symWithDec.decorators.findIndex(d => d.kind === DecoratorKind.Highlight)
            const added = index === -1
            added ? symWithDec.decorators.push(highlight) : symWithDec.decorators.splice(index, 1)
            this.model.updateSymbol(symWithDec)
            this.renderer.drawSymbol(symWithDec)
            symbolIds.push(symWithDec.id)
            changes.decorator!.push({ symbol: symWithDec, decorator: highlight, added })
          }
        })
        if (changes.decorator.length) {
          this.history.push(this.model, changes)
        }
        break
      }
      case SurroundAction.Surround: {
        const symbolIds: string[] = []
        changes.decorator = []
        gesture.strokeIds.forEach(id =>
        {
          const sym = this.model.getRootSymbol(id)
          if (sym && [SymbolType.Group.toString(), SymbolType.Stroke.toString(), SymbolType.Text.toString()].includes(sym.type) && !symbolIds.includes(sym.id)) {
            const symWithDec = sym as (OIText | OIStroke | OISymbolGroup)
            const surround = new OIDecorator(DecoratorKind.Surround, this.currentStyle)
            const index = symWithDec.decorators.findIndex(d => d.kind === DecoratorKind.Surround)
            const added = index === -1
            added ? symWithDec.decorators.push(surround) : symWithDec.decorators.splice(index, 1)
            this.model.updateSymbol(symWithDec)
            this.renderer.drawSymbol(symWithDec)
            changes.decorator!.push({ symbol: symWithDec, decorator: surround, added })
            symbolIds.push(symWithDec.id)
          }
        })
        this.history.push(this.model, changes)
        break
      }
      default:
        this.#logger.error("applySurroundGesture", `Unknow surroundAction: ${ this.surroundAction }, values allowed are: ${ SurroundAction.Highlight }, ${ SurroundAction.Select }, ${ SurroundAction.Surround }`)
        break
    }
    return
  }

  protected computeScratchGestureOnStrokes(gesture: TGesture, strokes: OIStroke[]): { replaced: { oldSymbols: TOISymbol[], newSymbols: TOISymbol[] }, erased: TOISymbol[] }
  {
    const replaced: { oldSymbols: TOISymbol[], newSymbols: TOISymbol[] } = { oldSymbols: [], newSymbols: [] }
    const erased: TOISymbol[] = []
    strokes.forEach(sd =>
    {
      const partPointersToRemove = gesture.subStrokes?.find(ss => ss.fullStrokeId === sd.id)
      if (partPointersToRemove) {
        const strokePartToErase = new OIStroke({}, "eraser")
        partPointersToRemove.x.forEach((x, i) => strokePartToErase.addPointer({ x, y: partPointersToRemove.y[i], p: 1, t: 1 }))
        const subStrokes = OIStroke.substract(sd, strokePartToErase)
        const newStrokes: OIStroke[] = []
        if (subStrokes.before) newStrokes.push(subStrokes.before)
        if (subStrokes.after) newStrokes.push(subStrokes.after)
        if (newStrokes.length) {
          replaced.newSymbols.push(...newStrokes)
          replaced.oldSymbols.push(sd)
        }
        else {
          erased.push(sd)
        }
      }
      else {
        erased.push(sd)
      }
    })
    return {
      replaced,
      erased
    }
  }

  async applyScratchGesture(gestureStroke: OIStroke, gesture: TGesture): Promise<void>
  {
    this.#logger.debug("applyScratchGesture", { gestureStroke, gesture })
    if (!gesture.strokeIds.length) {
      this.#logger.warn("applyScratchGesture", "Unable to apply underline because there are no strokes")
      return
    }
    const symbolsToUpdate: TOISymbol[] = []
    const symbolsToErase: TOISymbol[] = []
    const symbolsToReplace: { oldSymbols: TOISymbol[], newSymbols: TOISymbol[] } = { oldSymbols: [], newSymbols: [] }

    symbolsToErase.push(...this.model.symbols.filter(s => [SymbolType.Shape.toString(), SymbolType.Edge.toString()].includes(s.type) && gesture.strokeIds.includes(s.id)))

    const textScratched = this.model.symbols.filter(s => s.type === SymbolType.Text && gesture.strokeIds.includes(s.id)) as OIText[]
    if (textScratched.length) {
      textScratched.forEach(te =>
      {
        const charsToRemove = te.getCharsOverlaps(gestureStroke.pointers)
        if (te.chars.length == charsToRemove.length) {
          symbolsToErase.push(te)
        }
        else {
          charsToRemove.forEach(c =>
          {
            const cIndex = te.chars.findIndex(c1 => c1.id === c.id)
            te.chars.splice(cIndex, 1)
          })
          this.texter.updateTextBoundingBox(te)
          symbolsToUpdate.push(te)
        }
      })
      this.texter.adjustText()
    }

    const strokesScratched = this.model.symbols.filter(s => s.type === SymbolType.Stroke && gesture.strokeIds.includes(s.id)) as OIStroke[]
    const strokesScratchedResult = this.computeScratchGestureOnStrokes(gesture, strokesScratched)
    symbolsToErase.push(...strokesScratchedResult.erased)
    symbolsToReplace.newSymbols.push(...strokesScratchedResult.replaced.newSymbols)
    symbolsToReplace.oldSymbols.push(...strokesScratchedResult.replaced.oldSymbols)

    const groupsScratched = this.model.symbols.filter(s => s.type === SymbolType.Group && (gesture.strokeIds.includes(s.id) || gesture.strokeIds.some(id => (s as OISymbolGroup).containsSymbol(id)))) as OISymbolGroup[]
    if (groupsScratched.length) {
      groupsScratched.forEach(gs =>
      {
        const childSymbolsToRemove = gs.symbols.filter(s => gestureStroke.boundingBox.contains(s.boundingBox))
        if (childSymbolsToRemove.length === gs.symbols.length) {
          symbolsToErase.push(gs)
        }
        else {
          symbolsToReplace.oldSymbols.push(gs.clone())
          gs.symbols = gs.symbols.filter(s => !gestureStroke.boundingBox.contains(s.boundingBox))
          symbolsToReplace.newSymbols.push(gs)
        }
      })
    }

    const promises: Promise<void | TOISymbol[]>[] = []
    const changes: TOIHistoryChanges = {}
    if (symbolsToUpdate.length) {
      promises.push(this.behaviors.updateSymbols(symbolsToUpdate, false))
      changes.updated = symbolsToUpdate
    }
    if (symbolsToErase.length) {
      promises.push(this.behaviors.removeSymbols(symbolsToErase.map(s => s.id), false))
      changes.erased = symbolsToErase
    }
    if (symbolsToReplace.newSymbols.length) {
      changes.replaced = symbolsToReplace
      promises.push(this.behaviors.replaceSymbols(symbolsToReplace.oldSymbols, symbolsToReplace.newSymbols, false))
    }
    this.history.push(this.model, changes)
    await Promise.all(promises)
  }

  protected isSymbolAbove(source: TOISymbol, target: TOISymbol): boolean
  {
    return source.boundingBox.yMid - this.rowHeight / 2 > target.boundingBox.yMid
  }

  protected isSymbolInRow(source: TOISymbol, target: TOISymbol): boolean
  {
    return Math.abs(source.boundingBox.yMid - target.boundingBox.yMid) <= this.rowHeight / 2
  }

  protected isSymbolBelow(source: TOISymbol, target: TOISymbol): boolean
  {
    return source.boundingBox.yMid + this.rowHeight / 2 < target.boundingBox.yMid
  }

  protected getFirstSymbol(symbols: TOISymbol[]): TOISymbol | undefined
  {
    if (!symbols.length) return
    return symbols.reduce((previous, current) =>
    {
      if (previous) {
        if (Math.round(previous.boundingBox.yMid / this.rowHeight) < Math.round(current.boundingBox.yMid / this.rowHeight)) {
          return previous
        }
        else if (Math.round(previous.boundingBox.yMid / this.rowHeight) == Math.round(current.boundingBox.yMid / this.rowHeight) && previous.boundingBox.xMid < current.boundingBox.xMid) {
          return previous
        }
      }
      return current
    })
  }

  protected getLastSymbol(symbols: TOISymbol[]): TOISymbol | undefined
  {
    if (!symbols.length) return
    return symbols.reduce((previous, current) =>
    {
      if (previous) {
        if (previous.boundingBox.yMid - current.boundingBox.yMid > this.rowHeight / 2) {
          return previous
        }
        if (previous.boundingBox.yMid - current.boundingBox.yMid < this.rowHeight / 2) {
          return current
        }
        else if (previous.boundingBox.xMid > current.boundingBox.xMid) {
          return previous
        }
      }
      return current
    })
  }

  protected roundToLineGuide(y: number): number
  {
    return Math.round(y / this.rowHeight) * this.rowHeight
  }

  async applyJoinGesture(gestureStroke: OIStroke, gesture: TGesture): Promise<void>
  {
    this.#logger.debug("applyJoinGesture", { gestureStroke, gesture })

    const symbolsAbove = this.model.symbols.filter(s => this.isSymbolAbove(gestureStroke, s))
    const symbolsRow = this.model.symbols.filter(s => this.isSymbolInRow(gestureStroke, s))
    const symbolsBeforeGestureInRow = symbolsRow.filter(s => s.boundingBox.xMid < gestureStroke.boundingBox.xMid)
    const symbolsAfterGestureInRow = symbolsRow.filter(s => s.boundingBox.xMid > gestureStroke.boundingBox.xMid)
    const symbolsBelow = this.model.symbols.filter(s => this.isSymbolBelow(gestureStroke, s))

    const changes: TOIHistoryChanges = {}
    const translate: { symbols: TOISymbol[], tx: number, ty: number }[] = []

    if (symbolsBeforeGestureInRow.length && symbolsAfterGestureInRow.length) {
      const lastSymbBefore = symbolsBeforeGestureInRow.reduce((previous, current) => previous && previous.boundingBox.xMax > current.boundingBox.xMax ? previous : current)
      const firstSymbolAfter = symbolsAfterGestureInRow.reduce((previous, current) => previous && previous.boundingBox.xMin < current.boundingBox.xMin ? previous : current)

      const lastXBefore = Math.max(...symbolsBeforeGestureInRow.map(s => s.boundingBox.xMax))
      const firstXAfter = Math.min(...symbolsAfterGestureInRow.map(s => s.boundingBox.xMin))
      const translateX = lastXBefore - firstXAfter

      const lastSymbBeforeClone = lastSymbBefore.clone()
      const firstSymbolAfterClone = firstSymbolAfter.clone()
      this.translator.applyToSymbol(firstSymbolAfterClone, translateX, 0)
      const symbolsToGroup = lastSymbBefore.type === SymbolType.Group ? (lastSymbBeforeClone as OISymbolGroup).extractSymbols() : [lastSymbBeforeClone]
      symbolsToGroup.push(...(firstSymbolAfterClone.type === SymbolType.Group ? (firstSymbolAfterClone as OISymbolGroup).extractSymbols() : [firstSymbolAfterClone]))

      const group = new OISymbolGroup(lastSymbBefore.style, symbolsToGroup)
      if ([SymbolType.Group.toString(), SymbolType.Stroke.toString(), SymbolType.Text.toString()].includes(lastSymbBefore.type)) {
        (lastSymbBefore as OIStroke).decorators.forEach(d =>
        {
          group.decorators.push(new OIDecorator(d.kind, d.style))
        })
      }
      if ([SymbolType.Group.toString(), SymbolType.Stroke.toString(), SymbolType.Text.toString()].includes(firstSymbolAfter.type)) {
        (firstSymbolAfter as OIStroke).decorators.forEach(d =>
        {
          if (!group.decorators.some(d1 => d1.kind == d.kind)) {
            group.decorators.push(new OIDecorator(d.kind, d.style))
          }
        })
      }

      changes.replaced = {
        oldSymbols: [lastSymbBefore, firstSymbolAfter],
        newSymbols: [group]
      }
      const rest = symbolsAfterGestureInRow.filter(s => s.id !== firstSymbolAfter.id)
      if (rest.length) {
        translate.push({ symbols: rest, tx: translateX, ty: 0 })
      }
    }
    else if (symbolsBeforeGestureInRow.length) {
      const lastSymbolBeforeGesture = this.getLastSymbol(symbolsBeforeGestureInRow)!
      const firstSymbolAfterGesture = this.getFirstSymbol(symbolsBelow)!

      if (this.roundToLineGuide(lastSymbolBeforeGesture.boundingBox.yMid) >= this.roundToLineGuide(firstSymbolAfterGesture.boundingBox.yMid - this.rowHeight)) {
        const symbolInNextRow = symbolsBelow.filter(s => this.isSymbolInRow(firstSymbolAfterGesture, s))
        if (symbolInNextRow.length) {
          const translateX = lastSymbolBeforeGesture.boundingBox.xMax + this.strokeSpaceWidth - firstSymbolAfterGesture.boundingBox.xMin
          translate.push({ symbols: symbolInNextRow, tx: translateX, ty: -this.rowHeight })
        }
        const symbolsAfterNextRow = symbolsBelow.filter(s => this.isSymbolBelow(firstSymbolAfterGesture, s))
        if (symbolsAfterNextRow.length) {
          translate.push({ symbols: symbolsAfterNextRow, tx: 0, ty: -this.rowHeight })
        }
      }
      else {
        translate.push({ symbols: symbolsBelow, tx: 0, ty: -this.rowHeight })
      }
    }
    else if (symbolsAfterGestureInRow.length) {
      const firstSymbolAfterGesture = this.getFirstSymbol(symbolsAfterGestureInRow)!
      const lastSymbolAbove = this.getLastSymbol(symbolsAbove)
      if (lastSymbolAbove) {
        if (this.roundToLineGuide(lastSymbolAbove.boundingBox.yMid) >= this.roundToLineGuide(firstSymbolAfterGesture.boundingBox.yMid - this.rowHeight)) {
          const translateX = lastSymbolAbove.boundingBox.xMax + this.strokeSpaceWidth - firstSymbolAfterGesture.boundingBox.xMin
          translate.push({ symbols: symbolsAfterGestureInRow, tx: translateX, ty: -this.rowHeight })
        }
        else {
          translate.push({ symbols: symbolsAfterGestureInRow, tx: 0, ty: -this.rowHeight })
        }

        if (symbolsBelow.length) {
          translate.push({ symbols: symbolsBelow, tx: 0, ty: -this.rowHeight })
        }
      }
      else {
        translate.push({ symbols: symbolsAfterGestureInRow.concat(...symbolsBelow), tx: 0, ty: -this.rowHeight })
      }

    }
    if (changes.replaced?.oldSymbols.length) {
      this.behaviors.replaceSymbols(changes.replaced.oldSymbols, changes.replaced.newSymbols, false)
    }
    if (translate.length) {
      changes.translate = translate
      Promise.all(translate.map(tr => this.translator.translate(tr.symbols, tr.tx, tr.ty, false)))
    }
    this.history.push(this.model, changes)
  }

  async applyInsertGesture(gestureStroke: OIStroke, gesture: TGesture): Promise<void>
  {
    this.#logger.debug("applyInsertGesture", { gestureStroke, gesture })

    const symbolsRow = this.model.symbols.filter(s => this.isSymbolInRow(gestureStroke, s))
    const symbolsBeforeGestureInRow = symbolsRow.filter(s => gestureStroke.boundingBox.xMid > s.boundingBox.xMax)
    const groupsStrokesToSplit = symbolsRow.filter(s =>
      s.type === SymbolType.Group && isBetween(gestureStroke.boundingBox.xMid, s.boundingBox.xMin, s.boundingBox.xMax)
    ) as OISymbolGroup[] | undefined
    const symbolsAfterGestureInRow = symbolsRow.filter(s => gestureStroke.boundingBox.xMid < s.boundingBox.xMin)

    const symbolsBelow = this.model.symbols.filter(s => this.isSymbolBelow(gestureStroke, s))

    const translate: { symbols: TOISymbol[], tx: number, ty: number }[] = []
    const replaced: { oldSymbols: TOISymbol[], newSymbols: TOISymbol[] } = { oldSymbols: [], newSymbols: [] }

    if (gesture.strokeIds.length && gesture.subStrokes?.length) {
      // we can split only one stroke
      const symbolToSplit = this.model.getRootSymbol(gesture.strokeIds[0])
      if (symbolToSplit?.type === SymbolType.Group) {
        const groupWithStrokeToSplit = symbolToSplit as OISymbolGroup
        const groupStrokes = groupWithStrokeToSplit.extractStrokes().sort((a, b) => a.boundingBox.xMid - b.boundingBox.xMid)
        const strokeIndex = groupStrokes.findIndex(s => gesture.strokeIds[0] === s.id)
        const groupBefore = new OISymbolGroup(groupWithStrokeToSplit.style, groupStrokes.slice(0, strokeIndex))
        const strokeToSplit = groupStrokes[strokeIndex]
        const groupAfter = new OISymbolGroup(groupWithStrokeToSplit.style, groupStrokes.slice(strokeIndex + 1))
        const intersectPoint = {
          x: gesture.subStrokes[0].x.at(-1) as number,
          y: gesture.subStrokes[0].y.at(-1) as number
        }
        const nearestPoint = getClosestPoints([intersectPoint], strokeToSplit.pointers)
        const indexToSplit = strokeToSplit.pointers.findIndex(p => nearestPoint.p2.x === p.x && nearestPoint.p2.y === p.y)
        if (indexToSplit > -1) {
          const newStrokes = OIStroke.split(strokeToSplit, indexToSplit)
          groupBefore.symbols.push(newStrokes.before)
          this.translator.applyToSymbol(newStrokes.after, this.strokeSpaceWidth, 0)
          groupBefore.symbols.push(newStrokes.after)
          replaced.oldSymbols.push(groupWithStrokeToSplit)
          replaced.newSymbols.push(groupBefore)
          replaced.newSymbols.push(groupAfter)
        }
      }
      else if (symbolToSplit?.type === SymbolType.Stroke) {
        const strokeToSplit = symbolToSplit as OIStroke
        const intersectPoint = {
          x: gesture.subStrokes[0].x.at(-1) as number,
          y: gesture.subStrokes[0].y.at(-1) as number
        }
        const nearestPoint = getClosestPoints([intersectPoint], strokeToSplit.pointers)
        const indexToSplit = strokeToSplit.pointers.findIndex(p => nearestPoint.p2.x === p.x && nearestPoint.p2.y === p.y)
        if (indexToSplit > -1) {
          const newStrokes = OIStroke.split(strokeToSplit, indexToSplit)
          replaced.oldSymbols.push(strokeToSplit)
          this.translator.applyToSymbol(newStrokes.after, this.strokeSpaceWidth, 0)
          replaced.newSymbols.push(newStrokes.before, newStrokes.after)
        }
      }

      if (symbolsAfterGestureInRow?.length) {
        translate.push({ symbols: symbolsAfterGestureInRow.filter(s => s.id !== gesture.strokeIds[0]), tx: this.strokeSpaceWidth, ty: 0 })
      }
    }
    else if (groupsStrokesToSplit?.length) {
      const groupToSplit = groupsStrokesToSplit[0]
      const groupSymbolsBefore = groupToSplit.symbols.filter(s => s.boundingBox.xMid <= gestureStroke.boundingBox.xMid)
      const groupsSymbolsAfter = groupToSplit.symbols.filter(s => s.boundingBox.xMid > gestureStroke.boundingBox.xMid)

      replaced.oldSymbols.push(groupToSplit)
      if (groupSymbolsBefore.length) {
        const groupBefore = new OISymbolGroup(groupToSplit.style, groupSymbolsBefore.map(s => s.clone()))
        groupBefore.decorators = groupToSplit.decorators.map(d => new OIDecorator(d.kind, d.style))
        replaced.newSymbols.push(groupBefore)
      }
      if (groupsSymbolsAfter.length) {
        const grouAfter = new OISymbolGroup(groupToSplit.style, groupsSymbolsAfter.map(s => s.clone()))
        grouAfter.decorators = groupToSplit.decorators.map(d => new OIDecorator(d.kind, d.style))
        this.translator.applyToSymbol(grouAfter, this.strokeSpaceWidth, 0)
        replaced.newSymbols.push(grouAfter)
      }
      if (symbolsAfterGestureInRow?.length) {
        translate.push({ symbols: symbolsAfterGestureInRow.filter(s => s.id !== groupToSplit.id), tx: this.strokeSpaceWidth, ty: 0 })
      }
    }
    else if (symbolsAfterGestureInRow?.length) {
      let translateX = 0
      if (symbolsBeforeGestureInRow?.length) {
        translateX = Math.min(...symbolsBeforeGestureInRow.map(s => s.boundingBox.xMin)) - Math.min(...symbolsAfterGestureInRow.map(s => s.boundingBox.xMin))
      }
      translate.push({ symbols: symbolsAfterGestureInRow, tx: translateX, ty: this.rowHeight })

      if (symbolsBelow.length) {
        translate.push({ symbols: symbolsBelow, tx: 0, ty: this.rowHeight })
      }
    }
    else if (symbolsBeforeGestureInRow?.length) {
      if (symbolsBelow.length) {
        translate.push({ symbols: symbolsBelow, tx: 0, ty: this.rowHeight })
      }
    }
    const promises: Promise<void>[] = []
    const changes: TOIHistoryChanges = {}
    if (translate.length) {
      changes.translate = translate
      promises.push(...changes.translate.map(tr => this.translator.translate(tr.symbols, tr.tx, tr.ty, false)))

    }
    if (replaced.newSymbols.length) {
      changes.replaced = replaced
      promises.push(this.behaviors.replaceSymbols(changes.replaced.oldSymbols, changes.replaced.newSymbols, false))
    }
    this.history.push(this.model, changes)
    await Promise.all(promises)
  }

  async applyUnderlineGesture(gestureStroke: OIStroke, gesture: TGesture): Promise<void>
  {
    this.#logger.debug("applyUnderlineGesture", { gestureStroke, gesture })
    if (!gesture.strokeIds.length) {
      this.#logger.warn("applyUnderlineGesture", "Unable to apply underline because there are no strokes")
      return
    }

    const changes: TOIHistoryChanges = { decorator: [] }
    const symbolIds: string[] = []
    gesture.strokeIds.forEach(id =>
    {
      const sym = this.model.getRootSymbol(id)
      if (sym && [SymbolType.Group.toString(), SymbolType.Stroke.toString(), SymbolType.Text.toString()].includes(sym.type) && !symbolIds.includes(sym.id)) {
        const symWithDec = sym as (OIText | OIStroke | OISymbolGroup)
        const underline = new OIDecorator(DecoratorKind.Underline, this.currentStyle)
        const index = symWithDec.decorators.findIndex(d => d.kind === DecoratorKind.Underline)
        const added = index === -1
        added ? symWithDec.decorators.push(underline) : symWithDec.decorators.splice(index, 1)
        this.model.updateSymbol(symWithDec)
        this.renderer.drawSymbol(symWithDec)
        changes.decorator?.push({ symbol: symWithDec, decorator: underline, added })
        symbolIds.push(symWithDec.id)
      }
    })
    if (changes.decorator?.length) {
      this.history.push(this.model, changes)
    }
  }

  async applyStrikeThroughGesture(gestureStroke: OIStroke, gesture: TGesture): Promise<void | TOISymbol[]>
  {
    this.#logger.debug("applyStrikeThroughGesture", { gestureStroke, gesture })
    if (!gesture.strokeIds.length) {
      this.#logger.warn("applyStrikeThroughGesture", "Unable to apply strikethrough because there are no strokes")
      return
    }
    switch (this.strikeThroughAction) {
      case StrikeThroughAction.Draw: {
        const changes: TOIHistoryChanges = { decorator: [] }
        const symbolIds: string[] = []
        gesture.strokeIds.forEach(id =>
        {
          const symbol = this.model.getRootSymbol(id)
          if (symbol && [SymbolType.Group.toString(), SymbolType.Stroke.toString(), SymbolType.Text.toString()].includes(symbol.type) && !symbolIds.includes(symbol.id)) {
            const symWithDec = symbol as (OIText | OIStroke | OISymbolGroup)
            const strikethrough = new OIDecorator(DecoratorKind.Strikethrough, this.currentStyle)
            const index = symWithDec.decorators.findIndex(d => d.kind === DecoratorKind.Strikethrough)
            const added = index === -1
            added ? symWithDec.decorators.push(strikethrough) : symWithDec.decorators.splice(index, 1)
            this.model.updateSymbol(symWithDec)
            this.renderer.drawSymbol(symWithDec)
            changes.decorator?.push({ symbol: symWithDec, decorator: strikethrough, added })
            symbolIds.push(symWithDec.id)
          }
        })
        if (changes.decorator?.length) {
          this.history.push(this.model, changes)
        }
        break
      }
      case StrikeThroughAction.Erase: {
        return this.behaviors.removeSymbols(gesture.strokeIds)
      }
      default:
        this.#logger.warn("#applyStrikeThroughGesture", `Unknow OnStrikeThrough: ${ this.strikeThroughAction }, values allowed are: ${ StrikeThroughAction.Draw }, ${ StrikeThroughAction.Erase }`)
        break
    }
  }

  async apply(gestureStroke: OIStroke, gesture: TGesture): Promise<void>
  {
    this.#logger.info("apply", { gestureStroke, gesture })
    this.behaviors.updateSymbolsStyle([gestureStroke.id], { opacity: (gestureStroke.style.opacity || 1) / 2 }, false)
    await this.behaviors.groupStrokesByJIIXElement()
    await this.behaviors.removeSymbol(gestureStroke.id, false)
    switch (gesture.gestureType) {
      case "UNDERLINE":
        await this.applyUnderlineGesture(gestureStroke, gesture)
        break
      case "SCRATCH":
        await this.applyScratchGesture(gestureStroke, gesture)
        break
      case "JOIN":
        await this.applyJoinGesture(gestureStroke, gesture)
        break
      case "INSERT":
        await this.applyInsertGesture(gestureStroke, gesture)
        break
      case "STRIKETHROUGH":
        await this.applyStrikeThroughGesture(gestureStroke, gesture)
        break
      case "SURROUND":
        await this.applySurroundGesture(gestureStroke, gesture)
        break
      default:
        this.#logger.warn("apply", `Gesture unknow: ${ gesture.gestureType }`)
        break
    }

    this.behaviors.svgDebugger.apply()
    return Promise.resolve()
  }

  async getGestureFromContextLess(gestureStroke: OIStroke): Promise<TGesture | undefined>
  {
    const gesture = await this.recognizer.recognizeGesture([gestureStroke])
    if (!gesture?.gestures.length) return
    switch (gesture.gestures[0].type) {
      case "surround": {
        const symbolsToSelect = this.model.symbols.filter(s => gestureStroke.boundingBox.contains(s.boundingBox))
        if (symbolsToSelect.length) {
          return {
            gestureType: "SURROUND",
            gestureStrokeId: gestureStroke.id,
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
          return [SymbolType.Text.toString(), SymbolType.Stroke.toString(), SymbolType.Group.toString()].includes(s.type) &&
            isBetween(gestureStroke.boundingBox.xMid, s.boundingBox.xMin, s.boundingBox.xMax) &&
            isBetween(gestureStroke.boundingBox.yMid, s.boundingBox.y + s.boundingBox.height * 3 / 4, s.boundingBox.y + s.boundingBox.height * 5 / 4)
        })
        if (symbolsToUnderline.length) {
          return {
            gestureType: "UNDERLINE",
            gestureStrokeId: gestureStroke.id,
            strokeAfterIds: [],
            strokeBeforeIds: [],
            strokeIds: symbolsToUnderline.map(s => s.id),
          }
        }
        const symbolsToStrikeThrough = this.model.symbols.filter(s =>
        {
          return [SymbolType.Text.toString(), SymbolType.Stroke.toString(), SymbolType.Group.toString()].includes(s.type) &&
            isBetween(gestureStroke.boundingBox.xMid, s.boundingBox.xMin, s.boundingBox.xMax) &&
            isBetween(gestureStroke.boundingBox.yMid, s.boundingBox.y + s.boundingBox.height / 4, s.boundingBox.y + s.boundingBox.height * 3 / 4)
        })
        if (symbolsToStrikeThrough.length) {
          return {
            gestureType: "STRIKETHROUGH",
            gestureStrokeId: gestureStroke.id,
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
          return gestureStroke.boundingBox.overlaps(s.boundingBox) ||
            SymbolType.Text === s.type && gestureStroke.pointers.some(p => isPointInsidePolygon(p, s.vertices)) ||
            gestureStroke.boundingBox.contains(s.boundingBox)
        })
        if (symbolsToErase.length) {
          return {
            gestureType: "SCRATCH",
            gestureStrokeId: gestureStroke.id,
            strokeAfterIds: [],
            strokeBeforeIds: [],
            strokeIds: symbolsToErase.map(s => s.id),
          }
        }
        return
      }
      case "bottom-top": {
        const hasSymbolsInRow = this.model.symbols.some(s =>
          [SymbolType.Text.toString(), SymbolType.Stroke.toString(), SymbolType.Group.toString()].includes(s.type) &&
          isBetween(s.boundingBox.yMid, gestureStroke.boundingBox.yMin, gestureStroke.boundingBox.yMax)
        )
        if (hasSymbolsInRow) {
          return {
            gestureType: "JOIN",
            gestureStrokeId: gestureStroke.id,
            strokeAfterIds: [],
            strokeBeforeIds: [],
            strokeIds: [],
          }
        }
        return
      }
      case "top-bottom": {
        const hasSymbolsInRow = this.model.symbols.some(s =>
          [SymbolType.Text.toString(), SymbolType.Stroke.toString(), SymbolType.Group.toString()].includes(s.type) &&
          isBetween(s.boundingBox.yMid, gestureStroke.boundingBox.yMin, gestureStroke.boundingBox.yMax)
        )
        if (hasSymbolsInRow) {
          return {
            gestureType: "INSERT",
            gestureStrokeId: gestureStroke.id,
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
