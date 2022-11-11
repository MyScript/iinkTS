
import { IModel } from '../../../src/@types/model/Model'
import { TWebSocketSVGPatchEvent } from '../../../src/@types/recognizer/WSRecognizer'
import { TPoint } from '../../../src/@types/renderer/Point'
import { WSBehaviors } from '../../../src/behaviors/WSBehaviors'
import { DefaultConfiguration } from '../../../src/configuration/DefaultConfiguration'
import { GlobalEvent } from '../../../src/event/GlobalEvent'
import { Model } from '../../../src/model/Model'
import { DefaultPenStyle } from '../../../src/style/DefaultPenStyle'
import { delay } from '../utils/helpers'

describe('WSBehaviors.ts', () =>
{
  const globalEvent = GlobalEvent.getInstance()
  const height = 100, width = 100

  test('should instanciate WSBehaviors', () =>
  {
    const model: IModel = new Model(width, height)
    const wsb = new WSBehaviors(DefaultConfiguration, model)
    expect(wsb).toBeDefined()
  })

  test('should have globalEvent property', () =>
  {
    const model: IModel = new Model(width, height)
    const wsb = new WSBehaviors(DefaultConfiguration, model)
    expect(wsb.globalEvent).toBe(globalEvent)
  })

  test('should init grabber, renderer & recognizer', async () =>
  {
    const wrapperHTML: HTMLElement = document.createElement('div')
    const model: IModel = new Model(width, height)
    const wsb = new WSBehaviors(DefaultConfiguration, model)
    wsb.grabber.attach = jest.fn()
    wsb.renderer.init = jest.fn()
    wsb.recognizer.init = jest.fn()

    wsb.init(wrapperHTML)

    expect(wsb.grabber.attach).toBeCalledTimes(1)
    expect(wsb.grabber.attach).toBeCalledWith(wrapperHTML)
    expect(wsb.renderer.init).toBeCalledTimes(1)
    expect(wsb.renderer.init).toBeCalledWith(wrapperHTML)
    expect(wsb.recognizer.init).toBeCalledTimes(1)
    expect(wsb.recognizer.init).toBeCalledWith(model.height, model.width)
  })

  test('should resolve initalise promise when recognizer emit connection active', async () =>
  {
    const wrapperHTML: HTMLElement = document.createElement('div')
    const model: IModel = new Model(width, height)
    const wsb = new WSBehaviors(DefaultConfiguration, model)

    wsb.grabber.attach = jest.fn()
    wsb.renderer.init = jest.fn()
    wsb.recognizer.init = jest.fn()
    const initPromise = wsb.init(wrapperHTML)
    wsb.recognizer.wsEvent.emitConnectionActive()
    await initPromise
    expect(true).toBeTruthy()
  })

  test('should resolve initialise promise when recognizer emit disconnected with closeEvent.code === 1000', async () =>
  {
    const wrapperHTML: HTMLElement = document.createElement('div')
    const model: IModel = new Model(width, height)
    const wsb = new WSBehaviors(DefaultConfiguration, model)
    wsb.grabber.attach = jest.fn()
    wsb.renderer.init = jest.fn()
    wsb.recognizer.init = jest.fn()
    const initPromise = wsb.init(wrapperHTML)
    wsb.recognizer.wsEvent.emitDisconnected({ code: 1000 } as CloseEvent)
    await expect(initPromise).resolves.toBeUndefined()
  })

  test('should reject initialise promise when recognizer emit disconnected with closeEvent.code =!= 1000', async () =>
  {
    const wrapperHTML: HTMLElement = document.createElement('div')
    const model: IModel = new Model(width, height)
    const wsb = new WSBehaviors(DefaultConfiguration, model)
    wsb.grabber.attach = jest.fn()
    wsb.renderer.init = jest.fn()
    wsb.recognizer.init = jest.fn()
    const initPromise = wsb.init(wrapperHTML)
    const closeEvent = new CloseEvent('close', { code: 1001, reason: 'tatapouet'})
    wsb.recognizer.wsEvent.emitDisconnected(closeEvent)
    await expect(initPromise).rejects.toEqual(new Error(closeEvent.reason))
  })

  test('should call renderer on drawCurrentStroke', async () =>
  {
    const wrapperHTML: HTMLElement = document.createElement('div')
    const model: IModel = new Model(width, height)
    const p1: TPoint = { t: 1, p: 1, x: 1, y: 1 }
    model.initCurrentStroke(p1, 1, 'pen', DefaultPenStyle)
    const wsb = new WSBehaviors(DefaultConfiguration, model)
    wsb.grabber.attach = jest.fn()
    wsb.renderer.init = jest.fn()
    wsb.recognizer.init = jest.fn()
    const initPromise = wsb.init(wrapperHTML)
    wsb.recognizer.wsEvent.emitConnectionActive()
    await initPromise
    wsb.renderer.drawPendingStroke = jest.fn()
    wsb.drawCurrentStroke(model)
    expect(wsb.renderer.drawPendingStroke).toBeCalledTimes(1)
    expect(wsb.renderer.drawPendingStroke).toBeCalledWith(model.currentStroke)
  })

  test('should call recognizer on updateModelRendering', async () =>
  {
    const wrapperHTML: HTMLElement = document.createElement('div')
    const model: IModel = new Model(width, height)
    const wsb = new WSBehaviors(DefaultConfiguration, model)
    wsb.grabber.attach = jest.fn()
    wsb.renderer.init = jest.fn()
    wsb.recognizer.init = jest.fn()
    wsb.recognizer.addStrokes = jest.fn()
    const initPromise = wsb.init(wrapperHTML)
    wsb.recognizer.wsEvent.emitConnectionActive()
    wsb.updateModelRendering(model)
    await initPromise
    expect(wsb.recognizer.addStrokes).toBeCalledTimes(1)
    expect(wsb.recognizer.addStrokes).toBeCalledWith(model)
  })

  test('should resolve updateModelRendering when recognizer emit EXPORTED', async () =>
  {
    const wrapperHTML: HTMLElement = document.createElement('div')
    const model: IModel = new Model(width, height)
    const wsb = new WSBehaviors(DefaultConfiguration, model)
    wsb.grabber.attach = jest.fn()
    wsb.renderer.init = jest.fn()
    wsb.renderer.clearPendingStroke = jest.fn()
    wsb.recognizer.init = jest.fn()
    const initPromise = wsb.init(wrapperHTML)
    wsb.recognizer.wsEvent.emitConnectionActive()

    wsb.recognizer.addStrokes = jest.fn(m => Promise.resolve(m))
    wsb.globalEvent.emitExported = jest.fn(m => Promise.resolve(m))

    const addStrokePromise = wsb.updateModelRendering(model)
    await initPromise
    const exportMessage = {
      type: 'exported',
      partId: 'test',
      exports: { 'text/plain': 'tatapouet'}
    }

    wsb.recognizer.wsEvent.emitExported(exportMessage)
    await expect(addStrokePromise).resolves.toBe(model)

    expect(wsb.recognizer.addStrokes).toBeCalledTimes(1)
    expect(wsb.recognizer.addStrokes).toBeCalledWith(model)
  })

  test('should export', async () =>
  {
    const wrapperHTML: HTMLElement = document.createElement('div')
    const model: IModel = new Model(width, height)
    const wsb = new WSBehaviors(DefaultConfiguration, model)
    wsb.grabber.attach = jest.fn()
    wsb.renderer.init = jest.fn()
    wsb.recognizer.init = jest.fn()
    const initPromise = wsb.init(wrapperHTML)
    wsb.recognizer.wsEvent.emitConnectionActive()

    wsb.recognizer.export = jest.fn(m => Promise.resolve(m))
    wsb.globalEvent.emitExported = jest.fn(m => Promise.resolve(m))

    const exportPromise = wsb.export(model)
    await initPromise
    wsb.recognizer.wsEvent.emitExported({ type: 'exported', partId: 'xxx' , exports: { 'test/plain': 'cofveve' }})

    await expect(exportPromise).resolves.toBe(model)
    expect(wsb.recognizer.export).toBeCalledTimes(1)
    expect(wsb.recognizer.export).toBeCalledWith(model, undefined)
    expect(wsb.globalEvent.emitExported).toBeCalledTimes(1)
    expect(wsb.globalEvent.emitExported).toBeCalledWith(model.exports)
  })

  test('should call renderer on resize', async () =>
  {
    const wrapperHTML: HTMLElement = document.createElement('div')
    const model: IModel = new Model(width, height)
    const wsb = new WSBehaviors(DefaultConfiguration, model)

    wsb.grabber.attach = jest.fn()
    wsb.renderer.init = jest.fn()
    wsb.recognizer.init = jest.fn()
    const initPromise = wsb.init(wrapperHTML)
    wsb.recognizer.wsEvent.emitConnectionActive()

    wsb.renderer.resize = jest.fn()
    wsb.recognizer.resize = jest.fn(m => Promise.resolve(m))
    wsb.resize(model)
    await initPromise

    expect(wsb.renderer.resize).toBeCalledTimes(1)
    expect(wsb.renderer.resize).toBeCalledWith(model)
  })

  test('should resolve resize when recognizer emit CONTENT_CHANGE', async () =>
  {
    const wrapperHTML: HTMLElement = document.createElement('div')
    const model: IModel = new Model(width, height)
    const wsb = new WSBehaviors(DefaultConfiguration, model)

    wsb.grabber.attach = jest.fn()
    wsb.renderer.init = jest.fn()
    wsb.recognizer.init = jest.fn()
    const initPromise = wsb.init(wrapperHTML)
    wsb.recognizer.wsEvent.emitConnectionActive()
    await initPromise

    wsb.renderer.resize = jest.fn()
    wsb.recognizer.resize = jest.fn(m => Promise.resolve(m))
    const resizePromise = wsb.resize(model)
    await initPromise
    await delay(DefaultConfiguration.triggers.resizeTriggerDelay)

    const contentChangeMessage = {
      type: 'contentChange',
      partId: '1',
      canUndo: true,
      canRedo: false,
      empty: false,
      undoStackIndex: 1,
      possibleUndoCount: 1
    }

    wsb.recognizer.wsEvent.emitContentChange(contentChangeMessage)

    expect(wsb.recognizer.resize).toBeCalledTimes(1)
    expect(wsb.recognizer.resize).toBeCalledWith(model)

    await expect(resizePromise).resolves.toBe(model)
  })

  test('should updatesLayer when recognizer emit SVG_PATCH', async () =>
  {
    const wrapperHTML: HTMLElement = document.createElement('div')
    const model: IModel = new Model(width, height)
    const wsb = new WSBehaviors(DefaultConfiguration, model)

    wsb.grabber.attach = jest.fn()
    wsb.renderer.init = jest.fn()
    wsb.recognizer.init = jest.fn()
    const initPromise = wsb.init(wrapperHTML)
    wsb.recognizer.wsEvent.emitConnectionActive()

    wsb.renderer.updatesLayer = jest.fn()
    await initPromise

    const svgPatch: TWebSocketSVGPatchEvent = {
      type: 'REPLACE_ALL',
      layer: 'MODEL',
      updates: []
    }
    wsb.recognizer.wsEvent.emitSVGPatch(svgPatch)

    expect(wsb.renderer.updatesLayer).toBeCalledTimes(1)
    expect(wsb.renderer.updatesLayer).toBeCalledWith(svgPatch.layer, svgPatch.updates)
  })

  test('should call recognizer on undo', async () =>
  {
    const wrapperHTML: HTMLElement = document.createElement('div')
    const model: IModel = new Model(width, height)
    const wsb = new WSBehaviors(DefaultConfiguration, model)
    const initPromise = wsb.init(wrapperHTML)
    wsb.recognizer.wsEvent.emitConnectionActive()
    wsb.recognizer.undo = jest.fn()
    wsb.undo()
    await initPromise

    expect(wsb.recognizer.undo).toBeCalledTimes(1)
  })

  test('should resolve undo when recognizer emit CONTENT_CHANGE', async () =>
  {
    const wrapperHTML: HTMLElement = document.createElement('div')
    const model1: IModel = new Model(width, height)
    const wsb = new WSBehaviors(DefaultConfiguration, model1)
    const initPromise = wsb.init(wrapperHTML)
    wsb.recognizer.wsEvent.emitConnectionActive()
    wsb.recognizer.undo = jest.fn()
    wsb.recognizer.addStrokes = jest.fn()


    const model2: IModel = new Model(width, height)
    const p1: TPoint = { t: 1, p: 1, x: 1, y: 1 }
    const p2: TPoint = { t: 10, p: 1, x: 100, y: 1 }
    model2.initCurrentStroke(p1, 1, 'pen', DefaultPenStyle)
    model2.endCurrentStroke(p2, DefaultPenStyle)
    wsb.updateModelRendering(model2)

    const undoPromise = wsb.undo()
    await initPromise
    const contentChangeMessage = {
      type: 'contentChange',
      partId: '1',
      canUndo: true,
      canRedo: false,
      empty: false,
      undoStackIndex: 1,
      possibleUndoCount: 1
    }
    wsb.recognizer.wsEvent.emitContentChange(contentChangeMessage)

    expect(undoPromise).resolves.toEqual(model1)
  })

  test('should call recognizer on redo', async () =>
  {
    const wrapperHTML: HTMLElement = document.createElement('div')
    const model: IModel = new Model(width, height)
    const wsb = new WSBehaviors(DefaultConfiguration, model)
    const initPromise = wsb.init(wrapperHTML)
    wsb.recognizer.wsEvent.emitConnectionActive()
    wsb.recognizer.redo = jest.fn()
    wsb.redo()
    await initPromise

    expect(wsb.recognizer.redo).toBeCalledTimes(1)
  })

  test('should resolve redo when recognizer emit CONTENT_CHANGE', async () =>
  {
    const wrapperHTML: HTMLElement = document.createElement('div')
    const model1: IModel = new Model(width, height)
    const wsb = new WSBehaviors(DefaultConfiguration, model1)
    const initPromise = wsb.init(wrapperHTML)
    wsb.recognizer.wsEvent.emitConnectionActive()
    wsb.recognizer.undo = jest.fn()
    wsb.recognizer.redo = jest.fn()
    wsb.recognizer.addStrokes = jest.fn()
    await initPromise

    const model2: IModel = new Model(width, height)
    const p1: TPoint = { t: 1, p: 1, x: 1, y: 1 }
    const p2: TPoint = { t: 10, p: 1, x: 100, y: 1 }
    model2.initCurrentStroke(p1, 1, 'pen', DefaultPenStyle)
    model2.endCurrentStroke(p2, DefaultPenStyle)
    wsb.updateModelRendering(model2)

    wsb.undo()
    const redoPromise = wsb.redo()
    const contentChangeMessage = {
      type: 'contentChange',
      partId: '1',
      canUndo: true,
      canRedo: false,
      empty: false,
      undoStackIndex: 1,
      possibleUndoCount: 1
    }
    wsb.recognizer.wsEvent.emitContentChange(contentChangeMessage)

    expect(redoPromise).resolves.toEqual(model2)
  })

  test('should call recognizer on clear', async () =>
  {
    const wrapperHTML: HTMLElement = document.createElement('div')
    const model: IModel = new Model(width, height)
    const wsb = new WSBehaviors(DefaultConfiguration, model)
    const initPromise = wsb.init(wrapperHTML)
    wsb.recognizer.wsEvent.emitConnectionActive()
    wsb.recognizer.clear = jest.fn()
    wsb.clear(model)
    await initPromise

    expect(wsb.recognizer.clear).toBeCalledTimes(1)
  })

  test('should resolve clear when recognizer emit CONTENT_CHANGE', async () =>
  {
    const wrapperHTML: HTMLElement = document.createElement('div')
    const model: IModel = new Model(width, height)
    const wsb = new WSBehaviors(DefaultConfiguration, model)
    const initPromise = wsb.init(wrapperHTML)
    wsb.recognizer.wsEvent.emitConnectionActive()
    wsb.recognizer.clear = jest.fn()
    await initPromise

    const clearPromise = wsb.clear(model)
    const contentChangeMessage = {
      type: 'contentChange',
      partId: '1',
      canUndo: true,
      canRedo: false,
      empty: false,
      undoStackIndex: 1,
      possibleUndoCount: 1
    }
    wsb.recognizer.wsEvent.emitContentChange(contentChangeMessage)

    expect(clearPromise).resolves.toEqual(model)
  })

})