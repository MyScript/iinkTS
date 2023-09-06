import { TRenderingConfiguration } from "../../../src/@types"
import { CanvasRenderer, CanvasStroker } from "../../../src/iink"

describe("CanvasRenderer.ts", () =>
{
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
  const renderer = new CanvasRenderer(conf)

  test("should set configuration when instanciate", () =>
  {
    const r = new CanvasRenderer(conf)
    expect(r.config).toStrictEqual(conf)
  })

  test("should init", () =>
  {
    renderer.init(wrapperHTML)
    expect(wrapperHTML.querySelector(".ms-rendering-canvas")).toBeDefined()
    expect(wrapperHTML.querySelector(".ms-capture-canvas")).toBeDefined()
    expect(renderer.context).toBeDefined()
  })

  test("should destroy", () =>
  {
    renderer.destroy()
    expect(wrapperHTML.querySelector(".ms-rendering-canvas")).toBeNull()
    expect(wrapperHTML.querySelector(".ms-capture-canvas")).toBeNull()
  })
})
