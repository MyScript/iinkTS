import { createCanvasMock, asCanvas } from "../../__mocks__/createCanvasMock"
import { DefaultIIRendererConfiguration, IIMoveManager, TPointerInfo } from "@/iink"

describe("IIMoveManager.ts", () => {
  test("should instanciate", () => {
    const canvas = createCanvasMock()
    const manager = new IIMoveManager(asCanvas(canvas))
    expect(manager).toBeDefined()
    expect(manager.origin).toBeUndefined()
  })

  describe("move process", () => {
    const canvas = createCanvasMock()
    canvas.init()

    const manager = new IIMoveManager(asCanvas(canvas))

    test("should init origin on start", async () => {
      const info = {
        clientX: 1,
        clientY: 2,
      } as TPointerInfo

      manager.start(info)
      expect(manager.origin).toBeDefined()
      expect(manager.origin).toEqual({
        clientX: 1,
        clientY: 2,
        viewBoxX: 0,
        viewBoxY: 0,
      })
      expect(manager.renderer.getViewBox()).toEqual({
        x: 0,
        y: 0,
        width: DefaultIIRendererConfiguration.minWidth,
        height: DefaultIIRendererConfiguration.minHeight,
      })
    })

    test("should update viewbox on renderer.parent on continu", async () => {
      const info = {
        clientX: 75,
        clientY: 102,
      } as TPointerInfo
      manager.continue(info)
      expect(manager.renderer.getViewBox()).toEqual({
        x: -74,
        y: -100,
        width: DefaultIIRendererConfiguration.minWidth,
        height: DefaultIIRendererConfiguration.minHeight,
      })
      expect(manager.renderer.parent.scrollLeft).toEqual(0)
      expect(manager.renderer.parent.scrollTop).toEqual(0)
    })

    test("should update viewbox on renderer.parent and clear origin on end", async () => {
      const info = {
        clientX: -42,
        clientY: -96,
      } as TPointerInfo

      manager.end(info)
      expect(manager.renderer.getViewBox()).toEqual({
        x: 43,
        y: 98,
        width: DefaultIIRendererConfiguration.minWidth,
        height: DefaultIIRendererConfiguration.minHeight,
      })
      expect(manager.renderer.parent.scrollLeft).toEqual(0)
      expect(manager.renderer.parent.scrollTop).toEqual(0)
      expect(manager.origin).toBeUndefined()
    })
  })
})
