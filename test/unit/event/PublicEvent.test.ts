import
  {
    PublicEvent,
    EventType,
    Model,
    TExport,
    TJIIXExport,
    Intention
  } from "../../../src/iink"
import { buildOICircle, buildOIStroke } from "../helpers"

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
    publicEvent.addEventListener(EventType.LOADED, testFunction)
    publicEvent.emitLoaded()
    expect(testFunction).toBeCalledTimes(1)
  })

  test('should emit & listen EXPORTED', () =>
  {
    const testFunction = jest.fn()
    publicEvent.addEventListener(EventType.EXPORTED, testFunction)
    const exports: TExport = { 'text/plain': 'tatapouet' }
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
    publicEvent.addEventListener(EventType.CHANGED, testFunction)
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
    publicEvent.addEventListener(EventType.IDLE, testFunction)
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
    publicEvent.addEventListener(EventType.CLEARED, testFunction)
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
    publicEvent.addEventListener(EventType.CONVERTED, testFunction)
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
    publicEvent.addEventListener(EventType.IMPORTED, testFunction)
    const jiix: TJIIXExport = {
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

  test('should emit & listen SELECTED', () =>
  {
    const testFunction = jest.fn()
    publicEvent.addEventListener(EventType.SELECTED, testFunction)
    const symbols = [buildOICircle(), buildOIStroke()]
    publicEvent.emitSelected(symbols)
    expect(testFunction).toBeCalledTimes(1)
    expect(testFunction).toBeCalledWith(
      expect.objectContaining({
        detail: symbols
      })
    )
  })

  test('should emit & listen INTENTION', () =>
  {
    const testFunction = jest.fn()
    publicEvent.addEventListener(EventType.INTENTION, testFunction)
    publicEvent.emitIntention(Intention.Write)
    expect(testFunction).toBeCalledTimes(1)
    expect(testFunction).toBeCalledWith(
      expect.objectContaining({
        detail: Intention.Write
      })
    )
  })

})
