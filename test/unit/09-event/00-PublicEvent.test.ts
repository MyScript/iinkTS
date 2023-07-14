import { TExport, TJIIXExport } from '../../../src/@types/model/Model'
import { EventType } from '../../../src/Constants'
import { PublicEvent } from '../../../src/event/PublicEvent'
import { Model } from '../../../src/model/Model'

describe('PublicEvent.ts', () =>
{
  const gEvent = PublicEvent.getInstance()

  test('should have singleton', () =>
  {
    const gEvent1 = PublicEvent.getInstance()
    const gEvent2 = PublicEvent.getInstance()
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
    const exports:TExport = { 'text/plain': 'tatapouet' }
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
      canUndo: true,
      canRedo: false,
      canClear: true,
      stackIndex: 10,
      empty: false,
      possibleUndoCount: 10,
      stack: []
    }
    gEvent.emitChanged(undoRedoContext)
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

  test('should emit & listen CONVERTED', () =>
  {
    const testFunction = jest.fn()
    gEvent.addEventListener(EventType.CONVERTED, testFunction)
    const exports: TExport = { 'text/plain': 'tatapouet' }
    gEvent.emitConverted(exports)
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
    gEvent.addEventListener(EventType.IMPORTED, testFunction)
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
    gEvent.emitImported(jiix)
    expect(testFunction).toBeCalledTimes(1)
    expect(testFunction).toBeCalledWith(
      expect.objectContaining({
        detail: jiix
      }),
    )
  })

})
