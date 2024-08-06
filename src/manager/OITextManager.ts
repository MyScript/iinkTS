import { OIBehaviors } from "../behaviors"
import { LoggerClass, LoggerManager } from "../logger"
import { OIModel } from "../model"
import { Box, OIText, SymbolType, TOISymbol, TOISymbolChar } from "../primitive"
import { OISVGRenderer } from "../renderer"

/**
 * @group Manager
 */
export class OITextManager
{
  #logger = LoggerManager.getLogger(LoggerClass.CONVERTER)
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

  get rowHeight(): number
  {
    return this.behaviors.configuration.rendering.guides.gap
  }

  get model(): OIModel
  {
    return this.behaviors.model
  }

  protected drawSymbolHidden(text: OIText): SVGGElement
  {
    const clone = text.clone()
    clone.id = "text-to-measure"
    clone.chars.forEach(c => c.id += "to-measure")
    this.renderer.layer.querySelector(`#${ clone.id }`)?.remove()
    const el = this.renderer.buildElementFromSymbol(clone)!
    el.setAttribute("visibility", "hidden")
    this.renderer.prependElement(el)
    return el
  }

  setCharsBounds(text: OIText, textGroupEl: SVGGElement): OIText
  {
    const textEl = textGroupEl.querySelector("text")
    if (textEl) {
      for (let i = 0; i < textEl.getNumberOfChars(); i++) {
        const char = text.chars.at(i)
        if (char) {
          const ext = textEl.getExtentOfChar(i)
          char.bounds = new Box(ext)
        }
      }
    }
    return text
  }

  setBounds(text: OIText): void
  {
    const element = this.drawSymbolHidden(text)
    text.bounds = this.getElementBoundingBox(element)
    this.setCharsBounds(text, element)
  }

  getElementBoundingBox(textElement: SVGElement): Box
  {
    return new Box(textElement.querySelector("text")!.getBBox({ stroke: true, markers: true, clipped: true, fill: true }))
  }

  getBoundingBox(text: OIText): Box
  {
    const element = this.drawSymbolHidden(text)
    return this.getElementBoundingBox(element)
  }

  getSpaceWidth(fontSize: number): number
  {
    const boundingBox = new Box({ height: 0, width: 0, x: 0, y: 0 })
    const charSymbol: TOISymbolChar = {
      id: `text-char-space`,
      label: "-",
      color: "",
      fontSize,
      fontWeight: "normal",
      bounds: boundingBox
    }
    return this.getBoundingBox(new OIText([charSymbol], { x: 0, y: 0 }, boundingBox))?.width as number
  }

  updateBounds(textSymbol: OIText): OIText
  {
    this.setBounds(textSymbol)
    this.model.updateSymbol(textSymbol)
    return textSymbol
  }

  moveTextAfter(text: OIText, tx: number): TOISymbol[] | undefined
  {
    const row = this.model.getSymbolsByRowOrdered().find(r => r.rowIndex === this.model.getSymbolRowIndex(text))
    if (row) {
      const textsAfter = row.symbols.filter(s => s.type === SymbolType.Text && s.bounds.xMid > text.bounds.xMid) as OIText[]
      textsAfter.forEach(symbol => {
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
