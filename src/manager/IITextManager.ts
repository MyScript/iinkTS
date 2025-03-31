import { LoggerCategory, LoggerManager } from "../logger"
import { IIModel } from "../model"
import { Box, IIText, SymbolType, TIISymbol, TIISymbolChar } from "../symbol"
import { SVGRenderer } from "../renderer"
import { InteractiveInkEditor } from "../editor/InteractiveInkEditor"

/**
 * @group Manager
 */
export class IITextManager
{
  #logger = LoggerManager.getLogger(LoggerCategory.CONVERTER)
  editor: InteractiveInkEditor

  constructor(editor: InteractiveInkEditor)
  {
    this.#logger.info("constructor")
    this.editor = editor
  }

  get renderer(): SVGRenderer
  {
    return this.editor.renderer
  }

  get rowHeight(): number
  {
    return this.editor.configuration.rendering.guides.gap
  }

  get model(): IIModel
  {
    return this.editor.model
  }

  protected drawSymbolHidden(text: IIText): SVGGElement
  {
    const clone = text.clone()
    clone.id = "text-to-measure"
    clone.chars.forEach(c => c.id += "-to-measure")
    clone.decorators = []
    this.renderer.layer.querySelector(`#${ clone.id }`)?.remove()
    const el = this.renderer.buildElementFromSymbol(clone)!
    el.setAttribute("visibility", "hidden")
    this.renderer.prependElement(el)
    return el
  }

  setCharsBounds(text: IIText, textGroupEl: SVGGElement): IIText
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

  setBounds(text: IIText): void
  {
    const element = this.drawSymbolHidden(text)
    text.bounds = this.getElementBoundingBox(element)
    this.setCharsBounds(text, element)
  }

  getElementBoundingBox(textElement: SVGElement): Box
  {
    return new Box(textElement.querySelector("text")!.getBBox({ stroke: true, markers: true, clipped: true, fill: true }))
  }

  getBoundingBox(text: IIText): Box
  {
    const element = this.drawSymbolHidden(text)
    return this.getElementBoundingBox(element)
  }

  getSpaceWidth(fontSize: number): number
  {
    const boundingBox = new Box({ height: 0, width: 0, x: 0, y: 0 })
    const charSymbol: TIISymbolChar = {
      id: `text-char-space`,
      label: "-",
      color: "",
      fontSize,
      fontWeight: "normal",
      bounds: boundingBox
    }
    return this.getBoundingBox(new IIText([charSymbol], { x: 0, y: 0 }, boundingBox))?.width as number
  }

  updateBounds(textSymbol: IIText): IIText
  {
    this.setBounds(textSymbol)
    this.model.updateSymbol(textSymbol)
    return textSymbol
  }

  moveTextAfter(text: IIText, tx: number): TIISymbol[] | undefined
  {
    const row = this.model.getSymbolsByRowOrdered().find(r => r.rowIndex === this.model.getSymbolRowIndex(text))
    if (row) {
      const textsAfter = row.symbols.filter(s => s.type === SymbolType.Text && s.bounds.xMid > text.bounds.xMid) as IIText[]
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
