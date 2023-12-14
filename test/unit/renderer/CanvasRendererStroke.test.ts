import { buildStroke } from "../helpers"
import { CanvasRendererStroke } from "../../../src/iink"

describe("CanvasRendererStroke.ts", () =>
{
  test("should instanciate CanvasRendererStroke", () =>
  {
    const canvasRendererStroke = new CanvasRendererStroke()
    expect(canvasRendererStroke).toBeDefined()
  })

  describe("draw", () =>
  {
    const canvas: HTMLCanvasElement = document.createElement("canvas")
    const context = {
      canvas,
      canvasContext: canvas.getContext("2d") as CanvasRenderingContext2D
    }

    context.canvasContext.arc = jest.fn()
    context.canvasContext.moveTo = jest.fn()
    context.canvasContext.lineTo = jest.fn()
    context.canvasContext.quadraticCurveTo = jest.fn()

    const canvasRendererStroke = new CanvasRendererStroke()
    test("should draw a point if less than 3 points", () =>
    {
      const stroke = buildStroke({ nbPoint: 2, style: { width: 2 } })
      canvasRendererStroke.draw(context.canvasContext, stroke)
      expect(context.canvasContext.arc).toHaveBeenCalledTimes(1)
      const firstPoint = stroke.pointers[0]
      expect(context.canvasContext.arc).toHaveBeenCalledWith(firstPoint.x, firstPoint.y, 1.2, 0, Math.PI * 2, true)
    })
    test("should draw stroke if more than 3 points", () =>
    {
      const stroke = buildStroke({ nbPoint: 50, style: { width: 2 } })
      canvasRendererStroke.draw(context.canvasContext, stroke)
      expect(context.canvasContext.arc).toHaveBeenCalled()
      expect(context.canvasContext.moveTo).toHaveBeenCalled()
      expect(context.canvasContext.quadraticCurveTo).toHaveBeenCalled()
      expect(context.canvasContext.lineTo).toHaveBeenCalled()

    })
  })

})
