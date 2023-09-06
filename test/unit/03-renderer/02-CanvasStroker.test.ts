import { Stroke, CanvasStroker, DefaultPenStyle } from "../../../src/iink"

describe("CanvasStroker.ts", () =>
{
  const canvas: HTMLCanvasElement = document.createElement("canvas")

  const context = {
    canvas,
    canvasContext: canvas.getContext("2d") as CanvasRenderingContext2D
  }

  test("should instanciate CanvasStroker", () =>
  {
    const stroker = new CanvasStroker()
    expect(stroker).toBeDefined()
  })

  test("should drawStroke", () =>
  {
    const stroker = new CanvasStroker()
    const stroke = new Stroke(DefaultPenStyle, 1)
    for (let i = 0; i < 5; i++) {
      stroke.pointers.push({
        p: 0.5,
        t: 1,
        x: i,
        y: i
      })
    }
    stroker.drawStroke(context.canvasContext, stroke)
  })


})
