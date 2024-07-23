import { Intention } from "../Constants"
import { OIBehaviors } from "../behaviors"
import { LoggerManager, LoggerClass } from "../logger"
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
  Box,
  TPoint,
} from "../primitive"
import { OIRecognizer } from "../recognizer"
import { OISVGRenderer } from "../renderer"
import { TStyle } from "../style"
import { OIHistoryManager, TOIHistoryChanges } from "../history"
import { computeAverage, isBetween } from "../utils"
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
        const ids = this.model.symbols.filter(s => gestureStroke.bounds.contains(s.bounds)).map(s => s.id)
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
          if (sym && [SymbolType.Group, SymbolType.Stroke, SymbolType.Text].includes(sym.type) && !symbolIds.includes(sym.id)) {
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
          if (sym && [SymbolType.Group, SymbolType.Stroke, SymbolType.Text].includes(sym.type) && !symbolIds.includes(sym.id)) {
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

  protected computeScratchOnStrokes(gesture: TGesture, stroke: OIStroke): OIStroke[]
  {
    const newStrokes: OIStroke[] = []
    const partPointersToRemove = gesture.subStrokes?.find(ss => ss.fullStrokeId === stroke.id)
    if (partPointersToRemove) {
      const strokePartToErase = new OIStroke()
      partPointersToRemove.x.forEach((x, i) => strokePartToErase.addPointer({ x, y: partPointersToRemove.y[i], p: 1, t: 1 }))
      const subStrokes = OIStroke.substract(stroke, strokePartToErase)
      if (subStrokes.before) newStrokes.push(subStrokes.before)
      if (subStrokes.after) newStrokes.push(subStrokes.after)
    }
    return newStrokes
  }

  protected computeScratchOnText(gestureStroke: OIStroke, textSymbol: OIText): OIText | undefined
  {
    const charsToRemove = textSymbol.getCharsOverlaps(gestureStroke.pointers)
    if (textSymbol.chars.length == charsToRemove.length) {
      return
    }
    else {
      charsToRemove.forEach(c =>
      {
        const cIndex = textSymbol.chars.findIndex(c1 => c1.id === c.id)
        textSymbol.chars.splice(cIndex, 1)
      })
      this.texter.updateTextBoundingBox(textSymbol)
      return textSymbol
    }
  }

  protected computeScratchOnSymbol(gestureStroke: OIStroke, gesture: TGesture, symbol: TOISymbol): { erased?: boolean, replaced?: TOISymbol[] }
  {
    switch (symbol.type) {
      case SymbolType.Stroke: {
        const strokesScratchedResult = this.computeScratchOnStrokes(gesture, symbol)
        if (strokesScratchedResult.length) {
          return {
            replaced: strokesScratchedResult
          }
        }
        else {
          return { erased: true }
        }
      }
      case SymbolType.Group: {
        const childrenNotTouch = symbol.extractSymbols().filter(s => !gestureStroke.bounds.overlaps(s.bounds))
        const childrenTouch = symbol.extractSymbols().filter(s => gestureStroke.bounds.overlaps(s.bounds))
        const results = childrenTouch.map(s =>
        {
          return {
            symbol: s,
            result: this.computeScratchOnSymbol(gestureStroke, gesture, s)
          }
        })
        if (childrenNotTouch.length === 0 && results.every(r => r.result.erased)) {
          return { erased: true }
        }
        else {
          const symbolsGroup: TOISymbol[] = childrenNotTouch
          results.forEach(r =>
          {
            if (r.result.replaced) {
              symbolsGroup.push(...r.result.replaced)
            }
          })
          const newGroup = new OISymbolGroup(symbolsGroup, symbol.style)
          newGroup.decorators = symbol.decorators
          return {
            replaced: [newGroup]
          }
        }
      }
      case SymbolType.Text: {
        const textScratchedResult = this.computeScratchOnText(gestureStroke, symbol)
        if (textScratchedResult) {
          return {
            replaced: [textScratchedResult]
          }
        }
        else {
          return {
            erased: true
          }
        }
      }
      case SymbolType.Shape:
      case SymbolType.Edge:
        return {
          erased: true
        }
    }
  }

  async applyScratch(gestureStroke: OIStroke, gesture: TGesture): Promise<void>
  {
    this.#logger.debug("applyScratchGesture", { gestureStroke, gesture })
    if (!gesture.strokeIds.length) {
      this.#logger.warn("applyScratchGesture", "Unable to apply underline because there are no strokes")
      return
    }
    const symbolsToUpdate: TOISymbol[] = []
    const symbolsToErase: TOISymbol[] = []
    const symbolsToReplace: { oldSymbols: TOISymbol[], newSymbols: TOISymbol[] } = { oldSymbols: [], newSymbols: [] }

    gesture.strokeIds.forEach(id =>
    {
      const sym = this.model.getRootSymbol(id)
      if (sym && !symbolsToErase.some(s => s.id === sym.id) && !symbolsToReplace.oldSymbols.some(s => s.id === sym.id)) {
        const result = this.computeScratchOnSymbol(gestureStroke, gesture, sym)
        if (result.erased) symbolsToErase.push(sym)
        else if (result.replaced) {
          symbolsToReplace.newSymbols.push(...result.replaced)
          symbolsToReplace.oldSymbols.push(sym)
        }
      }
    })

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
    this.texter.adjustText()
    this.history.push(this.model, changes)
    await Promise.all(promises)
  }

  async applyJoinGesture(gestureStroke: OIStroke, gesture: TGesture): Promise<void>
  {
    this.#logger.debug("applyJoinGesture", { gestureStroke, gesture })

    const symbolsAbove = this.model.symbols.filter(s => this.model.isSymbolAbove(gestureStroke, s))
    const symbolsRow = this.model.symbols.filter(s => gestureStroke.id !== s.id && this.model.isSymbolInRow(gestureStroke, s))
    const symbolsBeforeGestureInRow = symbolsRow.filter(s => s.bounds.xMax <= gestureStroke.bounds.xMid)
    const symbolsOnGestureInRow = symbolsRow.filter(s => s.bounds.xMax > gestureStroke.bounds.xMid && s.bounds.xMin <= gestureStroke.bounds.xMid)
    const symbolsAfterGestureInRow = symbolsRow.filter(s => s.bounds.xMin > gestureStroke.bounds.xMid)
    const symbolsBelow = this.model.symbols.filter(s => this.model.isSymbolBelow(gestureStroke, s))

    const changes: TOIHistoryChanges = {}
    const translate: { symbols: TOISymbol[], tx: number, ty: number }[] = []

    if (symbolsBeforeGestureInRow.length && symbolsAfterGestureInRow.length) {
      const lastSymbBefore = this.model.getLastSymbol(symbolsBeforeGestureInRow)!
      const firstSymbolAfter = this.model.getFirstSymbol(symbolsAfterGestureInRow)!

      const lastXBefore = Math.max(...symbolsBeforeGestureInRow.map(s => s.bounds.xMax))
      const firstXAfter = Math.min(...symbolsAfterGestureInRow.map(s => s.bounds.xMin))
      const translateX = lastXBefore - firstXAfter

      const lastSymbBeforeClone = lastSymbBefore.clone()
      const firstSymbolAfterClone = firstSymbolAfter.clone()
      this.translator.applyToSymbol(firstSymbolAfterClone, translateX, 0)
      const symbolsToGroup = lastSymbBefore.type === SymbolType.Group ? (lastSymbBeforeClone as OISymbolGroup).extractSymbols() : [lastSymbBeforeClone]
      symbolsToGroup.push(...(firstSymbolAfterClone.type === SymbolType.Group ? (firstSymbolAfterClone as OISymbolGroup).extractSymbols() : [firstSymbolAfterClone]))

      if (symbolsToGroup.every(s => s.type === SymbolType.Text)) {
        const texts = symbolsToGroup as OIText[]
        const text = new OIText(texts.flatMap(s => s.chars), texts[0].point, Box.createFromBoxes(texts.map(t => t.bounds)))
        this.texter.setBoundingBox(text)
        changes.replaced = {
          oldSymbols: [lastSymbBefore, firstSymbolAfter],
          newSymbols: [text]
        }
      }
      else {
        const group = new OISymbolGroup(symbolsToGroup, lastSymbBefore.style)
        if ([SymbolType.Group, SymbolType.Stroke, SymbolType.Text].includes(lastSymbBefore.type)) {
          (lastSymbBefore as OIStroke).decorators.forEach(d =>
          {
            group.decorators.push(new OIDecorator(d.kind, d.style))
          })
        }
        if ([SymbolType.Group, SymbolType.Stroke, SymbolType.Text].includes(firstSymbolAfter.type)) {
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
      }

      const rest = symbolsAfterGestureInRow.filter(s => s.id !== firstSymbolAfter.id)
      if (rest.length) {
        translate.push({ symbols: rest, tx: translateX, ty: 0 })
      }
    }
    else if (symbolsOnGestureInRow.length) {
      const symbolToJoin = symbolsOnGestureInRow[0]
      if (symbolToJoin?.type === SymbolType.Group) {
        const children = symbolToJoin.extractSymbols().map(c => c.clone())
        const childBefore = children.filter(c => c.bounds.xMid <= gestureStroke.bounds.xMid)
        const childAfter = children.filter(c => c.bounds.xMid > gestureStroke.bounds.xMid)
        const tx = Math.max(...childBefore.map(c => c.bounds.xMax)) - Math.min(...childAfter.map(c => c.bounds.xMin))
        childAfter.forEach(c => this.translator.applyToSymbol(c, tx, 0))

        const newGroup = new OISymbolGroup(children, symbolToJoin.style)
        newGroup.decorators = symbolToJoin.decorators.map(d => d.clone())

        changes.replaced = {
          oldSymbols: [symbolToJoin],
          newSymbols: [newGroup]
        }

        if (symbolsAfterGestureInRow.length) {

          translate.push({ symbols: symbolsAfterGestureInRow, tx, ty: 0 })
        }
        const symbolsAfterNextRow = symbolsBelow.filter(s => this.model.isSymbolBelow(symbolToJoin, s))
        if (symbolsAfterNextRow.length) {
          translate.push({ symbols: symbolsAfterNextRow, tx: 0, ty: -this.rowHeight })
        }
      }
    }
    else if (symbolsBeforeGestureInRow.length) {
      const lastSymbolBeforeGesture = this.model.getLastSymbol(symbolsBeforeGestureInRow)!
      const firstSymbolAfterGesture = this.model.getFirstSymbol(symbolsBelow)
      if (firstSymbolAfterGesture) {
        if (this.model.roundToLineGuide(lastSymbolBeforeGesture.bounds.yMid) >= this.model.roundToLineGuide(firstSymbolAfterGesture.bounds.yMid - this.rowHeight)) {
          const symbolInNextRow = symbolsBelow.filter(s => this.model.isSymbolInRow(firstSymbolAfterGesture, s))
          if (symbolInNextRow.length) {
            const translateX = lastSymbolBeforeGesture.bounds.xMax + this.strokeSpaceWidth - firstSymbolAfterGesture.bounds.xMin
            translate.push({ symbols: symbolInNextRow, tx: translateX, ty: -this.rowHeight })
          }
          const symbolsAfterNextRow = symbolsBelow.filter(s => this.model.isSymbolBelow(firstSymbolAfterGesture, s))
          if (symbolsAfterNextRow.length) {
            translate.push({ symbols: symbolsAfterNextRow, tx: 0, ty: -this.rowHeight })
          }
        }
      }
      else {
        translate.push({ symbols: symbolsBelow, tx: 0, ty: -this.rowHeight })
      }
    }
    else if (symbolsAfterGestureInRow.length) {
      const firstSymbolAfterGesture = this.model.getFirstSymbol(symbolsAfterGestureInRow)!
      const lastSymbolAbove = this.model.getLastSymbol(symbolsAbove)
      if (lastSymbolAbove) {
        if (this.model.roundToLineGuide(lastSymbolAbove.bounds.yMid) >= this.model.roundToLineGuide(firstSymbolAfterGesture.bounds.yMid - this.rowHeight)) {
          const translateX = lastSymbolAbove.bounds.xMax + this.strokeSpaceWidth - firstSymbolAfterGesture.bounds.xMin
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

  protected createStrokesFromGestureSubStroke(strokeOrigin: OIStroke, subStrokes: { x: number[], y: number[] }[]): OIStroke[]
  {
    const strokes: OIStroke[] = []
    if (subStrokes[0]) {
      const subStroke = new OIStroke(strokeOrigin.style)
      subStrokes![0].x.forEach((x, i) =>
      {
        subStroke.pointers.push({
          x,
          y: subStrokes![0].y[i],
          p: strokeOrigin.pointers.at(i)?.p || 1,
          t: strokeOrigin.pointers.at(i)?.t || Math.max(...subStroke.pointers.map(p => p.t + 20))
        })
      })
      strokes.push(subStroke)
    }
    if (subStrokes[1]) {
      const subStroke = new OIStroke(strokeOrigin.style)
      subStrokes[1].x.forEach((x, i) =>
      {
        subStroke.pointers.push({
          x,
          y: subStrokes![1].y[i],
          p: strokeOrigin.pointers.at(subStroke.pointers.length + i)?.p || 1,
          t: strokeOrigin.pointers.at(subStroke.pointers.length + i)?.t || Math.max(...subStroke.pointers.map(p => p.t + 20))
        })
      })
      strokes.push(subStroke)
    }
    return strokes
  }

  async applyInsertGesture(gestureStroke: OIStroke, gesture: TGesture): Promise<void>
  {
    this.#logger.debug("applyInsertGesture", { gestureStroke, gesture })

    const symbolsRow = this.model.symbols.filter(s => gestureStroke.id !== s.id && this.model.isSymbolInRow(gestureStroke, s))
    const symbolsBeforeGestureInRow = symbolsRow.filter(s => gestureStroke.bounds.xMid > s.bounds.xMax)
    const textToSplit = symbolsRow.find(s => s.type === SymbolType.Text && isBetween(gestureStroke.bounds.xMid, s.bounds.xMin, s.bounds.xMax)) as OIText | undefined
    const groupToSplit = symbolsRow.find(s => s.type === SymbolType.Group && isBetween(gestureStroke.bounds.xMid, s.bounds.xMin, s.bounds.xMax)) as OISymbolGroup | undefined
    const symbolsAfterGestureInRow = symbolsRow.filter(s => gestureStroke.bounds.xMid < s.bounds.xMin)
    const symbolsBelow = this.model.symbols.filter(s => this.model.isSymbolBelow(gestureStroke, s))

    const translate: { symbols: TOISymbol[], tx: number, ty: number }[] = []
    const replaced: { oldSymbols: TOISymbol[], newSymbols: TOISymbol[] } = { oldSymbols: [], newSymbols: [] }

    if (gesture.strokeIds.length && gesture.subStrokes?.length) {
      // if we have subStrokes it's on stroke
      // we can split only one stroke or group of strokes
      const symbolToSplit = this.model.getRootSymbol(gesture.strokeIds[0])
      if (symbolToSplit?.type === SymbolType.Group) {
        const groupWithStrokeToSplit = symbolToSplit as OISymbolGroup
        const groupSymbols = groupWithStrokeToSplit.extractSymbols()

        const symbolsBefore: TOISymbol[] = []
        const symbolsAfter: TOISymbol[] = []

        groupSymbols.forEach(s =>
        {
          if (s.id === gesture.subStrokes![0].fullStrokeId) {
            const subStroke = this.createStrokesFromGestureSubStroke(s as OIStroke, gesture.subStrokes!)
            if (subStroke[0]) {
              symbolsBefore.push(subStroke[0])
            }
            if (subStroke[1]) {
              this.translator.applyToSymbol(subStroke[1], this.strokeSpaceWidth, 0)
              symbolsAfter.push(subStroke[1])
            }
          }
          else if (s.bounds.xMid < gestureStroke.bounds.xMid) {
            symbolsBefore.push(s)
          }
          else if (s.bounds.xMid > gestureStroke.bounds.xMid) {
            this.translator.applyToSymbol(s, this.strokeSpaceWidth, 0)
            symbolsAfter.push(s)

          }
        })

        if (symbolsBefore.length) {
          replaced.newSymbols.push(new OISymbolGroup(symbolsBefore, groupWithStrokeToSplit.style))
        }
        if (symbolsAfter.length) {
          replaced.newSymbols.push(new OISymbolGroup(symbolsAfter, groupWithStrokeToSplit.style))
        }
        if (replaced.newSymbols.length) {
          replaced.oldSymbols.push(symbolToSplit)
        }
      }
      else if (symbolToSplit?.type === SymbolType.Stroke) {
        const subStroke = this.createStrokesFromGestureSubStroke(symbolToSplit as OIStroke, gesture.subStrokes!)
        if (subStroke[0]) {
          replaced.newSymbols.push(subStroke[0])
        }
        if (subStroke[1]) {
          this.translator.applyToSymbol(subStroke[1], this.strokeSpaceWidth, 0)
          replaced.newSymbols.push(subStroke[1])
        }
        replaced.oldSymbols.push(symbolToSplit)
      }
      if (symbolsAfterGestureInRow.length) {
        translate.push({ symbols: symbolsAfterGestureInRow, tx: this.strokeSpaceWidth, ty: 0})
      }
    }
    else if (groupToSplit) {
      const groupSymbolsBefore = groupToSplit.children.filter(s => s.bounds.xMid <= gestureStroke.bounds.xMid)
      const groupsSymbolsAfter = groupToSplit.children.filter(s => s.bounds.xMid > gestureStroke.bounds.xMid)

      replaced.oldSymbols.push(groupToSplit)
      if (groupSymbolsBefore.length) {
        const groupBefore = new OISymbolGroup(groupSymbolsBefore.map(s => s.clone()), groupToSplit.style)
        groupBefore.decorators = groupToSplit.decorators.map(d => new OIDecorator(d.kind, d.style))
        replaced.newSymbols.push(groupBefore)
      }
      if (groupsSymbolsAfter.length) {
        const grouAfter = new OISymbolGroup(groupsSymbolsAfter.map(s => s.clone()), groupToSplit.style)
        grouAfter.decorators = groupToSplit.decorators.map(d => new OIDecorator(d.kind, d.style))
        this.translator.applyToSymbol(grouAfter, this.strokeSpaceWidth, 0)
        replaced.newSymbols.push(grouAfter)
      }
      if (symbolsAfterGestureInRow?.length) {
        translate.push({ symbols: symbolsAfterGestureInRow.filter(s => s.id !== groupToSplit.id), tx: this.strokeSpaceWidth, ty: 0 })
      }
    }
    else if (textToSplit) {
      const charsBefore = textToSplit.chars.filter(c => c.bounds.x + c.bounds.width / 2 <= gestureStroke.bounds.xMid)
      const charsAfter = textToSplit.chars.filter(c => c.bounds.x + c.bounds.width / 2 > gestureStroke.bounds.xMid)
      const newTexts: OIText[] = []
      if (charsBefore.length && charsAfter.length) {
        const textBefore = new OIText(charsBefore, textToSplit.point, Box.createFromBoxes(charsBefore.map(c => c.bounds)))
        this.texter.setBoundingBox(textBefore)
        newTexts.push(textBefore)
        const pointAfter: TPoint = {
          x: textBefore.point.x + textBefore.bounds.width + this.texter.getSpaceWidth(computeAverage(textBefore.chars.map(c => c.fontSize))),
          y: textBefore.point.y
        }
        const textAfter = new OIText(charsAfter, pointAfter, Box.createFromBoxes(charsAfter.map(c => c.bounds)))
        this.texter.setBoundingBox(textAfter)
        newTexts.push(textAfter)
        replaced.newSymbols = newTexts
        replaced.oldSymbols = [textToSplit]
      }
      if (symbolsAfterGestureInRow?.length) {
        translate.push({ symbols: symbolsAfterGestureInRow.filter(s => s.id !== gestureStroke.id), tx: this.strokeSpaceWidth, ty: 0 })
      }
    }
    else if (symbolsAfterGestureInRow.length) {
      let translateX = 0
      if (symbolsBeforeGestureInRow.length) {
        translateX = Math.min(...symbolsBeforeGestureInRow.map(s => s.bounds.xMin)) - Math.min(...symbolsAfterGestureInRow.map(s => s.bounds.xMin))
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
      if (sym && [SymbolType.Group, SymbolType.Stroke, SymbolType.Text].includes(sym.type) && !symbolIds.includes(sym.id)) {
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
          if (symbol && [SymbolType.Group, SymbolType.Stroke, SymbolType.Text].includes(symbol.type) && !symbolIds.includes(symbol.id)) {
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
        await this.applyScratch(gestureStroke, gesture)
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
    const gesture = await this.recognizer.recognizeGesture(gestureStroke)
    if (!gesture) return
    switch (gesture.gestureType) {
      case "surround": {
        const hasSymbolsToSurrond = this.model.symbols.some(s => s.id !== gestureStroke.id && gestureStroke.bounds.contains(s.bounds))
        if (hasSymbolsToSurrond) {
          return {
            gestureType: "SURROUND",
            gestureStrokeId: gestureStroke.id,
            strokeAfterIds: [],
            strokeBeforeIds: [],
            strokeIds: [],
          }
        }
        return
      }
      case "left-right":
      case "right-left": {
        const symbolsToUnderline = this.model.symbols.filter(s =>
        {
          return [SymbolType.Text, SymbolType.Stroke, SymbolType.Group].includes(s.type) &&
            isBetween(s.bounds.xMid, gestureStroke.bounds.xMin, gestureStroke.bounds.xMax) &&
            isBetween(gestureStroke.bounds.yMid, s.bounds.y + s.bounds.height * 3 / 4, s.bounds.y + s.bounds.height * 5 / 4)
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
          return [SymbolType.Text, SymbolType.Stroke, SymbolType.Group].includes(s.type) &&
            isBetween(s.bounds.xMid, gestureStroke.bounds.xMin, gestureStroke.bounds.xMax) &&
            isBetween(gestureStroke.bounds.yMid, s.bounds.y + s.bounds.height / 4, s.bounds.y + s.bounds.height * 3 / 4)
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
          return s.id !== gestureStroke.id &&
            (
              gestureStroke.bounds.overlaps(s.bounds) && [SymbolType.Stroke, SymbolType.Text, SymbolType.Group].includes(s.type) ||
              gestureStroke.bounds.contains(s.bounds) && [SymbolType.Shape, SymbolType.Edge].includes(s.type)
            )
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
          s.id !== gestureStroke.id &&
          [SymbolType.Text, SymbolType.Stroke, SymbolType.Group].includes(s.type) &&
          isBetween(s.bounds.yMid, gestureStroke.bounds.yMin, gestureStroke.bounds.yMax)
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
          s.id !== gestureStroke.id &&
          [SymbolType.Text, SymbolType.Stroke, SymbolType.Group].includes(s.type) &&
          isBetween(s.bounds.yMid, gestureStroke.bounds.yMin, gestureStroke.bounds.yMax)
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
