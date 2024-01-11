import { LoggerClass } from "../Constants"
import { OIBehaviors } from "../behaviors"
import { LoggerManager } from "../logger"
import { OIModel } from "../model"
import { Box, OIText, SymbolType, TBoundingBox, TOISymbolChar } from "../primitive"
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
    return this.renderer.getSymbolBounds(new OIText({}, [charSymbol], { x: 0, y: 0 }, boundingBox))?.width as number
  }

  updateTextBoundingBox(textSymbol: OIText): OIText
  {
    const clone = textSymbol.clone()
    clone.id = "updateTextBoundingBox"
    clone.chars.forEach(c => c.id = "updateTextBoundingBox-" + c.id)
    const textGroupEl = this.renderer.getSymbolElement(clone) as SVGGElement
    textGroupEl.setAttribute("visibility", "hidden")
    this.renderer.appendElement(textGroupEl)

    const box = new Box(this.renderer.getSymbolElementBounds(textGroupEl) as TBoundingBox)
    textSymbol.boundingBox = box
    const textEl = textGroupEl.querySelector("text")
    if (textEl) {
      for (let i = 0; i < textEl.getNumberOfChars(); i++) {
        const char = textSymbol.chars.at(i)
        if (char) {
          const ext = textEl.getExtentOfChar(i)
          char.boundingBox = new Box(ext)
        }
      }
    }

    this.renderer.removeElement(textGroupEl.id)
    this.model.updateSymbol(textSymbol)
    return textSymbol
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
        let lastX = (r.symbols[0] as OIText).point.x
        r.symbols.forEach((s, i) =>
        {
          const textSymbol = s as OIText
          const fontSize = computeAverage(textSymbol.chars.map(c => c.fontSize))
          const whiteSpaceWidth = i === 0 ? 0 : this.getSpaceWidth(fontSize)
          textSymbol.point.y = Math.round(textSymbol.point.y / this.rowHeight) * this.rowHeight
          textSymbol.point.x = lastX + whiteSpaceWidth
          textSymbol.boundingBox.x = lastX + whiteSpaceWidth

          lastX = textSymbol.boundingBox.xMax

          const textGroupEl = this.renderer.drawSymbol(textSymbol) as SVGGElement
          const box = new Box(this.renderer.getSymbolElementBounds(textGroupEl))
          const textEl = textGroupEl.querySelector("text")
          textSymbol.boundingBox = box
          if (textEl) {
            for (let i = 0; i < textEl.getNumberOfChars(); i++) {
              const char = textSymbol.chars.at(i)
              if (char) {
                const ext = textEl.getExtentOfChar(i)
                char.boundingBox = new Box(ext)
                char.fontSize = fontSize
              }
            }
          }

          this.model.updateSymbol(s)
        })
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
