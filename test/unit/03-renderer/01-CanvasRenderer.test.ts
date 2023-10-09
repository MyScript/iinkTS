import { TRenderingConfiguration } from "../../../src/@types"
import { renderer } from "../../../src/iink"

describe("CanvasRenderer.ts", () =>
{
  const { CanvasRenderer, CanvasStroker } = renderer
  const height = 10, width = 10
  const wrapperHTML: HTMLElement = document.createElement("div")
  wrapperHTML.style.height = `${ height }px`
  wrapperHTML.style.width = `${ width }px`

  const stroker = new CanvasStroker()
  stroker.drawStroke = jest.fn()

  const conf: TRenderingConfiguration = {
    minHeight: 100,
    minWidth: 100,
    smartGuide: {
      enable: true,
      fadeOut: {
        enable: false,
        duration: 100
      }
    },
    guides: {
      enable: true,
      gap: 50
    }
  }
  const canvasRenderer = new CanvasRenderer(conf)

  test("should set configuration when instanciate", () =>
  {
    expect(canvasRenderer.config).toStrictEqual(conf)
  })

  test("should init", () =>
  {
    canvasRenderer.init(wrapperHTML)
    expect(wrapperHTML.querySelector(".ms-rendering-canvas")).toBeDefined()
    expect(wrapperHTML.querySelector(".ms-capture-canvas")).toBeDefined()
    expect(canvasRenderer.context).toBeDefined()
  })

  test("should destroy", () =>
  {
    canvasRenderer.destroy()
    expect(wrapperHTML.querySelector(".ms-rendering-canvas")).toBeNull()
    expect(wrapperHTML.querySelector(".ms-capture-canvas")).toBeNull()
  })
})
