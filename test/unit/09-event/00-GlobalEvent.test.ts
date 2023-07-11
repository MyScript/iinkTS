import { EventType } from '../../../src/Constants'
import { GlobalEvent } from '../../../src/event/GlobalEvent'
import { Model } from '../../../src/model/Model'

describe('GlobalEvent.ts', () =>
{
  const gEvent = GlobalEvent.getInstance()

  test('should have singleton', () =>
  {
    const gEvent1 = GlobalEvent.getInstance()
    const gEvent2 = GlobalEvent.getInstance()
    expect(gEvent1).toBe(gEvent2)
    expect(gEvent1).toEqual(gEvent2)
    expect(gEvent1).toStrictEqual(gEvent2)
  })

  test('should emit & listen LOADED', () =>
  {
    const testFunction = jest.fn()
    gEvent.addEventListener(EventType.LOADED, testFunction)
    gEvent.emitLoaded()
    expect(testFunction).toBeCalledTimes(1)
  })

  test('should emit & listen EXPORTED', () =>
  {
    const testFunction = jest.fn()
    gEvent.addEventListener(EventType.EXPORTED, testFunction)
    const exports = { 'text/plain': 'tatapouet' }
    gEvent.emitExported(exports)
    expect(testFunction).toBeCalledTimes(1)
    expect(testFunction).toBeCalledWith(
      expect.objectContaining({
        detail: exports
      }),
    )
  })

  test('should emit & listen CHANGED', () =>
  {
    const testFunction = jest.fn()
    gEvent.addEventListener(EventType.CHANGED, testFunction)
    const undoRedoContext = {
      canUndo: false,
      canRedo: false,
      stack: [new Model(100, 50)],
      stackIndex: 0,
    }
    gEvent.emitChanged(undoRedoContext)
    expect(testFunction).toBeCalledTimes(1)
    expect(testFunction).toBeCalledWith(
      expect.objectContaining({
        detail: {
          canUndo: false,
          canRedo: false,
          canClear: false,
          stackIndex: 0,
          stackLength: 1,
          isEmpty: true,
        }
      }),
    )
  })

  test('should emit & listen IDLE', () =>
  {
    const testFunction = jest.fn()
    gEvent.addEventListener(EventType.IDLE, testFunction)
    const model = new Model(100, 50)
    gEvent.emitIdle(model)
    expect(testFunction).toBeCalledTimes(1)
    expect(testFunction).toBeCalledWith(
      expect.objectContaining({
        detail: model
      }),
    )
  })

  test('should emit & listen NOTIF', () =>
  {
    const testFunction = jest.fn()
    gEvent.addEventListener(EventType.NOTIF, testFunction)
    const notif = { message: 'this is the end', timeout: 666 }
    gEvent.emitNotif(notif.message, notif.timeout)
    expect(testFunction).toBeCalledTimes(1)
    expect(testFunction).toBeCalledWith(
      expect.objectContaining({
        detail: notif
      }),
    )
  })

  test('should emit & listen ERROR', () =>
  {
    const testFunction = jest.fn()
    gEvent.addEventListener(EventType.ERROR, testFunction)
    const error = new Error('this is un error message')
    gEvent.emitError(error)
    expect(testFunction).toBeCalledTimes(1)
    expect(testFunction).toBeCalledWith(
      expect.objectContaining({
        detail: error
      }),
    )
  })

  test('should emit & listen CLEAR', () =>
  {
    const testFunction = jest.fn()
    gEvent.addEventListener(EventType.CLEAR, testFunction)
    gEvent.emitClear()
    expect(testFunction).toBeCalledTimes(1)
  })

  test('should emit & listen CLEARED', () =>
  {
    const testFunction = jest.fn()
    gEvent.addEventListener(EventType.CLEARED, testFunction)
    const model = new Model(100, 50)
    gEvent.emitCleared(model)
    expect(testFunction).toBeCalledTimes(1)
    expect(testFunction).toBeCalledWith(
      expect.objectContaining({
        detail: model
      }),
    )
  })

  test('should emit & listen CONVERT', () =>
  {
    const testFunction = jest.fn()
    gEvent.addEventListener(EventType.CONVERT, testFunction)
    gEvent.emitConvert()
    expect(testFunction).toBeCalledTimes(1)
  })

  test('should emit & listen CONVERTED', () =>
  {
    const testFunction = jest.fn()
    gEvent.addEventListener(EventType.CONVERTED, testFunction)
    const exports = { 'text/plain': 'tatapouet' }
    gEvent.emitConverted(exports)
    expect(testFunction).toBeCalledTimes(1)
    expect(testFunction).toBeCalledWith(
      expect.objectContaining({
        detail: exports
      }),
    )
  })

  test('should emit & listen IMPORT', () =>
  {
    const testFunction = jest.fn()
    gEvent.addEventListener(EventType.IMPORT, testFunction)
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
    const mimeType = "application/vnd.myscript.jiix"
    gEvent.emitImport(jiix, mimeType)
    expect(testFunction).toBeCalledTimes(1)
    expect(testFunction).toBeCalledWith(
      expect.objectContaining({
        detail: {
          jiix,
          mimeType
        }
      }),
    )
  })

  test('should emit & listen IMPORTED', () =>
  {
    const testFunction = jest.fn()
    gEvent.addEventListener(EventType.IMPORTED, testFunction)
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
    gEvent.emitImported(jiix)
    expect(testFunction).toBeCalledTimes(1)
    expect(testFunction).toBeCalledWith(
      expect.objectContaining({
        detail: jiix
      }),
    )
  })

  test('should emit & listen CLEAR_MESSAGE', () =>
  {
    const testFunction = jest.fn()
    gEvent.addEventListener(EventType.CLEAR_MESSAGE, testFunction)
    gEvent.emitClearMessage()
    expect(testFunction).toBeCalledTimes(1)
  })
})
