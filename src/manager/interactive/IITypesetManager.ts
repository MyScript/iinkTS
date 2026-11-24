import type { TInteractiveInkCanvas } from "@/canvas"
import type { TBox } from "@/core"
import { OBBOps } from "@/core"
import { LoggerCategory } from "@/logger"
import type { TMath, TSymbol, TSymbolChar, TText } from "@/symbol"
import { isText } from "@/symbol"
import { SymbolGeometry, symbolRegistry, TextUtil } from "@/symbol-utils"

import { IIAbstractManager } from "./IIAbstractManager"

/**
 * @group Manager
 */
export class IITypesetManager extends IIAbstractManager {
  protected managerName = "IITypesetManager"

  constructor(canvas: TInteractiveInkCanvas) {
    super(canvas, LoggerCategory.TEXT)
    this.logger.info("constructor")
  }

  get rowHeight(): number {
    return this.canvas.configuration.rendering.guides.gap
  }

  getSymbolRowIndex(symbol: TSymbol): number {
    // Use symbol bounds yMid for row calculation
    return Math.round(SymbolGeometry.boundsOf(symbol).center.y / this.rowHeight)
  }

  getSymbolsByRowOrdered(): {
    rowIndex: number
    symbols: TSymbol[]
  }[] {
    const rowsMap = new Map<number, TSymbol[]>()

    for (const s of this.model.symbols) {
      // Whole-document scan — one unregistered symbol type must not abort row bucketing for
      // the rest of the document.
      if (!symbolRegistry.has(s.type)) {
        continue
      }
      const rowIndex = this.getSymbolRowIndex(s)
      const row = rowsMap.get(rowIndex)
      if (row) {
        row.push(s)
      } else {
        rowsMap.set(rowIndex, [s])
      }
    }

    const rows: {
      rowIndex: number
      symbols: TSymbol[]
    }[] = []
    rowsMap.forEach((symbols, rowIndex) => {
      symbols.sort((s1, s2) => SymbolGeometry.boundsOf(s1).center.x - SymbolGeometry.boundsOf(s2).center.x)
      rows.push({ rowIndex, symbols })
    })

    return rows.sort((r1, r2) => r1.rowIndex - r2.rowIndex)
  }

  protected drawSymbolHidden(symbol: TText | TMath): SVGGElement {
    const clone = structuredClone(symbol) as TText | TMath
    clone.id = "symbol-to-measure"
    if (isText(clone)) {
      clone.chars.forEach((c) => (c.id += "-to-measure"))
    }
    clone.decorators = []
    this.renderer.layer.querySelector(`#${clone.id}`)?.remove()
    const el = this.renderer.buildElementFromSymbol(clone)!
    el.setAttribute("visibility", "hidden")
    this.renderer.prependElement(el)
    return el as SVGGElement
  }

  setCharsBounds(text: TText, textGroupEl: SVGGElement): TText {
    const textEl = textGroupEl.querySelector("text")
    if (textEl) {
      for (let i = 0; i < textEl.getNumberOfChars(); i++) {
        const char = text.chars.at(i)
        if (char) {
          const ext = textEl.getExtentOfChar(i)
          char.bounds = {
            x: ext.x,
            y: ext.y,
            width: ext.width,
            height: ext.height,
          }
        }
      }
    }
    return text
  }

  setBounds(symbol: TText | TMath): void {
    const el = this.drawSymbolHidden(symbol)
    if (isText(symbol)) {
      symbol.bounds = OBBOps.fromBox(this.getElementBoundingBox(el))
      this.setCharsBounds(symbol, el)
    } else {
      const bbox = el.getBBox()
      symbol.bounds = OBBOps.fromBox({
        x: bbox.x,
        y: bbox.y,
        width: bbox.width,
        height: bbox.height,
      })
    }
  }

  getElementBoundingBox(textElement: SVGElement): TBox {
    const bbox = textElement.querySelector("text")!.getBBox({
      stroke: true,
      markers: true,
      clipped: true,
      fill: true,
    })
    return {
      x: bbox.x,
      y: bbox.y,
      width: bbox.width,
      height: bbox.height,
    } as TBox
  }

  getBoundingBox(text: TText): TBox {
    const element = this.drawSymbolHidden(text)
    return this.getElementBoundingBox(element)
  }

  getSpaceWidth(fontSize: number): number {
    const boundingBox: TBox = {
      height: 0,
      width: 0,
      x: 0,
      y: 0,
    }
    const charSymbol: TSymbolChar = {
      id: `text-char-space`,
      label: "-",
      color: "",
      fontSize,
      fontWeight: "normal",
      bounds: boundingBox,
    }
    return this.getBoundingBox(TextUtil.createText([charSymbol], { x: 0, y: 0 }, boundingBox))?.width as number
  }

  updateBounds<T extends TText | TMath>(typesetSymbol: T): T {
    this.setBounds(typesetSymbol)
    this.model.updateSymbol(typesetSymbol)
    return typesetSymbol
  }

  /**
   * Shifts the texts that follow `text` on its row, and returns each one's before/after pair.
   *
   * Pairs rather than just the moved symbols: only this method knows which ones it picked, so it is
   * the only place a caller's history entry can get its pre-move snapshots from.
   */
  moveTextAfter(text: TText, tx: number): { before: TSymbol; after: TSymbol }[] | undefined {
    // `text` can be a draft mid-edit (see callers in InteractiveInkCanvas), so its geometry is
    // never cached — one boundsOf call here, reused for both the row lookup and the position
    // comparison below, instead of getSymbolRowIndex(text) computing it again independently.
    const textBounds = SymbolGeometry.boundsOf(text)
    const textRowIndex = Math.round(textBounds.center.y / this.rowHeight)
    const row = this.getSymbolsByRowOrdered().find((r) => r.rowIndex === textRowIndex)
    if (row) {
      const textsAfter = row.symbols.filter(
        (s) => isText(s) && SymbolGeometry.boundsOf(s).center.x > textBounds.center.x
      ) as TText[]
      return textsAfter.flatMap((committed) => {
        // Drafted by id rather than shifted where it lies. `getSymbolsByRowOrdered` reads
        // `model.symbols`, which hands out the store's deep-frozen committed records, so
        // `symbol.point.x += tx` threw `TypeError: Cannot assign to read only property 'x'` —
        // and `setBounds` would have thrown on `bounds` and on every char's `bounds` right after.
        const draft = this.model.draftSymbol(committed.id)
        if (!draft || !isText(draft)) {
          return []
        }
        draft.point.x += tx
        // Measures the moved text and commits the draft in one call.
        this.updateBounds(draft)
        this.renderer.drawSymbol(draft)
        // `committed` is already a frozen value, so it is the snapshot — nothing to clone.
        return [{ before: committed, after: this.model.getSymbol(committed.id) ?? draft }]
      })
    }
    return
  }
}
