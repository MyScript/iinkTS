import { InteractiveInkEditorMock } from "../__mocks__/InteractiveInkEditorMock"
import { IIMoveManager, PointerInfo } from "../../../src/iink"


describe("IIMoveManager.ts", () =>
{
  test("should instanciate", () =>
  {
    const editor = new InteractiveInkEditorMock()
    const manager = new IIMoveManager(editor)
    expect(manager).toBeDefined()
    expect(manager.origin).toBeUndefined()
  })

  describe("move process", () =>
  {
    const editor = new InteractiveInkEditorMock()
    editor.init()

    const manager = new IIMoveManager(editor)

    test("should init origin on start", async () =>
    {
      const info = {
        clientX: 1,
        clientY: 2,
      } as PointerInfo

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
        width: 100,
        height: 100,
      })
    })

    test("should update viewbox on renderer.parent on continu", async () =>
    {
      const info = {
        clientX: 75,
        clientY: 102,
      } as PointerInfo
      manager.continue(info)
      expect(manager.renderer.getViewBox()).toEqual({
        x: -74,
        y: -100,
        width: 100,
        height: 100,
      })
      expect(manager.renderer.parent.scrollLeft).toEqual(0)
      expect(manager.renderer.parent.scrollTop).toEqual(0)
    })

    test("should update viewbox on renderer.parent and clear origin on end", async () =>
    {
      const info = {
        clientX: -42,
        clientY: -96,
      } as PointerInfo

      manager.end(info)
      expect(manager.renderer.getViewBox()).toEqual({
        x: 43,
        y: 98,
        width: 100,
        height: 100,
      })
      expect(manager.renderer.parent.scrollLeft).toEqual(0)
      expect(manager.renderer.parent.scrollTop).toEqual(0)
      expect(manager.origin).toBeUndefined()
    })

    test("should throw error if continu without do start before", async () =>
    {
      const info = {
        clientX: 75,
        clientY: 102,
      } as PointerInfo

      expect(() => manager.continue(info)).toThrow("Can't move cause origin is undefined")
    })
  })
})
