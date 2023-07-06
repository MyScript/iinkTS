
import { TConfiguration } from '../../../src/@types/Configuration'
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

  describe('updateModelRendering', () => {
    test('should call renderer.drawModel', async () =>
    {
      const wrapperHTML: HTMLElement = document.createElement('div')
      const model: IModel = new Model(width, height)
      const rb = new RestBehaviors(DefaultConfiguration, model)
      await rb.init(wrapperHTML)
      rb.renderer.drawModel = jest.fn()
      rb.recognizer.export = jest.fn(m => Promise.resolve(m))
      rb.updateModelRendering(model)
      expect(rb.renderer.drawModel).toBeCalledTimes(1)
      expect(rb.renderer.drawModel).toBeCalledWith(model)
    })

    test('should call recognizer.export', async () =>
    {
      const wrapperHTML: HTMLElement = document.createElement('div')
      const model: IModel = new Model(width, height)
      const rb = new RestBehaviors(DefaultConfiguration, model)
      await rb.init(wrapperHTML)
      rb.renderer.drawModel = jest.fn()
      rb.recognizer.export = jest.fn(m => Promise.resolve(m))
      await rb.updateModelRendering(model)
      await delay(DefaultConfiguration.triggers.exportContentDelay)
      expect(rb.recognizer.export).toBeCalledTimes(1)
      expect(rb.recognizer.export).toBeCalledWith(model, undefined)
    })

    test('should emit EXPORTED', async () =>
    {
      const wrapperHTML: HTMLElement = document.createElement('div')
      const model: IModel = new Model(width, height)
      const rb = new RestBehaviors(DefaultConfiguration, model)
      await rb.init(wrapperHTML)
      rb.renderer.drawModel = jest.fn()
      rb.recognizer.export = jest.fn(m => Promise.resolve(m))
      rb.globalEvent.emitExported = jest.fn(e => e)
      await rb.updateModelRendering(model)
      await delay(DefaultConfiguration.triggers.exportContentDelay)
      expect(rb.globalEvent.emitExported).toBeCalledWith(model.exports)
    })

    test('should reject if recognizer.export in error', async () =>
    {
      const wrapperHTML: HTMLElement = document.createElement('div')
      const model: IModel = new Model(width, height)
      const conf: TConfiguration = JSON.parse(JSON.stringify(DefaultConfiguration))
      const rb = new RestBehaviors(conf, model)
      await rb.init(wrapperHTML)
      rb.renderer.drawModel = jest.fn()
      rb.recognizer.export = jest.fn(() => Promise.reject('pouet'))
      const updatePromise = rb.updateModelRendering(model)
      expect(updatePromise).rejects.toEqual('pouet')
    })

    test('should not call recognizer.export when exportContent = "DEMAND"', async () =>
    {
      const wrapperHTML: HTMLElement = document.createElement('div')
      const model: IModel = new Model(width, height)
      const conf: TConfiguration = JSON.parse(JSON.stringify(DefaultConfiguration))
      conf.triggers.exportContent = 'DEMAND'
      const rb = new RestBehaviors(conf, model)
      await rb.init(wrapperHTML)
      rb.renderer.drawModel = jest.fn()
      rb.recognizer.export = jest.fn(m => Promise.resolve(m))
      await rb.updateModelRendering(model)
      await delay(DefaultConfiguration.triggers.exportContentDelay)
      expect(rb.recognizer.export).toBeCalledTimes(0)
    })
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
    expect(rb.globalEvent.emitExported).toBeCalledWith(model.exports)
  })

  test('should convert', async () =>
  {
    const wrapperHTML: HTMLElement = document.createElement('div')
    const model: IModel = new Model(width, height)
    model.converts = { "text/plain": 'pouet' }
    const rb = new RestBehaviors(DefaultConfiguration, model)
    await rb.init(wrapperHTML)

    rb.recognizer.convert = jest.fn(m => Promise.resolve(m))
    rb.globalEvent.emitConverted = jest.fn(m => Promise.resolve(m))

    rb.convert(model, "DIGITAL_EDIT", ["mime-type"])
    await delay(DefaultConfiguration.triggers.exportContentDelay)

    expect(rb.recognizer.convert).toBeCalledTimes(1)
    expect(rb.recognizer.convert).toBeCalledWith(model, "DIGITAL_EDIT", ["mime-type"])
    expect(rb.globalEvent.emitConverted).toBeCalledWith(model.converts)
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
    rb.undoRedoManager.undo = jest.fn(() => model1)

    const model2: IModel = new Model(width, height)
    const p1: TPoint = { t: 1, p: 1, x: 1, y: 1 }
    const p2: TPoint = { t: 10, p: 1, x: 100, y: 1 }
    model2.initCurrentStroke(p1, 1, 'pen', DefaultPenStyle)
    model2.endCurrentStroke(p2, DefaultPenStyle)

    await rb.updateModelRendering(model2)
    await delay(DefaultConfiguration.triggers.exportContentDelay)

    const undoModel = await rb.undo(model2)
    expect(undoModel).toEqual(model1)
  })

  test('should redo', async () =>
  {
    const wrapperHTML: HTMLElement = document.createElement('div')
    const model1: IModel = new Model(width, height)
    const rb = new RestBehaviors(DefaultConfiguration, model1)
    await rb.init(wrapperHTML)

    rb.recognizer.export = jest.fn(m => Promise.resolve(m))
    rb.renderer.drawModel = jest.fn()
    rb.undoRedoManager.undo = jest.fn(() => model1)
    rb.undoRedoManager.redo = jest.fn(() => model2)

    const model2: IModel = new Model(width, height)
    const p1: TPoint = { t: 1, p: 1, x: 1, y: 1 }
    const p2: TPoint = { t: 10, p: 1, x: 100, y: 1 }
    model2.initCurrentStroke(p1, 1, 'pen', DefaultPenStyle)
    model2.endCurrentStroke(p2, DefaultPenStyle)

    const exportModel = await rb.updateModelRendering(model2)
    await delay(DefaultConfiguration.triggers.exportContentDelay)

    const undoModel = await rb.undo(model2)
    expect(undoModel).toEqual(model1)

    const redoModel = await rb.redo(undoModel)
    expect(redoModel.creationTime).toEqual(model2.creationTime)
    expect(redoModel.modificationDate).toEqual(exportModel.modificationDate)
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

    expect(rb.globalEvent.emitExported).toBeCalledTimes(2)
    expect(rb.globalEvent.emitExported).toBeCalledWith(clearedModel.exports)

  })

  test('should destroy', async () =>
  {
    const wrapperHTML: HTMLElement = document.createElement('div')
    const model: IModel = new Model(width, height)
    model.converts = { "text/plain": 'pouet' }
    const rb = new RestBehaviors(DefaultConfiguration, model)
    await rb.init(wrapperHTML)

    rb.grabber.detach = jest.fn()
    rb.renderer.destroy = jest.fn()
    rb.undoRedoManager.reset = jest.fn(m => m)

    rb.destroy(model)
    await delay(DefaultConfiguration.triggers.exportContentDelay)

    expect(rb.grabber.detach).toBeCalledTimes(1)
    expect(rb.renderer.destroy).toBeCalledTimes(1)
    expect(rb.undoRedoManager.reset).toBeCalledTimes(1)
    expect(rb.globalEvent.emitCleared).toBeCalledWith(model)
    expect(rb.globalEvent.emitExported).toBeCalledWith(model.exports)
  })

})
