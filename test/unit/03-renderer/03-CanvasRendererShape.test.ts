import { TLineSymbol, TShapeLineSymbol } from "../../../src/@types"
import { renderer, style } from "../../../src/iink"

describe("CanvasRendererShape.ts", () =>
{
  const { CanvasRendererShape } = renderer
  const { DefaultPenStyle } = style

  const canvas: HTMLCanvasElement = document.createElement("canvas")
  const canvasContext = canvas.getContext("2d") as CanvasRenderingContext2D
  const canvasRendererShape = new CanvasRendererShape()

  canvasContext.moveTo = jest.fn()
  canvasContext.lineTo = jest.fn()
  const p1 = { x: 1, y: 2 }
  const p2 = { x: 3, y: 4 }

  describe("draw Line", () => {
    test("should draw a line type symbol", () =>
    {
      const line: TShapeLineSymbol = {
        firstPoint: p1,
        lastPoint: p2,
        style: DefaultPenStyle,
        type: canvasRendererShape.symbols.line,
        beginTangentAngle: 1,
        endTangentAngle: 90,
      }
      canvasRendererShape.draw(canvasContext, line)
      expect(canvasContext.moveTo).toBeCalledTimes(1)
      expect(canvasContext.moveTo).toBeCalledWith(p1.x, p1.y)

      expect(canvasContext.lineTo).toBeCalledTimes(1)
      expect(canvasContext.lineTo).toBeCalledWith(p2.x, p2.y)
    })
    test("should draw a line elementType symbol", () =>
    {
      const line: TLineSymbol = {
        data: {
          p1,
          p2
        },
        style: DefaultPenStyle,
        type: "pouet",
        elementType: canvasRendererShape.symbols.line,
      }
      canvasRendererShape.draw(canvasContext, line)
      expect(canvasContext.moveTo).toBeCalledTimes(1)
      expect(canvasContext.moveTo).toBeCalledWith(p1.x, p1.y)

      expect(canvasContext.lineTo).toBeCalledTimes(1)
      expect(canvasContext.lineTo).toBeCalledWith(p2.x, p2.y)
    })
  })

})
