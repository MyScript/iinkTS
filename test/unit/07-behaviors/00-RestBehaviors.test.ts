
import { IModel } from '../../../src/@types/model/Model'
import { TPoint } from '../../../src/@types/renderer/Point'
import { RestBehaviors } from '../../../src/behaviors/RestBehaviors'
import { DefaultConfiguration } from '../../../src/configuration/DefaultConfiguration'
import { GlobalEvent } from '../../../src/event/GlobalEvent'
import { Model } from '../../../src/model/Model'
import { DefaultPenStyle } from '../../../src/style/DefaultPenStyle'
import { delay } from '../utils/helpers'

describe('RestBehaviors.ts', () =>
{
  const height = 100, width = 100

  test('should instanciate RestBehaviors', () =>
  {
    const model: IModel = new Model(width, height)
    const rb = new RestBehaviors(DefaultConfiguration, model)
    expect(rb).toBeDefined()
  })

  test('should have globalEvent property', () =>
  {
    const model: IModel = new Model(width, height)
    const rb = new RestBehaviors(DefaultConfiguration, model)
    expect(rb.globalEvent).toBe(GlobalEvent.getInstance())
  })

  test('should init', async () =>
  {
    const wrapperHTML: HTMLElement = document.createElement('div')
    const model: IModel = new Model(width, height)
    const rb = new RestBehaviors(DefaultConfiguration, model)
    rb.grabber.attach = jest.fn()
    rb.renderer.init = jest.fn()
    await rb.init(wrapperHTML)

    expect(rb.grabber.attach).toBeCalledTimes(1)
    expect(rb.grabber.attach).toBeCalledWith(wrapperHTML)
    expect(rb.renderer.init).toBeCalledTimes(1)
    expect(rb.renderer.init).toBeCalledWith(wrapperHTML)
  })

  test('should call renderer on drawCurrentStroke', async () =>
  {
    const wrapperHTML: HTMLElement = document.createElement('div')
    const model: IModel = new Model(width, height)
    const p1: TPoint = { t: 1, p: 1, x: 1, y: 1 }
    const p2: TPoint = { t: 10, p: 1, x: 100, y: 1 }
    model.initCurrentStroke(p1, 1, 'pen', DefaultPenStyle)
    model.endCurrentStroke(p2, DefaultPenStyle)
    const rb = new RestBehaviors(DefaultConfiguration, model)
    await rb.init(wrapperHTML)
    rb.renderer.drawPendingStroke = jest.fn()
    rb.drawCurrentStroke(model)
    expect(rb.renderer.drawPendingStroke).toBeCalledTimes(1)
    expect(rb.renderer.drawPendingStroke).toBeCalledWith(model.currentStroke)
  })

  test('should call renderer on updateModelRendering', async () =>
  {
    const wrapperHTML: HTMLElement = document.createElement('div')
    const model: IModel = new Model(width, height)
    const rb = new RestBehaviors(DefaultConfiguration, model)
    await rb.init(wrapperHTML)
    rb.renderer.drawModel = jest.fn()
    rb.updateModelRendering(model)
    expect(rb.renderer.drawModel).toBeCalledTimes(1)
    expect(rb.renderer.drawModel).toBeCalledWith(model)
  })

  test('should export', async () =>
  {
    const wrapperHTML: HTMLElement = document.createElement('div')
    const model: IModel = new Model(width, height)
    const rb = new RestBehaviors(DefaultConfiguration, model)
    await rb.init(wrapperHTML)

    rb.recognizer.export = jest.fn(m => Promise.resolve(m))
    rb.globalEvent.emitExported = jest.fn(m => Promise.resolve(m))

    rb.export(model)
    await delay(DefaultConfiguration.triggers.exportContentDelay)

    expect(rb.recognizer.export).toBeCalledTimes(1)
    expect(rb.recognizer.export).toBeCalledWith(model, undefined)
    // TODO review singleton on GlobalEvent
    // expect(rb.globalEvent.emitExported).toBeCalledTimes(1)
    expect(rb.globalEvent.emitExported).toBeCalledWith(model.exports)
  })

  test('should not export if trigger configuration have exportContent = DEMAND', async () =>
  {
    const wrapperHTML: HTMLElement = document.createElement('div')
    const model: IModel = new Model(width, height)
    const conf = {
      ...DefaultConfiguration
    }
    conf.triggers.exportContent = 'DEMAND'
    const rb = new RestBehaviors(conf, model)
    await rb.init(wrapperHTML)

    rb.recognizer.export = jest.fn(m => Promise.resolve(m))

    rb.export(model)
    await delay(DefaultConfiguration.triggers.exportContentDelay)

    expect(rb.recognizer.export).toBeCalledTimes(0)
  })

  test('should resize', async () =>
  {
    const wrapperHTML: HTMLElement = document.createElement('div')
    const model: IModel = new Model(width, height)
    const p1: TPoint = { t: 1, p: 1, x: 1, y: 1 }
    const p2: TPoint = { t: 10, p: 1, x: 100, y: 1 }
    model.initCurrentStroke(p1, 1, 'pen', DefaultPenStyle)
    model.endCurrentStroke(p2, DefaultPenStyle)

    const rb = new RestBehaviors(DefaultConfiguration, model)
    await rb.init(wrapperHTML)

    rb.renderer.resize = jest.fn()
    rb.recognizer.resize = jest.fn(m => Promise.resolve(m))

    rb.resize(model)
    await delay(DefaultConfiguration.triggers.resizeTriggerDelay)

    expect(rb.renderer.resize).toBeCalledTimes(1)
    expect(rb.renderer.resize).toBeCalledWith(model)
    expect(rb.recognizer.resize).toBeCalledTimes(1)
    expect(rb.recognizer.resize).toBeCalledWith(model)
  })

  test('should not call recognizer on resize if no strokes', async () =>
  {
    const wrapperHTML: HTMLElement = document.createElement('div')
    const model: IModel = new Model(width, height)
    const rb = new RestBehaviors(DefaultConfiguration, model)
    await rb.init(wrapperHTML)

    rb.renderer.resize = jest.fn()
    rb.recognizer.resize = jest.fn(m => Promise.resolve(m))

    rb.resize(model)
    await delay(DefaultConfiguration.triggers.resizeTriggerDelay)

    expect(rb.renderer.resize).toBeCalledTimes(1)
    expect(rb.renderer.resize).toBeCalledWith(model)
    expect(rb.recognizer.resize).toBeCalledTimes(0)
  })

  test('should undo', async () =>
  {
    const wrapperHTML: HTMLElement = document.createElement('div')
    const model1: IModel = new Model(width, height)
    const rb = new RestBehaviors(DefaultConfiguration, model1)
    await rb.init(wrapperHTML)

    rb.recognizer.export = jest.fn(m => Promise.resolve(m))
    rb.renderer.drawModel = jest.fn()

    const model2: IModel = new Model(width, height)
    const p1: TPoint = { t: 1, p: 1, x: 1, y: 1 }
    const p2: TPoint = { t: 10, p: 1, x: 100, y: 1 }
    model2.initCurrentStroke(p1, 1, 'pen', DefaultPenStyle)
    model2.endCurrentStroke(p2, DefaultPenStyle)

    await rb.export(model2)
    await delay(DefaultConfiguration.triggers.exportContentDelay)

    const firstMod = await rb.undo()

    expect(firstMod).toEqual(model1)
  })

  test('should undo', async () =>
  {
    const wrapperHTML: HTMLElement = document.createElement('div')
    const model1: IModel = new Model(width, height)
    const rb = new RestBehaviors(DefaultConfiguration, model1)
    await rb.init(wrapperHTML)

    rb.recognizer.export = jest.fn(m => Promise.resolve(m))
    rb.renderer.drawModel = jest.fn()

    const model2: IModel = new Model(width, height)
    const p1: TPoint = { t: 1, p: 1, x: 1, y: 1 }
    const p2: TPoint = { t: 10, p: 1, x: 100, y: 1 }
    model2.initCurrentStroke(p1, 1, 'pen', DefaultPenStyle)
    model2.endCurrentStroke(p2, DefaultPenStyle)

    await rb.export(model2)
    await delay(DefaultConfiguration.triggers.exportContentDelay)

    await rb.undo()

    const secondMod = await rb.redo()

    expect(secondMod).toEqual(model2)
  })

  test('should clear', async () =>
  {
    const wrapperHTML: HTMLElement = document.createElement('div')
    const model1: IModel = new Model(width, height)
    const rb = new RestBehaviors(DefaultConfiguration, model1)
    await rb.init(wrapperHTML)

    rb.recognizer.export = jest.fn(m => Promise.resolve(m))
    rb.globalEvent.emitExported = jest.fn(m => Promise.resolve(m))
    rb.globalEvent.emitCleared = jest.fn(m => Promise.resolve(m))
    rb.renderer.drawModel = jest.fn()

    const model2: IModel = new Model(width, height)
    const p1: TPoint = { t: 1, p: 1, x: 1, y: 1 }
    const p2: TPoint = { t: 10, p: 1, x: 100, y: 1 }
    model2.initCurrentStroke(p1, 1, 'pen', DefaultPenStyle)
    model2.endCurrentStroke(p2, DefaultPenStyle)

    await rb.export(model2)
    await delay(DefaultConfiguration.triggers.exportContentDelay)
    expect(model2.rawStrokes.length).toBeGreaterThan(0)

    const clearedModel = await rb.clear(model2)

    expect(clearedModel.modificationDate).toBeGreaterThan(model2.modificationDate)
    expect(clearedModel.rawStrokes).toHaveLength(0)

    expect(rb.globalEvent.emitExported).toBeCalledTimes(1)
    expect(rb.globalEvent.emitExported).toBeCalledWith(clearedModel.exports)
    expect(rb.globalEvent.emitCleared).toBeCalledTimes(1)
    expect(rb.globalEvent.emitCleared).toBeCalledWith(clearedModel)

  })

})