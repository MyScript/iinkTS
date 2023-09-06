import {
  TExport,
  TJIIXExport
} from '../../../src/@types'
import {
  Constants,
  PublicEvent,
  Model
} from '../../../src/iink'

describe('PublicEvent.ts', () =>
{
  const publicEvent = PublicEvent.getInstance()

  test('should have singleton', () =>
  {
    const publicEvent1 = PublicEvent.getInstance()
    const publicEvent2 = PublicEvent.getInstance()
    expect(publicEvent1).toBe(publicEvent2)
    expect(publicEvent1).toEqual(publicEvent2)
    expect(publicEvent1).toStrictEqual(publicEvent2)
  })

  test('should emit & listen LOADED', () =>
  {
    const testFunction = jest.fn()
    publicEvent.addEventListener(Constants.EventType.LOADED, testFunction)
    publicEvent.emitLoaded()
    expect(testFunction).toBeCalledTimes(1)
  })

  test('should emit & listen EXPORTED', () =>
  {
    const testFunction = jest.fn()
    publicEvent.addEventListener(Constants.EventType.EXPORTED, testFunction)
    const exports:TExport = { 'text/plain': 'tatapouet' }
    publicEvent.emitExported(exports)
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
    publicEvent.addEventListener(Constants.EventType.CHANGED, testFunction)
    const undoRedoContext = {
      canUndo: true,
      canRedo: false,
      canClear: true,
      stackIndex: 10,
      empty: false,
      possibleUndoCount: 10,
      stack: []
    }
    publicEvent.emitChanged(undoRedoContext)
    expect(testFunction).toBeCalledTimes(1)
    expect(testFunction).toBeCalledWith(
      expect.objectContaining({
        detail: undoRedoContext
      }),
    )
  })

  test('should emit & listen IDLE', () =>
  {
    const testFunction = jest.fn()
    publicEvent.addEventListener(Constants.EventType.IDLE, testFunction)
    publicEvent.emitIdle(true)
    expect(testFunction).toBeCalledTimes(1)
    expect(testFunction).toBeCalledWith(
      expect.objectContaining({
        detail: true
      }),
    )
  })

  test('should emit & listen CLEARED', () =>
  {
    const testFunction = jest.fn()
    publicEvent.addEventListener(Constants.EventType.CLEARED, testFunction)
    const model = new Model(100, 50)
    publicEvent.emitCleared(model)
    expect(testFunction).toBeCalledTimes(1)
    expect(testFunction).toBeCalledWith(
      expect.objectContaining({
        detail: model
      }),
    )
  })

  test('should emit & listen CONVERTED', () =>
  {
    const testFunction = jest.fn()
    publicEvent.addEventListener(Constants.EventType.CONVERTED, testFunction)
    const exports: TExport = { 'text/plain': 'tatapouet' }
    publicEvent.emitConverted(exports)
    expect(testFunction).toBeCalledTimes(1)
    expect(testFunction).toBeCalledWith(
      expect.objectContaining({
        detail: exports
      }),
    )
  })

  test('should emit & listen IMPORTED', () =>
  {
    const testFunction = jest.fn()
    publicEvent.addEventListener(Constants.EventType.IMPORTED, testFunction)
    const jiix: TJIIXExport = {
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
    const exports: TExport = {
      "application/vnd.myscript.jiix": jiix
    }
    publicEvent.emitImported(exports)
    expect(testFunction).toBeCalledTimes(1)
    expect(testFunction).toBeCalledWith(
      expect.objectContaining({
        detail: exports
      }),
    )
  })

})
