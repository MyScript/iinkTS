import
{
  InternalEvent,
  TWSMessageEventSVGPatch,
  TExport,
  TUndoRedoContext,
  Intention
} from "../../../src/iink"
import { buildOICircle, buildOIStroke } from "../helpers"

describe("InternalEvent.ts", () =>
{
  const internalEvent = InternalEvent.getInstance()

  test("should have singleton", () =>
  {
    const iEvent1 = InternalEvent.getInstance()
    const iEvent2 = InternalEvent.getInstance()
    expect(iEvent1).toBe(iEvent2)
    expect(iEvent1).toEqual(iEvent2)
    expect(iEvent1).toStrictEqual(iEvent2)
  })

  test("should execute callback on emitSVGPatch", () =>
  {
    const testFunction = jest.fn()
    internalEvent.addSVGPatchListener(testFunction)
    const svgPatch: TWSMessageEventSVGPatch = {
      type: "svgPatch",
      layer: "MODEL",
      updates: []
    }
    internalEvent.emitSVGPatch(svgPatch)
    expect(testFunction).toBeCalledTimes(1)
    expect(testFunction).toBeCalledWith(svgPatch)
  })

  test("should execute callback on emitExported", () =>
  {
    const testFunction = jest.fn()
    internalEvent.addExportedListener(testFunction)
    const data: TExport = {
      "text/plain": "test"
    }
    internalEvent.emitExported(data)
    expect(testFunction).toBeCalledTimes(1)
    expect(testFunction).toBeCalledWith(data)
  })

  test("should execute callback on emitClear", () =>
  {
    const testFunction = jest.fn()
    internalEvent.addClearListener(testFunction)
    internalEvent.emitClear()
    expect(testFunction).toBeCalledTimes(1)
  })

  test("should execute callback on emitError", () =>
  {
    const testFunction = jest.fn()
    internalEvent.addErrorListener(testFunction)
    const error = new Error("this is un error message")
    internalEvent.emitError(error)
    expect(testFunction).toBeCalledTimes(1)
    expect(testFunction).toBeCalledWith(error)
  })

  test("should execute callback on emitNotif", () =>
  {
    const testFunction = jest.fn()
    internalEvent.addNotifListener(testFunction)
    const notif = { message: "this is the end", timeout: 666 }
    internalEvent.emitNotif(notif)
    expect(testFunction).toBeCalledTimes(1)
    expect(testFunction).toBeCalledWith(notif)
  })

  test("should execute callback on emitImportJIIX", () =>
  {
    const testFunction = jest.fn()
    internalEvent.addImportJIIXListener(testFunction)
    const jiix = {
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
    internalEvent.emitImportJIIX(jiix)
    expect(testFunction).toBeCalledTimes(1)
    expect(testFunction).toBeCalledWith(jiix)
  })

  test("should execute callback on emitConvert with default value", () =>
  {
    const testFunction = jest.fn()
    internalEvent.addConvertListener(testFunction)
    internalEvent.emitConvert()
    expect(testFunction).toBeCalledTimes(1)
    expect(testFunction).toBeCalledWith("DIGITAL_EDIT")
  })

  test("should execute callback on emitConvert", () =>
  {
    const testFunction = jest.fn()
    internalEvent.addConvertListener(testFunction)
    internalEvent.emitConvert("HANDWRITING")
    expect(testFunction).toBeCalledTimes(1)
    expect(testFunction).toBeCalledWith("HANDWRITING")
  })

  test("should execute callback on emitClear", () =>
  {
    const testFunction = jest.fn()
    internalEvent.addClearMessageListener(testFunction)
    internalEvent.emitClearMessage()
    expect(testFunction).toBeCalledTimes(1)
  })

  test("should execute callback on emitContextChange", () =>
  {
    const testFunction = jest.fn()
    internalEvent.addContextChangeListener(testFunction)
    const context: TUndoRedoContext = {
      canRedo: true,
      canUndo: true,
      empty: false,
      possibleUndoCount: 2,
      stackIndex: 2
    }
    internalEvent.emitContextChange(context)
    expect(testFunction).toBeCalledTimes(1)
    expect(testFunction).toBeCalledWith(context)
  })

  test("should execute callback on emitIdle", () =>
  {
    const testFunction = jest.fn()
    internalEvent.addIdleListener(testFunction)
    internalEvent.emitIdle(true)
    expect(testFunction).toBeCalledTimes(1)
    expect(testFunction).toBeCalledWith(true)
  })

  test("should execute callback on emitSelected", () =>
  {
    const testFunction = jest.fn()
    internalEvent.addSelectedListener(testFunction)
    const symbols = [buildOICircle(), buildOIStroke()]
    internalEvent.emitSelected(symbols)
    expect(testFunction).toBeCalledTimes(1)
    expect(testFunction).toBeCalledWith(symbols)
  })

  test("should execute callback on emitIntention", () =>
  {
    const testFunction = jest.fn()
    internalEvent.addIntentionListener(testFunction)
    internalEvent.emitIntention(Intention.Select)
    expect(testFunction).toBeCalledTimes(1)
    expect(testFunction).toBeCalledWith(Intention.Select)
  })
})
