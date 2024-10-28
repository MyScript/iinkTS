import
{
  EditorEvent,
  EditorEventName,
  TExport,
  EditorTool
} from "../../src/iink"
import { buildOICircle, buildOIStroke } from "./helpers"

describe('EditorEvent.ts', () =>
{
  const element = document.createElement("div")
  const events = new EditorEvent(element)

  describe("with custom addEventListener", () =>
  {
    const loadedCallback = jest.fn()
    const notifCallback = jest.fn()
    const errorCallback = jest.fn()
    const exportedCallback = jest.fn()
    const changedCallback = jest.fn()
    const idleCallback = jest.fn()
    const clearedCallback = jest.fn()
    const convertedCallback = jest.fn()
    const importedCallback = jest.fn()
    const selectedCallback = jest.fn()
    const toolCallback = jest.fn()
    const uiCallback = jest.fn()

    test("should execute callback on emitLoaded", () =>
    {
      events.addLoadedListener(loadedCallback)
      events.emitLoaded()
      expect(loadedCallback).toBeCalledTimes(1)
    })

    test("should execute callback on emitNotif", () =>
    {
      const notif = { message: "Test message", timeout: 42 }
      events.addNotifListener(notifCallback)
      events.emitNotif(notif)
      expect(notifCallback).toHaveBeenNthCalledWith(1, notif)
    })

    test("should execute callback on emitError", () =>
    {
      const error = new Error("Error test")
      events.addErrorListener(errorCallback)
      events.emitError(error)
      expect(errorCallback).toHaveBeenNthCalledWith(1, error)
    })

    test("should execute callback on emitExported", () =>
    {
      const exports: TExport = { 'text/plain': 'tatapouet' }
      events.addExportedListener(exportedCallback)
      events.emitExported(exports)
      expect(exportedCallback).toHaveBeenNthCalledWith(1, exports)
    })

    test("should execute callback on emitChanged", () =>
    {
      const undoRedoContext = {
        canUndo: true,
        canRedo: false,
        canClear: true,
        stackIndex: 10,
        empty: false,
        possibleUndoCount: 10,
        stack: []
      }
      events.addChangedListener(changedCallback)
      events.emitChanged(undoRedoContext)
      expect(changedCallback).toHaveBeenNthCalledWith(1, undoRedoContext)
    })

    test("should execute callback on emitIdle", () =>
    {
      const idle = true
      events.addIdleListener(idleCallback)
      events.emitIdle(idle)
      expect(idleCallback).toHaveBeenNthCalledWith(1, idle)
    })

    test("should execute callback on emitCleared", () =>
    {
      events.addClearedListener(clearedCallback)
      events.emitCleared()
      expect(clearedCallback).toHaveBeenNthCalledWith(1)
    })

    test("should execute callback on emitConverted", () =>
    {
      const exports: TExport = { 'text/plain': 'tatapouet' }
      events.addConvertedListener(convertedCallback)
      events.emitConverted(exports)
      expect(convertedCallback).toHaveBeenNthCalledWith(1, exports)
    })

    test("should execute callback on emitImported", () =>
    {
      const exports: TExport = {
        "application/vnd.myscript.jiix": {
          "type": "Text",
          "label": "hello",
          "words": [
            {
              "id": "1",
              "label": "hello",
              "candidates": ["hello", "helle", "hellor", "hells", "hellon"]
            }
          ],
          "version": "3",
          "id": "MainBlock"
        }
      }
      events.addImportedListener(importedCallback)
      events.emitImported(exports)
      expect(importedCallback).toHaveBeenNthCalledWith(1, exports)
    })

    test("should execute callback on emitSelected", () =>
    {
      const symbols = [buildOICircle(), buildOIStroke()]
      events.addSelectedListener(selectedCallback)
      events.emitSelected(symbols)
      expect(selectedCallback).toHaveBeenNthCalledWith(1, symbols)
    })

    test("should execute callback on emitToolChanged", () =>
    {
      events.addToolChangedListener(toolCallback)
      events.emitToolChanged(EditorTool.Write)
      expect(toolCallback).toHaveBeenNthCalledWith(1, EditorTool.Write)
    })

    test("should execute callback on emitToolChanged", () =>
    {
      events.addUIpdatedListener(uiCallback)
      events.emitUIpdated()
      expect(uiCallback).toHaveBeenCalledTimes(1)
    })

    test("remove all listeners", () =>
    {
      events.removeAllListeners()

      events.emitLoaded()
      expect(loadedCallback).toBeCalledTimes(0)

      events.emitNotif({ message: "Test message", timeout: 42 })
      expect(notifCallback).toHaveBeenCalledTimes(0)

      events.emitError(new Error("Error test"))
      expect(errorCallback).toHaveBeenCalledTimes(0)

      events.emitExported({ 'text/plain': 'tatapouet' })
      expect(exportedCallback).toHaveBeenCalledTimes(0)
    })
  })

  describe("with dom element", () =>
  {
    test("should execute callback on emitLoaded", () =>
    {
      const testCallback = jest.fn()
      element.addEventListener(EditorEventName.LOADED, testCallback)
      events.emitLoaded()
      expect(testCallback).toBeCalledTimes(1)
    })

    test("should execute callback on emitNotif", () =>
    {
      const notif = { message: "Test message", timeout: 42 }
      const testCallback = jest.fn()
      element.addEventListener(EditorEventName.NOTIF, testCallback)
      events.emitNotif(notif)
      expect(testCallback).toHaveBeenNthCalledWith(1, expect.objectContaining({ detail: notif }))
    })

    test("should execute callback on emitError", () =>
    {
      const error = new Error("Error test")
      const testCallback = jest.fn()
      element.addEventListener(EditorEventName.ERROR, testCallback)
      events.emitError(error)
      expect(testCallback).toHaveBeenNthCalledWith(1, expect.objectContaining({ detail: error }))
    })

    test("should execute callback on emitExported", () =>
    {
      const exports: TExport = { 'text/plain': 'tatapouet' }
      const testCallback = jest.fn()
      element.addEventListener(EditorEventName.EXPORTED, testCallback)
      events.emitExported(exports)
      expect(testCallback).toHaveBeenNthCalledWith(1, expect.objectContaining({ detail: exports }))
    })

    test("should execute callback on emitChanged", () =>
    {
      const undoRedoContext = {
        canUndo: true,
        canRedo: false,
        canClear: true,
        stackIndex: 10,
        empty: false,
        possibleUndoCount: 10,
        stack: []
      }
      const testCallback = jest.fn()
      element.addEventListener(EditorEventName.CHANGED, testCallback)
      events.emitChanged(undoRedoContext)
      expect(testCallback).toHaveBeenNthCalledWith(1, expect.objectContaining({ detail: undoRedoContext }))
    })

    test("should execute callback on emitIdle", () =>
    {
      const idle = true
      const testCallback = jest.fn()
      element.addEventListener(EditorEventName.IDLE, testCallback)
      events.emitIdle(idle)
      expect(testCallback).toHaveBeenNthCalledWith(1, expect.objectContaining({ detail: idle }))
    })

    test("should execute callback on emitCleared", () =>
    {
      const testCallback = jest.fn()
      element.addEventListener(EditorEventName.CLEARED, testCallback)
      events.emitCleared()
      expect(testCallback).toHaveBeenCalledTimes(1)
    })

    test("should execute callback on emitConverted", () =>
    {
      const exports: TExport = { 'text/plain': 'tatapouet' }
      const testCallback = jest.fn()
      element.addEventListener(EditorEventName.CONVERTED, testCallback)
      events.emitConverted(exports)
      expect(testCallback).toHaveBeenNthCalledWith(1, expect.objectContaining({ detail: exports }))
    })

    test("should execute callback on emitImported", () =>
    {
      const exports: TExport = {
        "application/vnd.myscript.jiix": {
          "type": "Text",
          "label": "hello",
          "words": [
            {
              "id": "1",
              "label": "hello",
              "candidates": ["hello", "helle", "hellor", "hells", "hellon"]
            }
          ],
          "version": "3",
          "id": "MainBlock"
        }
      }
      const testCallback = jest.fn()
      element.addEventListener(EditorEventName.IMPORTED, testCallback)
      events.emitImported(exports)
      expect(testCallback).toHaveBeenNthCalledWith(1, expect.objectContaining({ detail: exports }))
    })

    test("should execute callback on emitSelected", () =>
    {
      const symbols = [buildOICircle(), buildOIStroke()]
      const testCallback = jest.fn()
      element.addEventListener(EditorEventName.SELECTED, testCallback)
      events.emitSelected(symbols)
      expect(testCallback).toHaveBeenNthCalledWith(1, expect.objectContaining({ detail: symbols }))
    })

    test("should execute callback on emitToolChanged", () =>
    {
      const testCallback = jest.fn()
      element.addEventListener(EditorEventName.MODE_CHANGED, testCallback)
      events.emitToolChanged(EditorTool.Write)
      expect(testCallback).toHaveBeenNthCalledWith(1, expect.objectContaining({ detail: EditorTool.Write }))
    })

    test("should execute callback on emitUIpdated", () =>
    {
      const testCallback = jest.fn()
      element.addEventListener(EditorEventName.UI_UPDATED, testCallback)
      events.emitUIpdated()
      expect(testCallback).toHaveBeenCalledTimes(1)
    })
  })

})
