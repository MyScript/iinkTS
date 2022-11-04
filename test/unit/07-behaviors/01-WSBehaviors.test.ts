
import { IModel } from '../../../src/@types/model/Model'
// import { TPoint } from '../../../src/@types/renderer/Point'
import { WSBehaviors } from '../../../src/behaviors/WSBehaviors'
import { DefaultConfiguration } from '../../../src/configuration/DefaultConfiguration'
import { GlobalEvent } from '../../../src/event/GlobalEvent'
import { Model } from '../../../src/model/Model'
// import { DefaultPenStyle } from '../../../src/style/DefaultPenStyle'
// import { delay } from '../utils/helpers'

describe('WSBehaviors.ts', () =>
{
  const globalEvent = GlobalEvent.getInstance()
  const height = 100, width = 100

  test('should instanciate WSBehaviors', () =>
  {
    const wsb = new WSBehaviors(DefaultConfiguration)
    expect(wsb).toBeDefined()
  })

  test('should have globalEvents property', () =>
  {
    const wsb = new WSBehaviors(DefaultConfiguration)
    expect(wsb.globalEvents).toBe(globalEvent)
  })

  test('should init grabber, renderer & recognizer', async () =>
  {
    const wrapperHTML: HTMLElement = document.createElement('div')
    const model: IModel = new Model(width, height)
    const wsb = new WSBehaviors(DefaultConfiguration)
    wsb.grabber.attach = jest.fn()
    wsb.renderer.init = jest.fn()
    wsb.recognizer.init = jest.fn()

    wsb.init(wrapperHTML, model)

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
    const wsb = new WSBehaviors(DefaultConfiguration)

    wsb.grabber.attach = jest.fn()
    wsb.renderer.init = jest.fn()
    wsb.recognizer.init = jest.fn()
    const initPromise = wsb.init(wrapperHTML, model)
    wsb.recognizer.wsEvent.emitConnectionActive()
    await initPromise
    expect(true).toBeTruthy()
  })

  test('should resolve initialise promise when recognizer emit disconnected with closeEvent.code === 1000', async () =>
  {
    const wrapperHTML: HTMLElement = document.createElement('div')
    const model: IModel = new Model(width, height)
    const wsb = new WSBehaviors(DefaultConfiguration)
    wsb.grabber.attach = jest.fn()
    wsb.renderer.init = jest.fn()
    wsb.recognizer.init = jest.fn()
    const initPromise = wsb.init(wrapperHTML, model)
    wsb.recognizer.wsEvent.emitDisconnected({ code: 1000 } as CloseEvent)
    await expect(initPromise).resolves.toBeUndefined()
  })

  test('should reject initialise promise when recognizer emit disconnected with closeEvent.code =!= 1000', async () =>
  {
    const wrapperHTML: HTMLElement = document.createElement('div')
    const model: IModel = new Model(width, height)
    const wsb = new WSBehaviors(DefaultConfiguration)
    wsb.grabber.attach = jest.fn()
    wsb.renderer.init = jest.fn()
    wsb.recognizer.init = jest.fn()
    const initPromise = wsb.init(wrapperHTML, model)
    const closeEvent = new CloseEvent('close', { code: 1001, reason: 'tatapouet'})
    wsb.recognizer.wsEvent.emitDisconnected(closeEvent)
    await expect(initPromise).rejects.toEqual(new Error(closeEvent.reason))
  })

  test('should call renderer on drawCurrentModel', async () =>
  {
    const wrapperHTML: HTMLElement = document.createElement('div')
    const model: IModel = new Model(width, height)
    const wsb = new WSBehaviors(DefaultConfiguration)
    wsb.grabber.attach = jest.fn()
    wsb.renderer.init = jest.fn()
    wsb.recognizer.init = jest.fn()
    const initPromise = wsb.init(wrapperHTML, model)
    wsb.recognizer.wsEvent.emitConnectionActive()
    await initPromise
    wsb.renderer.drawCurrentStroke = jest.fn()
    wsb.drawCurrentStroke(model)
    expect(wsb.renderer.drawCurrentStroke).toBeCalledTimes(1)
    expect(wsb.renderer.drawCurrentStroke).toBeCalledWith(model, wsb.stroker)
  })

  test('should call renderer on drawModel', async () =>
  {
    const wrapperHTML: HTMLElement = document.createElement('div')
    const model: IModel = new Model(width, height)
    const wsb = new WSBehaviors(DefaultConfiguration)
    wsb.grabber.attach = jest.fn()
    wsb.renderer.init = jest.fn()
    wsb.recognizer.init = jest.fn()
    const initPromise = wsb.init(wrapperHTML, model)
    wsb.recognizer.wsEvent.emitConnectionActive()
    await initPromise
    wsb.renderer.drawModel = jest.fn()
    wsb.drawModel(model)
    expect(wsb.renderer.drawModel).toBeCalledTimes(1)
    expect(wsb.renderer.drawModel).toBeCalledWith(model, wsb.stroker)
  })

  test('should addStrokes', async () =>
  {
    const wrapperHTML: HTMLElement = document.createElement('div')
    const model: IModel = new Model(width, height)
    const wsb = new WSBehaviors(DefaultConfiguration)
    wsb.grabber.attach = jest.fn()
    wsb.renderer.init = jest.fn()
    wsb.recognizer.init = jest.fn()
    const initPromise = wsb.init(wrapperHTML, model)
    wsb.recognizer.wsEvent.emitConnectionActive()

    wsb.recognizer.addStrokes = jest.fn(m => Promise.resolve(m))
    wsb.globalEvents.emitExported = jest.fn(m => Promise.resolve(m))

    const addStrokePromise = wsb.addStrokes(model)
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
    await expect(addStrokePromise).resolves.toBe(model)

    expect(wsb.recognizer.addStrokes).toBeCalledTimes(1)
    expect(wsb.recognizer.addStrokes).toBeCalledWith(model)
  })

  test('should export', async () =>
  {
    const wrapperHTML: HTMLElement = document.createElement('div')
    const model: IModel = new Model(width, height)
    const wsb = new WSBehaviors(DefaultConfiguration)
    wsb.grabber.attach = jest.fn()
    wsb.renderer.init = jest.fn()
    wsb.recognizer.init = jest.fn()
    const initPromise = wsb.init(wrapperHTML, model)
    wsb.recognizer.wsEvent.emitConnectionActive()

    wsb.recognizer.export = jest.fn(m => Promise.resolve(m))
    wsb.globalEvents.emitExported = jest.fn(m => Promise.resolve(m))

    const exportPromise = wsb.export(model)
    await initPromise
    wsb.recognizer.wsEvent.emitExported({ type: 'export', partId: 'xxx' , exports: { 'test/plain': 'cofveve' }})

    await expect(exportPromise).resolves.toBe(model)
    expect(wsb.recognizer.export).toBeCalledTimes(1)
    expect(wsb.recognizer.export).toBeCalledWith(model, undefined)
    expect(wsb.globalEvents.emitExported).toBeCalledTimes(1)
    expect(wsb.globalEvents.emitExported).toBeCalledWith(model.exports)
  })

  test('should resize', async () =>
  {
    const wrapperHTML: HTMLElement = document.createElement('div')
    const model: IModel = new Model(width, height)
    const wsb = new WSBehaviors(DefaultConfiguration)

    wsb.grabber.attach = jest.fn()
    wsb.renderer.init = jest.fn()
    wsb.recognizer.init = jest.fn()
    wsb.init(wrapperHTML, model)
    wsb.recognizer.wsEvent.emitConnectionActive()

    wsb.renderer.resize = jest.fn()
    wsb.recognizer.resize = jest.fn(m => Promise.resolve(m))

    await expect(wsb.resize(model)).resolves.toBe(model)

    // expect(wsb.renderer.resize).toBeCalledTimes(1)
    // expect(wsb.renderer.resize).toBeCalledWith(model, wsb.stroker)
    expect(wsb.recognizer.resize).toBeCalledTimes(1)
    expect(wsb.recognizer.resize).toBeCalledWith(model)
  })

  // TODO add Test
  // test('should undo', async () =>
  // {
  //   const wrapperHTML: HTMLElement = document.createElement('div')
  //   const model1: IModel = new Model(width, height)
  //   const wsb = new WSBehaviors(DefaultConfiguration, model1)
  //   await wsb.init(wrapperHTML)

  //   wsb.recognizer.export = jest.fn(m => Promise.resolve(m))
  //   wsb.renderer.drawModel = jest.fn()

  //   const model2: IModel = new Model(width, height)
  //   const p1: TPoint = { t: 1, p: 1, x: 1, y: 1 }
  //   const p2: TPoint = { t: 10, p: 1, x: 100, y: 1 }
  //   model2.initCurrentStroke(p1, 1, 'pen', DefaultPenStyle)
  //   model2.endCurrentStroke(p2, DefaultPenStyle)

  //   await wsb.export(model2)
  //   await delay(DefaultConfiguration.triggers.exportContentDelay)

  //   const firstMod = await wsb.undo()

  //   expect(firstMod).toEqual(model1)
  // })

  // test('should undo', async () =>
  // {
  //   const wrapperHTML: HTMLElement = document.createElement('div')
  //   const model1: IModel = new Model(width, height)
  //   const wsb = new WSBehaviors(DefaultConfiguration, model1)
  //   await wsb.init(wrapperHTML)

  //   wsb.recognizer.export = jest.fn(m => Promise.resolve(m))
  //   wsb.renderer.drawModel = jest.fn()

  //   const model2: IModel = new Model(width, height)
  //   const p1: TPoint = { t: 1, p: 1, x: 1, y: 1 }
  //   const p2: TPoint = { t: 10, p: 1, x: 100, y: 1 }
  //   model2.initCurrentStroke(p1, 1, 'pen', DefaultPenStyle)
  //   model2.endCurrentStroke(p2, DefaultPenStyle)

  //   await wsb.export(model2)
  //   await delay(DefaultConfiguration.triggers.exportContentDelay)

  //   await wsb.undo()

  //   const secondMod = await wsb.redo()

  //   expect(secondMod).toEqual(model2)
  // })

  // test('should clear', async () =>
  // {
  //   const wrapperHTML: HTMLElement = document.createElement('div')
  //   const model1: IModel = new Model(width, height)
  //   const wsb = new WSBehaviors(DefaultConfiguration, model1)
  //   await wsb.init(wrapperHTML)

  //   wsb.recognizer.export = jest.fn(m => Promise.resolve(m))
  //   wsb.globalEvents.emitExported = jest.fn(m => Promise.resolve(m))
  //   wsb.globalEvents.emitCleared = jest.fn(m => Promise.resolve(m))
  //   wsb.renderer.drawModel = jest.fn()

  //   const model2: IModel = new Model(width, height)
  //   const p1: TPoint = { t: 1, p: 1, x: 1, y: 1 }
  //   const p2: TPoint = { t: 10, p: 1, x: 100, y: 1 }
  //   model2.initCurrentStroke(p1, 1, 'pen', DefaultPenStyle)
  //   model2.endCurrentStroke(p2, DefaultPenStyle)

  //   await wsb.export(model2)
  //   await delay(DefaultConfiguration.triggers.exportContentDelay)
  //   expect(model2.rawStrokes.length).toBeGreaterThan(0)

  //   const clearedModel = await wsb.clear(model2)

  //   expect(clearedModel.modificationDate).toBeGreaterThan(model2.modificationDate)
  //   expect(clearedModel.rawStrokes).toHaveLength(0)

  //   expect(wsb.globalEvents.emitExported).toBeCalledTimes(1)
  //   expect(wsb.globalEvents.emitExported).toBeCalledWith(clearedModel.exports)
  //   expect(wsb.globalEvents.emitCleared).toBeCalledTimes(1)
  //   expect(wsb.globalEvents.emitCleared).toBeCalledWith(clearedModel)

  // })

})