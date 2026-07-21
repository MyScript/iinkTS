import { buildIICircle, buildIIStroke } from "../../helpers"
import { createCanvasMock, asEditor } from "../../__mocks__/createCanvasMock"
import { EraseManager, TPointerInfo, SymbolType } from "@/iink"

describe("EraseManager.ts", () => {
  test("should create", () => {
    const editor = createCanvasMock()
    const manager = new EraseManager(asEditor(editor))
    expect(manager).toBeDefined()
    expect(manager.currentEraser).toBeUndefined()
  })

  describe("writing process", () => {
    const editor = createCanvasMock()
    editor.client.init = jest.fn(() => Promise.resolve())
    editor.client.addStrokes = jest.fn(() => Promise.resolve(undefined))
    editor.client.eraseStrokes = jest.fn(() => Promise.resolve())

    const manager = new EraseManager(asEditor(editor))
    manager.renderer.drawSymbol = jest.fn()
    manager.renderer.removeSymbol = jest.fn()
    editor.init()

    test("should init currentEraser", async () => {
      expect(manager.currentEraser).toBeUndefined()
      const info = {
        pointer: { t: 1, p: 0.5, x: 1, y: 1 },
      } as TPointerInfo
      manager.start(info)
      expect(manager.currentEraser).toBeDefined()
      expect(manager.currentEraser?.type).toBe(SymbolType.Eraser)
      expect(manager.currentEraser?.pointers).toHaveLength(1)
      expect(manager.renderer.drawSymbol).toHaveBeenCalledTimes(1)
      expect(manager.renderer.drawSymbol).toHaveBeenCalledWith(manager.currentEraser)
    })
    test("should update currentEraser", async () => {
      const info = {
        pointer: { t: 1, p: 0.5, x: 15, y: 15 },
      } as TPointerInfo
      manager.continue(info)
      expect(manager.currentEraser).toBeDefined()
      expect(manager.currentEraser?.type).toBe(SymbolType.Eraser)
      expect(manager.currentEraser?.pointers).toHaveLength(2)
      expect(manager.renderer.drawSymbol).toHaveBeenCalledTimes(1)
      expect(manager.renderer.drawSymbol).toHaveBeenCalledWith(manager.currentEraser)
    })
    test("should complete erasing", async () => {
      const eraserId = manager.currentEraser!.id
      const strokeToErase = buildIIStroke()
      editor.model.symbols.push(strokeToErase)
      manager.deletingIds.add(strokeToErase.id)
      const circleToErase = buildIICircle()
      editor.model.symbols.push(circleToErase)
      manager.deletingIds.add(circleToErase.id)
      editor.model.symbols.push(buildIIStroke())

      const info = {
        pointer: { t: 1, p: 0.5, x: 20, y: 20 },
      } as TPointerInfo
      await manager.end(info)
      expect(manager.currentEraser).toBeUndefined()
      expect(manager.renderer.removeSymbol).toHaveBeenCalledTimes(1)
      expect(manager.renderer.removeSymbol).toHaveBeenNthCalledWith(1, eraserId)

      expect(editor.removeSymbols).toHaveBeenNthCalledWith(1, [strokeToErase.id, circleToErase.id])
    })
    test("should throw error if continu when currentEraser is undefine", async () => {
      const info = {
        pointer: { t: 1, p: 0.5, x: 20, y: 20 },
      } as TPointerInfo
      expect(manager.currentEraser).toBeUndefined()
      expect(() => manager.continue(info)).toThrow("Can't update current eraser because currentEraser is undefined")
    })
  })
})
