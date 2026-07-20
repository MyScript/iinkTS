import type { TInteractiveInkEditor } from "@/editor/TInteractiveInkEditor"
import { LoggerCategory } from "@/logger"
import type { TBox, TMath, TSymbol, TSymbolChar, TText } from "@/symbol"
import { isText } from "@/symbol"
import { MathOps } from "@/symbol/math/Math"
import { OBBOps } from "@/symbol/primitives/OBB"
import { TextOps } from "@/symbol/text/Text"

import { IIAbstractManager } from "./IIAbstractManager"

/**
 * @group Manager
 */
export class IITypesetManager extends IIAbstractManager {
  protected managerName = "IITypesetManager"

  constructor(editor: TInteractiveInkEditor) {
    super(editor, LoggerCategory.TEXT)
    this.logger.info("constructor")
  }

  get rowHeight(): number {
    return this.editor.configuration.rendering.guides.gap
  }

  getSymbolRowIndex(symbol: TSymbol): number {
    // Use symbol bounds yMid for row calculation
    return Math.round(symbol.bounds.center.y / this.rowHeight)
  }

  getSymbolsByRowOrdered(): {
    rowIndex: number
    symbols: TSymbol[]
  }[] {
    const rowsMap = new Map<number, TSymbol[]>()

    for (const s of this.model.symbols) {
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
      symbols.sort((s1, s2) => s1.bounds.center.x - s2.bounds.center.x)
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
      symbol.bounds.angle = symbol.rotation?.degree ?? 0
      this.setCharsBounds(symbol, el)
      TextOps.updateDerivedFields(symbol)
    } else {
      const bbox = el.getBBox()
      symbol.bounds = OBBOps.fromBox({
        x: bbox.x,
        y: bbox.y,
        width: bbox.width,
        height: bbox.height,
      })
      symbol.bounds.angle = symbol.rotation?.degree ?? 0
      MathOps.updateDerivedFields(symbol)
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
    return this.getBoundingBox(TextOps.create([charSymbol], { x: 0, y: 0 }, boundingBox))?.width as number
  }

  updateBounds<T extends TText | TMath>(typesetSymbol: T): T {
    this.setBounds(typesetSymbol)
    this.model.updateSymbol(typesetSymbol)
    return typesetSymbol
  }

  moveTextAfter(text: TText, tx: number): TSymbol[] | undefined {
    const row = this.getSymbolsByRowOrdered().find((r) => r.rowIndex === this.getSymbolRowIndex(text))
    if (row) {
      const textsAfter = row.symbols.filter((s) => isText(s) && s.bounds.center.x > text.bounds.center.x) as TText[]
      textsAfter.forEach((symbol) => {
        symbol.point.x += tx
        this.updateBounds(symbol)
        this.model.updateSymbol(symbol)
        this.renderer.drawSymbol(symbol)
      })
      return textsAfter
    }
    return
  }
}
