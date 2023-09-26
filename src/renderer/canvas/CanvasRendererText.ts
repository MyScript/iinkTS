import {
  LoggerClass,
  TPoint,
  TSymbol,
  TTextDataSymbol,
  TTextSymbol,
  TTextUnderlineSymbol,
  TUnderLineSymbol
} from "../../@types"
import { LoggerManager } from "../../logger"

export class CanvasRendererText
{
  #logger = LoggerManager.getLogger(LoggerClass.RENDERER)

  symbols = {
    char: "char",
    string: "string",
    textLine: "textLine"
  }

  protected drawUnderline(context2D: CanvasRenderingContext2D, underline: TUnderLineSymbol, label: string, data: TTextDataSymbol)
  {
    this.#logger.debug("#drawUnderline", { context2D, underline, label, data })
    context2D.save()
    try {
      const delta = data.width / label.length
      const p1: TPoint = {
        x: data.topLeftPoint.x + (underline.data.firstCharacter * delta),
        y: data.topLeftPoint.y + data.height
      }
      const p2: TPoint = {
        x: data.topLeftPoint.x + (underline.data.lastCharacter * delta),
        y: data.topLeftPoint.y + data.height
      }
      context2D.beginPath()
      context2D.moveTo(p1.x, p1.y)
      context2D.lineTo(p2.x, p2.y)
      context2D.stroke()
    } catch(error) {
      this.#logger.error("#drawUnderline", { error })
    } finally {
      context2D.restore()
    }
  }

  protected drawText(context2D: CanvasRenderingContext2D, text: TTextSymbol)
  {
    this.#logger.debug("#drawText", { context2D, text })
    context2D.save()
    try {
      context2D.font = `${ text.data.textHeight }px serif`
      context2D.textAlign = (text.data.justificationType === "CENTER") ? "center" : "left"
      context2D.textBaseline = "bottom"
      context2D.fillStyle = context2D.strokeStyle
      context2D.fillText(text.label, text.data.topLeftPoint.x, (text.data.topLeftPoint.y + text.data.height))
    } catch(error) {
      this.#logger.error("#drawText", { error })
    } finally {
      context2D.restore()
    }
  }

  protected drawTextLine(context2D: CanvasRenderingContext2D, textUnderline: TTextUnderlineSymbol)
  {
    this.#logger.debug("#drawTextLine", { context2D, textUnderline })
    this.drawText(context2D, textUnderline)
    textUnderline.underlineList.forEach((underline) =>
    {
      this.drawUnderline(context2D, underline, textUnderline.label, textUnderline.data)
    })
  }

  draw(context2D: CanvasRenderingContext2D, symbol: TSymbol)
  {
    this.#logger.info("draw", { context2D, symbol })
    context2D.lineWidth = (symbol.style.width as number)
    context2D.strokeStyle = (symbol.style.color as string)
    const type: string = symbol.elementType || symbol.type

    switch (type) {
      case this.symbols.char:
      case this.symbols.string:
        this.drawText(context2D, symbol as TTextSymbol)
        break
      case this.symbols.textLine:
        this.drawTextLine(context2D, symbol as TTextUnderlineSymbol)
        break
      default:
        this.#logger.warn("draw", `${symbol.elementType} not implemented`)
        break
    }
  }
}
