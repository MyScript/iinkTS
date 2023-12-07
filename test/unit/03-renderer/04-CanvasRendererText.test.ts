import { CanvasRendererText, DefaultPenStyle, TCanvasTextSymbol, TCanvasTextUnderlineSymbol } from "../../../src/iink"

describe("CanvasRendererText.ts", () =>
{
  const canvas: HTMLCanvasElement = document.createElement("canvas")
  const canvasContext = canvas.getContext("2d") as CanvasRenderingContext2D
  const canvasRendererText = new CanvasRendererText()

  canvasContext.fillText = jest.fn()
  canvasContext.moveTo = jest.fn()
  canvasContext.lineTo = jest.fn()

  test("should draw text type char", () =>
  {
    const text: TCanvasTextSymbol = {
      creationTime: Date.now(),
      id: "id",
      modificationDate: Date.now(),
      data: {
        height: 10,
        justificationType: "CENTER",
        textHeight: 8,
        topLeftPoint: { x: 1, y: 2 },
        width: 20
      },
      label: "a",
      style: DefaultPenStyle,
      type: canvasRendererText.symbols.char
    }
    canvasRendererText.draw(canvasContext, text)
    expect(canvasContext.fillText).toBeCalledTimes(1)
    expect(canvasContext.fillText).toBeCalledWith(text.label, text.data.topLeftPoint.x, text.data.topLeftPoint.y + text.data.height)
  })

  test("should draw text type string", () =>
  {
    const text: TCanvasTextSymbol = {
      creationTime: Date.now(),
      id: "id",
      modificationDate: Date.now(),
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

  test("should draw text type string", () =>
  {
    const text: TCanvasTextUnderlineSymbol = {
      creationTime: Date.now(),
      id: "id",
      modificationDate: Date.now(),
      type: canvasRendererText.symbols.textLine,
      data: {
        height: 10,
        justificationType: "CENTER",
        textHeight: 8,
        topLeftPoint: { x: 1, y: 2 },
        width: 20
      },
      label: "hello",
      style: DefaultPenStyle,
      underlineList: [
        {
          creationTime: Date.now(),
          id: "id",
          modificationDate: Date.now(),
          data: {
            firstCharacter: 1,
            lastCharacter: 3
          },
          style: DefaultPenStyle,
          type: "pouet"
        }
      ]
    }
    canvasRendererText.draw(canvasContext, text)
    expect(canvasContext.fillText).toBeCalledTimes(1)
    expect(canvasContext.fillText).toBeCalledWith(text.label, text.data.topLeftPoint.x, text.data.topLeftPoint.y + text.data.height)
    expect(canvasContext.moveTo).toBeCalledTimes(1)
    expect(canvasContext.moveTo).toBeCalledWith(5, text.data.topLeftPoint.y + text.data.height)
    expect(canvasContext.lineTo).toBeCalledTimes(1)
    expect(canvasContext.lineTo).toBeCalledWith(13, text.data.topLeftPoint.y + text.data.height)
  })
})
