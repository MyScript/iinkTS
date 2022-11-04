
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

  test('should have globalEvents property', () =>
  {
    const model: IModel = new Model(width, height)
    const rb = new RestBehaviors(DefaultConfiguration, model)
    expect(rb.globalEvents).toBe(GlobalEvent.getInstance())
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

  test('should call renderer on drawCurrentModel', async () =>
  {
    const wrapperHTML: HTMLElement = document.createElement('div')
    const model: IModel = new Model(width, height)
    const rb = new RestBehaviors(DefaultConfiguration, model)
    await rb.init(wrapperHTML)
    rb.renderer.drawCurrentStroke = jest.fn()
    rb.drawCurrentStroke(model)
    expect(rb.renderer.drawCurrentStroke).toBeCalledTimes(1)
    expect(rb.renderer.drawCurrentStroke).toBeCalledWith(model, rb.stroker)
  })

  test('should call renderer on drawModel', async () =>
  {
    const wrapperHTML: HTMLElement = document.createElement('div')
    const model: IModel = new Model(width, height)
    const rb = new RestBehaviors(DefaultConfiguration, model)
    await rb.init(wrapperHTML)
    rb.renderer.drawModel = jest.fn()
    rb.drawModel(model)
    expect(rb.renderer.drawModel).toBeCalledTimes(1)
    expect(rb.renderer.drawModel).toBeCalledWith(model, rb.stroker)
  })

  test('should export', async () =>
  {
    const wrapperHTML: HTMLElement = document.createElement('div')
    const model: IModel = new Model(width, height)
    const rb = new RestBehaviors(DefaultConfiguration, model)
    await rb.init(wrapperHTML)

    rb.recognizer.export = jest.fn(m => Promise.resolve(m))
    rb.globalEvents.emitExported = jest.fn(m => Promise.resolve(m))

    rb.export(model)
    await delay(DefaultConfiguration.triggers.exportContentDelay)

    expect(rb.recognizer.export).toBeCalledTimes(1)
    expect(rb.recognizer.export).toBeCalledWith(model, undefined)
    expect(rb.globalEvents.emitExported).toBeCalledTimes(1)
    expect(rb.globalEvents.emitExported).toBeCalledWith(model.exports)
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
    expect(rb.renderer.resize).toBeCalledWith(model, rb.stroker)
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
    expect(rb.renderer.resize).toBeCalledWith(model, rb.stroker)
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
    rb.globalEvents.emitExported = jest.fn(m => Promise.resolve(m))
    rb.globalEvents.emitCleared = jest.fn(m => Promise.resolve(m))
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

    expect(rb.globalEvents.emitExported).toBeCalledTimes(1)
    expect(rb.globalEvents.emitExported).toBeCalledWith(clearedModel.exports)
    expect(rb.globalEvents.emitCleared).toBeCalledTimes(1)
    expect(rb.globalEvents.emitCleared).toBeCalledWith(clearedModel)

  })

})