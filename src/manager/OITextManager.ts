import { OIBehaviors } from "../behaviors"
import { LoggerClass, LoggerManager } from "../logger"
import { OIModel } from "../model"
import { Box, OIText, SymbolType, TOISymbolChar } from "../primitive"
import { OISVGRenderer } from "../renderer"
import { computeAverage } from "../utils"

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
    const el = this.renderer.util.getSymbolElement(clone) as SVGGElement
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
      fontWeight: 0,
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

  alignTextToRow(rowIndex: number, textSymbols: OIText[]): void
  {
    if (textSymbols.length) {
      let lastX = textSymbols[0].point.x
      const symbolWhitoutSpaceBefore = [",", "."]
      textSymbols.forEach((text, i) =>
      {
        const fontSize = computeAverage(text.chars.map(c => c.fontSize))
        const whiteSpaceWidth = (i === 0 || symbolWhitoutSpaceBefore.includes(text.label)) ? 0 : this.getSpaceWidth(fontSize)
        text.point.y = rowIndex * this.rowHeight
        text.point.x = lastX + whiteSpaceWidth
        text.bounds.x = lastX + whiteSpaceWidth

        lastX = text.bounds.xMax

        const textGroupEl = this.renderer.drawSymbol(text) as SVGGElement
        text.bounds = this.getElementBoundingBox(textGroupEl)
        this.setCharsBounds(text, textGroupEl)
        this.model.updateSymbol(text)
      })
    }
  }

  adjustText(): void
  {
    const rows = this.model.getSymbolsByRowOrdered()

    rows.forEach((r) =>
    {
      const isTextRow = r.symbols.every(s =>
      {
        if (s.type === SymbolType.Edge) return false
        if (s.type === SymbolType.Shape) return false
        if (s.type === SymbolType.Text && (s as OIText).rotation) return false
        if (s.type === SymbolType.Group) {
          return s.extractSymbols().some(gs => gs.type === SymbolType.Edge || gs.type === SymbolType.Shape || (gs.type === SymbolType.Text && gs.rotation))
        }
        return true
      })
      if (isTextRow) {
        this.alignTextToRow(r.rowIndex, r.symbols.filter(s => s.type == SymbolType.Text) as OIText[])
      }
      else {
        r.symbols.forEach(s =>
        {
          if (s.type === SymbolType.Text) {
            this.updateBounds(s)
          }
        })
      }
    })
  }

}
