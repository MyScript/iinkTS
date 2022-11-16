import { TWebSocketSVGPatchEvent } from '../../../src/@types/recognizer/WSRecognizer'
import { WSEventType } from '../../../src/Constants'
import { WSEvent } from '../../../src/event/WSEvent'

describe('WSEvent.ts', () =>
{

  test('should instanciate', () =>
  {
    const wsEvent = new WSEvent()
    expect(wsEvent).toBeDefined()
  })

  test('should emit & listen INITIALIZED', () =>
  {
    const wsEvent = new WSEvent()
    const testFunction = jest.fn()
    wsEvent.addEventListener(WSEventType.INITIALIZED, testFunction)
    wsEvent.emitInitialized()
    expect(testFunction).toBeCalledTimes(1)
  })

  test('should emit & listen CONNECTED', () =>
  {
    const wsEvent = new WSEvent()
    const testFunction = jest.fn()
    wsEvent.addEventListener(WSEventType.CONNECTED, testFunction)
    wsEvent.emitConnected()
    expect(testFunction).toBeCalledTimes(1)
  })

  test('should emit & listen CONNECTION_ACTIVE', () =>
  {
    const wsEvent = new WSEvent()
    const testFunction = jest.fn()
    wsEvent.addConnectionActiveListener(testFunction)
    wsEvent.emitConnectionActive()
    expect(testFunction).toBeCalledTimes(1)
  })

  test('should emit & listen DISCONNECTED', () =>
  {
    const wsEvent = new WSEvent()
    const testFunction = jest.fn()
    wsEvent.addDisconnectedListener(testFunction)
    const event = new Event('close') as CloseEvent
    wsEvent.emitDisconnected(event)
    expect(testFunction).toBeCalledTimes(1)
    expect(testFunction).toBeCalledWith(event)
  })

  test('should emit & listen PART_CHANGE', () =>
  {
    const wsEvent = new WSEvent()
    const testFunction = jest.fn()
    wsEvent.addPartChangeListener(testFunction)
    const partChange = {
      type: 'partChange',
      partIdx: 0,
      partId: "partid",
      partCount: 1
    }
    wsEvent.emitPartChange(partChange)
    expect(testFunction).toBeCalledTimes(1)
    expect(testFunction).toBeCalledWith(partChange)
  })

  test('should emit & listen CONTENT_CHANGE', () =>
  {
    const wsEvent = new WSEvent()
    const testFunction = jest.fn()
    wsEvent.addContentChangeListener(testFunction)
    const contentChange = {
      type: 'contentChange',
      partId: 'partiid',
      canUndo: false,
      canRedo: true,
      empty: true,
      undoStackIndex: 0,
      possibleUndoCount: 0
    }
    wsEvent.emitContentChange(contentChange)
    expect(testFunction).toBeCalledTimes(1)
    expect(testFunction).toBeCalledWith(contentChange)
  })

  test('should emit & listen SVG_PATCH', () =>
  {
    const wsEvent = new WSEvent()
    const testFunction = jest.fn()
    wsEvent.addSVGPatchListener(testFunction)
    const svgPatch: TWebSocketSVGPatchEvent = {
      type: 'svgPatch',
      layer: 'MODEL',
      updates: []
    }
    wsEvent.emitSVGPatch(svgPatch)
    expect(testFunction).toBeCalledTimes(1)
    expect(testFunction).toBeCalledWith(svgPatch)
  })

  test('should emit & listen EXPORTED', () =>
  {
    const wsEvent = new WSEvent()
    const testFunction = jest.fn()
    wsEvent.addExportListener(testFunction)
    const exports = {
      type: 'exported',
      partId: 'MODEL',
      exports: { 'text/plain': 'tatapouet' }
    }
    wsEvent.emitExported(exports)
    expect(testFunction).toBeCalledTimes(1)
    expect(testFunction).toBeCalledWith(exports)
  })

  test('should emit & listen ERROR', () =>
  {
    const wsEvent = new WSEvent()
    const testFunction = jest.fn()
    wsEvent.addErrorListener(testFunction)
    const err = new Error('yolo')
    wsEvent.emitError(err)
    expect(testFunction).toBeCalledTimes(1)
    expect(testFunction).toBeCalledWith(err)
  })

  test.skip('should clearListeners', () =>
  {
    // TODO invistigate why does not work
    const wsEvent = new WSEvent()
    const testFunction = jest.fn()
    wsEvent.addErrorListener(testFunction)
    const err = new Error('yolo')
    wsEvent.emitError(err)
    wsEvent.clearListeners()
    wsEvent.emitError(err)
    expect(testFunction).toBeCalledTimes(1)
    expect(testFunction).toBeCalledWith(err)
  })
})
