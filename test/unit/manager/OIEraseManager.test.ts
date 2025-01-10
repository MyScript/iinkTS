import { buildOICircle, buildOIStroke } from "../helpers"
import { EditorOffscreenMock } from "../__mocks__/EditorOffscreenMock"
import { OIEraseManager, SymbolType, TPointer } from "../../../src/iink"


describe("OIEraseManager.ts", () =>
{
  test("should create", () =>
  {
    const editor = new EditorOffscreenMock()
    const manager = new OIEraseManager(editor)
    expect(manager).toBeDefined()
    expect(manager.currentEraser).toBeUndefined()
  })

  describe("writing process", () =>
  {
    const editor = new EditorOffscreenMock()
    editor.recognizer.init = jest.fn(() => Promise.resolve())
    editor.recognizer.addStrokes = jest.fn(() => Promise.resolve(undefined))
    editor.recognizer.eraseStrokes = jest.fn(() => Promise.resolve())

    const manager = new OIEraseManager(editor)
    manager.renderer.drawSymbol = jest.fn()
    manager.renderer.removeSymbol = jest.fn()
    editor.init()

    test("should init currentEraser", async () =>
    {
      expect(manager.currentEraser).toBeUndefined()
      const point: TPointer = { t: 1, p: 0.5, x: 1, y: 1 }
      manager.start(point)
      expect(manager.currentEraser).toBeDefined()
      expect(manager.currentEraser?.type).toBe(SymbolType.Eraser)
      expect(manager.currentEraser?.pointers).toHaveLength(1)
      expect(manager.renderer.drawSymbol).toHaveBeenCalledTimes(1)
      expect(manager.renderer.drawSymbol).toHaveBeenCalledWith(manager.currentEraser)
    })
    test("should update currentEraser", async () =>
    {
      const point: TPointer = { t: 1, p: 0.5, x: 15, y: 15 }
      manager.continue(point)
      expect(manager.currentEraser).toBeDefined()
      expect(manager.currentEraser?.type).toBe(SymbolType.Eraser)
      expect(manager.currentEraser?.pointers).toHaveLength(2)
      expect(manager.renderer.drawSymbol).toHaveBeenCalledTimes(1)
      expect(manager.renderer.drawSymbol).toHaveBeenCalledWith(manager.currentEraser)
    })
    test("should complete erasing", async () =>
    {
      const eraserId = manager.currentEraser!.id
      const strokeToErase = buildOIStroke()
      strokeToErase.deleting = true
      manager.model.symbols.push(strokeToErase)
      const circleToErase = buildOICircle()
      circleToErase.deleting = true
      manager.model.symbols.push(circleToErase)
      manager.model.symbols.push(buildOIStroke())
      const point: TPointer = { t: 1, p: 0.5, x: 20, y: 20 }
      await manager.end(point)
      expect(manager.currentEraser).toBeUndefined()
      expect(manager.renderer.removeSymbol).toHaveBeenCalledTimes(1)
      expect(manager.renderer.removeSymbol).toHaveBeenNthCalledWith(1, eraserId)

      expect(manager.editor.removeSymbols).toHaveBeenNthCalledWith(1, [strokeToErase.id, circleToErase.id])
    })
    test("should throw error if continu when currentEraser is undefine", async () =>
    {
      const point: TPointer = { t: 1, p: 0.5, x: 15, y: 15 }
      expect(manager.currentEraser).toBeUndefined()
      expect(() => manager.continue(point)).toThrowError("Can't update current eraser because currentEraser is undefined")
    })
  })
})
