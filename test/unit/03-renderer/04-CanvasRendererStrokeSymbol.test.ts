import { TStroke } from "../../../src/@types"
import { renderer, style } from "../../../src/iink"

describe("CanvasRendererStrokeSymbol.ts", () =>
{
  const { CanvasStroker, canvasRendererStroke } = renderer
  const { DefaultPenStyle } = style

  const canvas: HTMLCanvasElement = document.createElement("canvas")
  const canvasContext = canvas.getContext("2d") as CanvasRenderingContext2D

  canvasContext.moveTo = jest.fn()
  canvasContext.lineTo = jest.fn()
  const stroker = new CanvasStroker()
  stroker.drawStroke = jest.fn()


  test("should drawStroke", () =>
  {
    //@ts-ignore
    const stroke: TStroke = {
      id: "test-id",
      type: "pen",
      pointerType: "pen",
      pointerId: 0,
      style: DefaultPenStyle,
      "pointers": [
        { "x": 604, "y": 226, "t": 1693494025427, "p": 0.1 },
        { "x": 611, "y": 222, "t": 1693494025467, "p": 0.8 },
        { "x": 621, "y": 222, "t": 1693494025484, "p": 0.68 },
      ]
    }
    canvasRendererStroke.drawStroke(canvasContext, stroke, stroker)
    expect(stroker.drawStroke).toBeCalledTimes(1)
    expect(stroker.drawStroke).toBeCalledWith(canvasContext, stroke)
  })

  test("should not drawStroke if eraser", () =>
  {
    //@ts-ignore
    const stroke: TStroke = {
      id: "test-id",
      type: "pen",
      pointerType: "eraser",
      pointerId: 0,
      style: DefaultPenStyle,
      "pointers": [
        { "x": 604, "y": 226, "t": 1693494025427, "p": 0.1 },
        { "x": 611, "y": 222, "t": 1693494025467, "p": 0.8 },
        { "x": 621, "y": 222, "t": 1693494025484, "p": 0.68 },
      ]
    }
    canvasRendererStroke.drawStroke(canvasContext, stroke, stroker)
    expect(stroker.drawStroke).toBeCalledTimes(0)
  })


})
