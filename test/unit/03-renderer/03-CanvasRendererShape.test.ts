import {
  CanvasRendererShape,
  DefaultPenStyle,
  TCanvasShapeEllipseSymbol,
  TCanvasShapeLineSymbol,
  TCanvasShapeTableSymbol
} from "../../../src/iink"

describe("CanvasRendererShape.ts", () =>
{
  const canvas: HTMLCanvasElement = document.createElement("canvas")
  const canvasContext = canvas.getContext("2d") as CanvasRenderingContext2D
  const canvasRendererShape = new CanvasRendererShape()

  canvasContext.moveTo = jest.fn()
  canvasContext.lineTo = jest.fn()
  const p1 = { x: 1, y: 2 }
  const p2 = { x: 3, y: 4 }

  test("should draw a table symbol", () =>
  {
    const table: TCanvasShapeTableSymbol = {
      type: canvasRendererShape.symbols.table,
      style: DefaultPenStyle,
      lines: [{ type: "line", style: DefaultPenStyle, p1, p2 }]
    }
    canvasRendererShape.draw(canvasContext, table)
    expect(canvasContext.moveTo).toBeCalledTimes(1)
    expect(canvasContext.moveTo).toBeCalledWith(p1.x, p1.y)

    expect(canvasContext.lineTo).toBeCalledTimes(1)
    expect(canvasContext.lineTo).toBeCalledWith(p2.x, p2.y)
  })

  test("should draw a ellipse symbol", () =>
  {
    const table: TCanvasShapeEllipseSymbol = {
      type: canvasRendererShape.symbols.ellipse,
      beginTangentAngle: 0,
      centerPoint: p1,
      endTangentAngle: 45,
      maxRadius: 42,
      minRadius: 5,
      orientation: 12,
      startAngle: 0,
      style: DefaultPenStyle,
      sweepAngle: 1
    }
    canvasRendererShape.draw(canvasContext, table)
    expect(canvasContext.moveTo).toBeCalledTimes(1)
    expect(canvasContext.lineTo).toBeCalledTimes(50)
  })

  test("should draw a line symbol", () =>
  {
    const line: TCanvasShapeLineSymbol = {
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

})
