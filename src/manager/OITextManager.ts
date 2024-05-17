import { LoggerClass } from "../Constants"
import { OIBehaviors } from "../behaviors"
import { LoggerManager } from "../logger"
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
    const el = this.renderer.getSymbolElement(clone) as SVGGElement
    el.setAttribute("visibility", "hidden")
    this.renderer.prependElement(el)
    return el
  }

  setCharsBoundingBox(text: OIText, textGroupEl: SVGGElement): OIText
  {
    const textEl = textGroupEl.querySelector("text")
    if (textEl) {
      for (let i = 0; i < textEl.getNumberOfChars(); i++) {
        const char = text.chars.at(i)
        if (char) {
          const ext = textEl.getExtentOfChar(i)
          char.boundingBox = new Box(ext)
        }
      }
    }
    return text
  }

  setBoundingBox(text: OIText): void
  {
    const element = this.drawSymbolHidden(text)
    text.boundingBox = this.getElementBoundingBox(element)
    this.setCharsBoundingBox(text, element)
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
      boundingBox
    }
    return this.getBoundingBox(new OIText({}, [charSymbol], { x: 0, y: 0 }, boundingBox))?.width as number
  }

  updateTextBoundingBox(textSymbol: OIText): OIText
  {
    const textGroupEl = this.drawSymbolHidden(textSymbol)
    textSymbol.boundingBox = this.getElementBoundingBox(textGroupEl)
    this.setCharsBoundingBox(textSymbol, textGroupEl)
    this.model.updateSymbol(textSymbol)
    return textSymbol
  }

  alignTextToRow(textSymbols: OIText[]): void
  {
    let lastX = textSymbols[0].point.x
    const symbolWhitoutSpaceBefore = [",", "."]
    textSymbols.forEach((s, i) =>
    {
      const textSymbol = s as OIText
      const fontSize = computeAverage(textSymbol.chars.map(c => c.fontSize))
      const whiteSpaceWidth = (i === 0 || symbolWhitoutSpaceBefore.includes(textSymbol.label)) ? 0 : this.getSpaceWidth(fontSize)
      textSymbol.point.y = Math.round(textSymbol.point.y / this.rowHeight) * this.rowHeight
      textSymbol.point.x = lastX + whiteSpaceWidth
      textSymbol.boundingBox.x = lastX + whiteSpaceWidth

      lastX = textSymbol.boundingBox.xMax

      const textGroupEl = this.renderer.drawSymbol(textSymbol) as SVGGElement
      textSymbol.boundingBox = this.getElementBoundingBox(textGroupEl)
      this.setCharsBoundingBox(textSymbol, textGroupEl)
      this.model.updateSymbol(s)
    })
  }

  adjustText(): void
  {
    const rows = this.model.getSymbolsByRowOrdered()

    rows.forEach((r) =>
    {
      const isTextRow = !r.symbols.some(s =>
      {
        return s.type !== SymbolType.Text || (s.type === SymbolType.Text && (s as OIText).rotation)
      })
      if (isTextRow) {
        this.alignTextToRow(r.symbols as OIText[])
      }
      else {
        r.symbols
          .filter(s => s.type === SymbolType.Text)
          .forEach(s =>
          {
            this.updateTextBoundingBox(s as OIText)
          })
      }
    })
  }

}
