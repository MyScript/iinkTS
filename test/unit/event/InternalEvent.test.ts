import {
  InternalEvent,
  TWSMessageEventSVGPatch
} from "../../../src/iink"

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

  test("should execute callback on emitNotif", () =>
  {
    const testFunction = jest.fn()
    internalEvent.addNotifListener(testFunction)
    const notif = { message: "this is the end", timeout: 666 }
    internalEvent.emitNotif(notif)
    expect(testFunction).toBeCalledTimes(1)
    expect(testFunction).toBeCalledWith(notif)
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

  test("should execute callback on emitClear", () =>
  {
    const testFunction = jest.fn()
    internalEvent.addClearListener(testFunction)
    internalEvent.emitClear()
    expect(testFunction).toBeCalledTimes(1)
  })

  test("should execute callback on emitConvert", () =>
  {
    const testFunction = jest.fn()
    internalEvent.addConvertListener(testFunction)
    internalEvent.emitConvert("DIGITAL_EDIT")
    expect(testFunction).toBeCalledTimes(1)
    expect(testFunction).toBeCalledWith("DIGITAL_EDIT")
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
          "candidates": [ "hello", "helle", "hellor", "hells", "hellon" ]
        }
      ],
      "version": "3",
      "id": "MainBlock"
    }
    internalEvent.emitImportJIIX(jiix)
    expect(testFunction).toBeCalledTimes(1)
    expect(testFunction).toBeCalledWith(jiix)
  })

  test("should execute callback on emitClearMessage", () =>
  {
    const testFunction = jest.fn()
    internalEvent.addClearMessageListener(testFunction)
    internalEvent.emitClearMessage()
    expect(testFunction).toBeCalledTimes(1)
  })
})
