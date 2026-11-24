import { ClientEvent, TExport, THistoryContext } from "@/iink"

describe("ClientEvent.ts", () => {
  const events = new ClientEvent()

  test("should execute callback on emitStartInitialization", () => {
    const callback = jest.fn()
    events.addStartInitialization(callback)
    events.emitStartInitialization()
    expect(callback).toHaveBeenCalledTimes(1)
  })

  test("should execute callback on emitEndInitialization", () => {
    const callback = jest.fn()
    events.addEndInitialization(callback)
    events.emitEndInitialization()
    expect(callback).toHaveBeenCalledTimes(1)
  })

  test("should execute callback on emitSessionOpened", () => {
    const callback = jest.fn()
    events.addSessionOpenedListener(callback)
    events.emitSessionOpened("session-42")
    expect(callback).toHaveBeenNthCalledWith(1, "session-42")
  })

  test("should execute callback on emitContentChanged, adding canClear derived from empty", () => {
    const callback = jest.fn()
    const context: THistoryContext = {
      canUndo: true,
      canRedo: false,
      empty: false,
      stackIndex: 1,
      possibleUndoCount: 1,
    }
    events.addContentChangedListener(callback)
    events.emitContentChanged(context)
    expect(callback).toHaveBeenNthCalledWith(1, { ...context, canClear: true })
  })

  test("should execute callback on emitIdle", () => {
    const callback = jest.fn()
    events.addIdleListener(callback)
    events.emitIdle(true)
    expect(callback).toHaveBeenNthCalledWith(1, true)
  })

  test("should execute callback on emitExported", () => {
    const callback = jest.fn()
    const exports: TExport = { "text/plain": "hello" }
    events.addExportedListener(callback)
    events.emitExported(exports)
    expect(callback).toHaveBeenNthCalledWith(1, exports)
  })

  test("should execute callback on emitError", () => {
    const callback = jest.fn()
    const error = new Error("boom")
    events.addErrorListener(callback)
    events.emitError(error)
    expect(callback).toHaveBeenNthCalledWith(1, error)
  })

  test("should execute callback on emitConnectionClose", () => {
    const callback = jest.fn()
    events.addConnectionCloseListener(callback)
    events.emitConnectionClose({ code: 1006, message: "abnormal closure" })
    expect(callback).toHaveBeenNthCalledWith(1, { code: 1006, message: "abnormal closure" })
  })

  test("should execute callback on emitConnectionStatusChanged", () => {
    const callback = jest.fn()
    events.addConnectionStatusChangedListener(callback)
    events.emitConnectionStatusChanged("offline")
    expect(callback).toHaveBeenNthCalledWith(1, "offline")
  })

  test("should remove all listeners", () => {
    const startCallback = jest.fn()
    const idleCallback = jest.fn()
    events.addStartInitialization(startCallback)
    events.addIdleListener(idleCallback)

    events.removeAllListeners()

    events.emitStartInitialization()
    events.emitIdle(true)
    expect(startCallback).toHaveBeenCalledTimes(0)
    expect(idleCallback).toHaveBeenCalledTimes(0)
  })

  test("should still accept new listeners after removeAllListeners", () => {
    const callback = jest.fn()
    events.addIdleListener(callback)
    events.emitIdle(false)
    expect(callback).toHaveBeenNthCalledWith(1, false)
  })
})
