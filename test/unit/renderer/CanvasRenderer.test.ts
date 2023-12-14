import { CanvasRenderer, DefaultRenderingConfiguration } from "../../../src/iink"
import { buildStroke } from "../helpers"

describe("CanvasRenderer.ts", () =>
{
  const height = 10, width = 10
  const wrapperHTML: HTMLElement = document.createElement("div")
  wrapperHTML.style.height = `${ height }px`
  wrapperHTML.style.width = `${ width }px`

  const canvasRenderer = new CanvasRenderer(DefaultRenderingConfiguration)
  canvasRenderer.shapeRenderer.draw = jest.fn()
  canvasRenderer.strokeRenderer.draw = jest.fn()
  canvasRenderer.textRenderer.draw = jest.fn()

  test("should set configuration when instanciate", () =>
  {
    expect(canvasRenderer.configuration).toStrictEqual(DefaultRenderingConfiguration)
  })

  test("should set configuration when instanciate", () =>
  {
    expect(canvasRenderer.configuration).toStrictEqual(DefaultRenderingConfiguration)
  })

  test("should init", () =>
  {
    canvasRenderer.init(wrapperHTML)
    expect(wrapperHTML.querySelector(".ms-rendering-canvas")).toBeDefined()
    expect(wrapperHTML.querySelector(".ms-capture-canvas")).toBeDefined()
    expect(canvasRenderer.context).toBeDefined()
  })

  describe("drawPendingStroke", () => {
    test("should drawPendingStroke", () =>
    {
      const stroke = buildStroke()
      canvasRenderer.drawPendingStroke(stroke)
      expect(canvasRenderer.strokeRenderer.draw).toHaveBeenCalledTimes(1)
      expect(canvasRenderer.strokeRenderer.draw).toHaveBeenCalledWith(canvasRenderer.context.capturingCanvasContext, stroke)
    })
    test("should not drawPendingStroke if no stroke", () =>
    {
      //@ts-ignore
      canvasRenderer.drawPendingStroke()
      expect(canvasRenderer.strokeRenderer.draw).toHaveBeenCalledTimes(0)
    })
    test("should not drawPendingStroke if stroke.pointerType === eraser", () =>
    {
      const stroke = buildStroke()
      stroke.pointerType = "eraser"
      canvasRenderer.drawPendingStroke(stroke)
      expect(canvasRenderer.strokeRenderer.draw).toHaveBeenCalledTimes(0)
    })
  })

  test("should destroy", () =>
  {
    canvasRenderer.destroy()
    expect(wrapperHTML.querySelector(".ms-rendering-canvas")).toBeNull()
    expect(wrapperHTML.querySelector(".ms-capture-canvas")).toBeNull()
  })
})
