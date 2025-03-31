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

      manager.renderer.parent.scrollTop = 4
      manager.renderer.parent.scrollLeft = 8

      manager.start(info)
      expect(manager.origin).toBeDefined()
      expect(manager.origin).toEqual({
        left: manager.renderer.parent.scrollLeft,
        top: manager.renderer.parent.scrollTop,
        x: info.clientX,
        y: info.clientY
      })
    })

    test("should update scrollTop & scrollLeft on renderer.parent on continu", async () =>
    {
      const info = {
        clientX: 75,
        clientY: 102,
      } as PointerInfo

      manager.continue(info)
      expect(manager.renderer.parent.scrollLeft).toEqual(-66)
      expect(manager.renderer.parent.scrollTop).toEqual(-96)
    })

    test("should update scrollTop & scrollLeft on renderer.parent and clear origin on end", async () =>
    {
      const info = {
        clientX: -42,
        clientY: -96,
      } as PointerInfo

      manager.end(info)
      expect(manager.renderer.parent.scrollLeft).toEqual(51)
      expect(manager.renderer.parent.scrollTop).toEqual(102)
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
