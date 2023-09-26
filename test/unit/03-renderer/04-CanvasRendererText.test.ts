import { TTextSymbol } from "../../../src/@types"
import { renderer, style } from "../../../src/iink"

describe("CanvasRendererText.ts", () =>
{
  const { CanvasRendererText } = renderer
  const { DefaultPenStyle } = style

  const canvas: HTMLCanvasElement = document.createElement("canvas")
  const canvasContext = canvas.getContext("2d") as CanvasRenderingContext2D
  const canvasRendererText = new CanvasRendererText()

  canvasContext.fillText = jest.fn()
  canvasContext.moveTo = jest.fn()
  canvasContext.lineTo = jest.fn()

  test("should draw text type string", () =>
  {
    const text: TTextSymbol = {
      data: {
        height: 10,
        justificationType: "CENTER",
        textHeight: 8,
        topLeftPoint: { x: 1, y: 2 },
        width: 20
      },
      label: "hello",
      style: DefaultPenStyle,
      type: canvasRendererText.symbols.string
    }
    canvasRendererText.draw(canvasContext, text)
    expect(canvasContext.fillText).toBeCalledTimes(1)
    expect(canvasContext.fillText).toBeCalledWith(text.label, text.data.topLeftPoint.x, text.data.topLeftPoint.y + text.data.height)
  })
})
