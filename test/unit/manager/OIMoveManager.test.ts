import { EditorOffscreenMock } from "../__mocks__/EditorOffscreenMock"
import { OIMoveManager } from "../../../src/iink"


describe("OIMoveManager.ts", () =>
{
  test("should instanciate", () =>
  {
    const editor = new EditorOffscreenMock()
    const manager = new OIMoveManager(editor)
    expect(manager).toBeDefined()
    expect(manager.origin).toBeUndefined()
  })

  describe("move process", () =>
  {
    const editor = new EditorOffscreenMock()
    editor.init()

    const manager = new OIMoveManager(editor)

    test("should init origin on start", async () =>
    {
      const evt = {
        clientX: 1,
        clientY: 2,
      } as PointerEvent

      manager.renderer.parent.scrollTop = 4
      manager.renderer.parent.scrollLeft = 8

      manager.start(evt)
      expect(manager.origin).toBeDefined()
      expect(manager.origin).toEqual({
        left: manager.renderer.parent.scrollLeft,
        top: manager.renderer.parent.scrollTop,
        x: evt.clientX,
        y: evt.clientY
      })
    })

    test("should update scrollTop & scrollLeft on renderer.parent on continu", async () =>
    {
      const evt = {
        clientX: 75,
        clientY: 102,
      } as PointerEvent

      manager.continue(evt)
      expect(manager.renderer.parent.scrollLeft).toEqual(-66)
      expect(manager.renderer.parent.scrollTop).toEqual(-96)
    })

    test("should update scrollTop & scrollLeft on renderer.parent and clear origin on end", async () =>
    {
      const evt = {
        clientX: -42,
        clientY: -96,
      } as PointerEvent

      manager.end(evt)
      expect(manager.renderer.parent.scrollLeft).toEqual(51)
      expect(manager.renderer.parent.scrollTop).toEqual(102)
      expect(manager.origin).toBeUndefined()
    })

    test("should throw error if continu without do start before", async () =>
      {
        const evt = {
          clientX: 75,
          clientY: 102,
        } as PointerEvent

        expect(() => manager.continue(evt)).toThrow("Can't move cause origin is undefined")
      })
  })
})
