
import { TConfiguration } from '../../../src/@types/Configuration'
import { TConverstionState } from '../../../src/@types/configuration/RecognitionConfiguration'
import { IModel } from '../../../src/@types/model/Model'
import { TWebSocketSVGPatchEvent } from '../../../src/@types/recognizer/WSRecognizer'
import { TPoint } from '../../../src/@types/renderer/Point'
import { WSBehaviors } from '../../../src/behaviors/WSBehaviors'
import { DefaultConfiguration } from '../../../src/configuration/DefaultConfiguration'
import { WSMessage } from '../../../src/Constants'
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

  describe('init', () =>
  {
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
    test('should resolve init when recognizer emit connection active', async () =>
    {
      const wrapperHTML: HTMLElement = document.createElement('div')
      const model: IModel = new Model(width, height)
      const wsb = new WSBehaviors(DefaultConfiguration, model)

      wsb.grabber.attach = jest.fn()
      wsb.renderer.init = jest.fn()
      wsb.recognizer.init = jest.fn()
      const initPromise = wsb.init(wrapperHTML)
      wsb.recognizer.wsEvent.emitConnectionActive()
      await expect(initPromise).resolves.toBeUndefined()
    })
    test('should resolve init when recognizer emit disconnected with closeEvent.code === 1000', async () =>
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
    test('should reject initialise promise when recognizer emit disconnected with closeEvent.code =! 1000', async () =>
    {
      const wrapperHTML: HTMLElement = document.createElement('div')
      const model: IModel = new Model(width, height)
      const wsb = new WSBehaviors(DefaultConfiguration, model)
      wsb.grabber.attach = jest.fn()
      wsb.renderer.init = jest.fn()
      wsb.recognizer.init = jest.fn()
      const initPromise = wsb.init(wrapperHTML)
      const closeEvent = new CloseEvent('close', { code: 1001, reason: 'tatapouet' })
      wsb.recognizer.wsEvent.emitDisconnected(closeEvent)
      await expect(initPromise).rejects.toEqual(new Error(closeEvent.reason))
    })
  })

  describe('drawCurrentStroke', () =>
  {
    test('should call renderer.drawPendingStroke', async () =>
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
    test('should not call renderer.drawPendingStroke', async () =>
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
      wsb.renderer.drawPendingStroke = jest.fn()
      wsb.drawCurrentStroke(model)
      expect(wsb.renderer.drawPendingStroke).toBeCalledTimes(0)
    })
  })

  describe('updateModelRendering', () =>
  {
    test('should call recognizer.addStrokes', async () =>
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
    test('should resolve when recognizer emit EXPORTED', async () =>
    {
      const wrapperHTML: HTMLElement = document.createElement('div')
      const model: IModel = new Model(width, height)
      const wsb = new WSBehaviors(DefaultConfiguration, model)
      wsb.grabber.attach = jest.fn()
      wsb.renderer.init = jest.fn()
      wsb.renderer.clearPendingStroke = jest.fn()
      wsb.recognizer.init = jest.fn()
      wsb.recognizer.addStrokes = jest.fn(m => Promise.resolve(m))

      const initPromise = wsb.init(wrapperHTML)
      wsb.recognizer.wsEvent.emitConnectionActive()

      const addStrokePromise = wsb.updateModelRendering(model)
      await initPromise
      const exportMessage = {
        type: 'exported',
        partId: 'test',
        exports: { 'text/plain': 'tatapouet' }
      }

      wsb.recognizer.wsEvent.emitExported(exportMessage)
      await expect(addStrokePromise).resolves.toBe(model)
      expect(model.exports).toEqual(exportMessage.exports)
    })
    test('should not call recognizer.addStrokes when exportContent = "DEMAND"', async () =>
    {
      const wrapperHTML: HTMLElement = document.createElement('div')
      const model: IModel = new Model(width, height)
      const conf: TConfiguration = JSON.parse(JSON.stringify(DefaultConfiguration))
      conf.triggers.exportContent = 'DEMAND'
      const wsb = new WSBehaviors(conf, model)
      wsb.grabber.attach = jest.fn()
      wsb.renderer.init = jest.fn()
      wsb.recognizer.init = jest.fn()
      wsb.recognizer.addStrokes = jest.fn()
      const initPromise = wsb.init(wrapperHTML)
      wsb.recognizer.wsEvent.emitConnectionActive()
      wsb.updateModelRendering(model)
      await initPromise
      expect(wsb.recognizer.addStrokes).toBeCalledTimes(0)
    })
    test('should emit EXPORTED when resolve', async () =>
    {
      const wrapperHTML: HTMLElement = document.createElement('div')
      const model: IModel = new Model(width, height)
      const wsb = new WSBehaviors(DefaultConfiguration, model)
      wsb.grabber.attach = jest.fn()
      wsb.renderer.init = jest.fn()
      wsb.renderer.clearPendingStroke = jest.fn()
      wsb.recognizer.init = jest.fn()
      wsb.recognizer.addStrokes = jest.fn(m => Promise.resolve(m))
      wsb.globalEvent.emitExported = jest.fn()

      const initPromise = wsb.init(wrapperHTML)
      wsb.recognizer.wsEvent.emitConnectionActive()

      const addStrokePromise = wsb.updateModelRendering(model)
      await initPromise
      const exportMessage = {
        type: 'exported',
        partId: 'test',
        exports: { 'text/plain': 'tatapouet' }
      }

      wsb.recognizer.wsEvent.emitExported(exportMessage)
      await addStrokePromise
      //TODO check that event is raise once
      //refactor globalEvent to don't have singleton
      await delay(DefaultConfiguration.triggers.exportContentDelay)
      expect(wsb.globalEvent.emitExported).toBeCalledWith(exportMessage.exports)
    })
    test('should reject when recognizer emit DISCONNECTED', async () =>
    {
      const wrapperHTML: HTMLElement = document.createElement('div')
      const model: IModel = new Model(width, height)
      const wsb = new WSBehaviors(DefaultConfiguration, model)
      wsb.grabber.attach = jest.fn()
      wsb.renderer.init = jest.fn()
      wsb.renderer.clearPendingStroke = jest.fn()
      wsb.recognizer.init = jest.fn()
      wsb.recognizer.addStrokes = jest.fn(m => Promise.resolve(m))
      wsb.globalEvent.emitExported = jest.fn(exp => exp)

      const initPromise = wsb.init(wrapperHTML)
      wsb.recognizer.wsEvent.emitConnectionActive()

      const addStrokePromise = wsb.updateModelRendering(model)
      await initPromise
      const closeEvent = new CloseEvent('close', { code: 1001, reason: 'tatapouet' })
      wsb.recognizer.wsEvent.emitDisconnected(closeEvent)
      await expect(addStrokePromise).rejects.toEqual(new Error(closeEvent.reason))
    })
  })

  describe('export', () =>
  {
    test('should call recognizer.export', async () =>
    {
      const wrapperHTML: HTMLElement = document.createElement('div')
      const model: IModel = new Model(width, height)
      const wsb = new WSBehaviors(DefaultConfiguration, model)
      wsb.grabber.attach = jest.fn()
      wsb.renderer.init = jest.fn()
      wsb.recognizer.init = jest.fn()
      wsb.recognizer.addStrokes = jest.fn()
      wsb.recognizer.export = jest.fn(m => Promise.resolve(m))
      const initPromise = wsb.init(wrapperHTML)
      wsb.recognizer.wsEvent.emitConnectionActive()

      wsb.export(model)
      await initPromise

      expect(wsb.recognizer.addStrokes).toBeCalledTimes(0)
      expect(wsb.recognizer.export).toBeCalledTimes(1)
      expect(wsb.recognizer.export).toBeCalledWith(model, undefined)
    })
    test('should call recognizer.addStrokes when exportContent = "DEMAND"', async () =>
    {
      const wrapperHTML: HTMLElement = document.createElement('div')
      const model: IModel = new Model(width, height)
      const conf: TConfiguration = JSON.parse(JSON.stringify(DefaultConfiguration))
      conf.triggers.exportContent = 'DEMAND'
      const wsb = new WSBehaviors(conf, model)
      wsb.grabber.attach = jest.fn()
      wsb.renderer.init = jest.fn()
      wsb.recognizer.init = jest.fn()
      wsb.recognizer.addStrokes = jest.fn()
      wsb.recognizer.export = jest.fn(m => Promise.resolve(m))
      const initPromise = wsb.init(wrapperHTML)
      wsb.recognizer.wsEvent.emitConnectionActive()

      wsb.export(model)
      await initPromise

      expect(wsb.recognizer.addStrokes).toBeCalledTimes(1)
      expect(wsb.recognizer.export).toBeCalledTimes(0)
    })
    test('should resolve when recognizer emit EXPORTED', async () =>
    {
      const wrapperHTML: HTMLElement = document.createElement('div')
      const model: IModel = new Model(width, height)
      const wsb = new WSBehaviors(DefaultConfiguration, model)
      wsb.grabber.attach = jest.fn()
      wsb.renderer.init = jest.fn()
      wsb.recognizer.init = jest.fn()
      wsb.recognizer.export = jest.fn(m => Promise.resolve(m))
      const initPromise = wsb.init(wrapperHTML)
      wsb.recognizer.wsEvent.emitConnectionActive()


      const exportPromise = wsb.export(model)
      await initPromise
      wsb.recognizer.wsEvent.emitExported({ type: 'exported', partId: 'xxx', exports: { 'test/plain': 'cofveve' } })

      await expect(exportPromise).resolves.toBe(model)
    })
    test('should reject when recognizer emit DISCONNECTED', async () =>
    {
      const wrapperHTML: HTMLElement = document.createElement('div')
      const model: IModel = new Model(width, height)
      const wsb = new WSBehaviors(DefaultConfiguration, model)
      wsb.grabber.attach = jest.fn()
      wsb.renderer.init = jest.fn()
      wsb.recognizer.init = jest.fn()
      wsb.recognizer.export = jest.fn(m => Promise.resolve(m))
      const initPromise = wsb.init(wrapperHTML)
      wsb.recognizer.wsEvent.emitConnectionActive()

      const exportPromise = wsb.export(model)
      await initPromise
      const closeEvent = new CloseEvent('close', { code: 1001, reason: 'tatapouet' })
      wsb.recognizer.wsEvent.emitDisconnected(closeEvent)
      await expect(exportPromise).rejects.toEqual(new Error(closeEvent.reason))
    })
  })

  describe('convert', () =>
  {
    test('should call recognizer.convert', async () =>
    {
      const wrapperHTML: HTMLElement = document.createElement('div')
      const model: IModel = new Model(width, height)
      const wsb = new WSBehaviors(DefaultConfiguration, model)
      wsb.grabber.attach = jest.fn()
      wsb.renderer.init = jest.fn()
      wsb.recognizer.init = jest.fn()
      wsb.recognizer.convert = jest.fn()
      const initPromise = wsb.init(wrapperHTML)
      wsb.recognizer.wsEvent.emitConnectionActive()

      const conversionState: TConverstionState = 'DIGITAL_EDIT'
      wsb.convert(model, conversionState)
      await initPromise

      expect(wsb.recognizer.convert).toBeCalledTimes(1)
      expect(wsb.recognizer.convert).toBeCalledWith(conversionState)
    })
    test('should resolve when recognizer emit EXPORTED', async () =>
    {
      const wrapperHTML: HTMLElement = document.createElement('div')
      const model: IModel = new Model(width, height)
      const wsb = new WSBehaviors(DefaultConfiguration, model)
      wsb.grabber.attach = jest.fn()
      wsb.renderer.init = jest.fn()
      wsb.recognizer.init = jest.fn()
      wsb.recognizer.convert = jest.fn()
      const initPromise = wsb.init(wrapperHTML)
      wsb.recognizer.wsEvent.emitConnectionActive()

      const conversionState: TConverstionState = 'DIGITAL_EDIT'
      const convertPromise = wsb.convert(model, conversionState)
      await initPromise
      wsb.recognizer.wsEvent.emitExported({ type: 'exported', partId: 'xxx', exports: { 'test/plain': 'cofveve' } })

      await expect(convertPromise).resolves.toBe(model)
    })
    test('should reject when recognizer emit DISCONNECTED', async () =>
    {
      const wrapperHTML: HTMLElement = document.createElement('div')
      const model: IModel = new Model(width, height)
      const wsb = new WSBehaviors(DefaultConfiguration, model)
      wsb.grabber.attach = jest.fn()
      wsb.renderer.init = jest.fn()
      wsb.recognizer.init = jest.fn()
      wsb.recognizer.convert = jest.fn()
      const initPromise = wsb.init(wrapperHTML)
      wsb.recognizer.wsEvent.emitConnectionActive()

      const conversionState: TConverstionState = 'DIGITAL_EDIT'
      const convertPromise = wsb.convert(model, conversionState)
      await initPromise
      const closeEvent = new CloseEvent('close', { code: 1001, reason: 'tatapouet' })
      wsb.recognizer.wsEvent.emitDisconnected(closeEvent)
      await expect(convertPromise).rejects.toEqual(new Error(closeEvent.reason))
    })
  })

  describe('import', () =>
  {
    test('should call recognizer.import', async () =>
    {
      const wrapperHTML: HTMLElement = document.createElement('div')
      const model: IModel = new Model(width, height)
      const wsb = new WSBehaviors(DefaultConfiguration, model)
      wsb.grabber.attach = jest.fn()
      wsb.renderer.init = jest.fn()
      wsb.recognizer.init = jest.fn()
      wsb.recognizer.import = jest.fn()
      const initPromise = wsb.init(wrapperHTML)
      wsb.recognizer.wsEvent.emitConnectionActive()

      const mimeType = 'text/plain'
      const textImport = 'winter is comming'
      const blob = new Blob([textImport], { type: mimeType })
      wsb.import(model, blob, mimeType)
      await initPromise

      expect(wsb.recognizer.import).toBeCalledTimes(1)
      expect(wsb.recognizer.import).toBeCalledWith(blob, mimeType)
    })
    test('should resolve when recognizer emit EXPORTED', async () =>
    {
      const wrapperHTML: HTMLElement = document.createElement('div')
      const model: IModel = new Model(width, height)
      const wsb = new WSBehaviors(DefaultConfiguration, model)
      wsb.grabber.attach = jest.fn()
      wsb.renderer.init = jest.fn()
      wsb.recognizer.init = jest.fn()
      wsb.recognizer.import = jest.fn()
      const initPromise = wsb.init(wrapperHTML)
      wsb.recognizer.wsEvent.emitConnectionActive()

      const mimeType = 'text/plain'
      const textImport = 'winter is comming'
      const blob = new Blob([textImport], { type: mimeType })
      const importPromise = wsb.import(model, blob, mimeType)
      await initPromise

      wsb.recognizer.wsEvent.emitExported({ type: 'exported', partId: 'xxx', exports: { 'test/plain': 'cofveve' } })

      await expect(importPromise).resolves.toBe(model)
    })
    test('should reject when recognizer emit DISCONNECTED', async () =>
    {
      const wrapperHTML: HTMLElement = document.createElement('div')
      const model: IModel = new Model(width, height)
      const wsb = new WSBehaviors(DefaultConfiguration, model)
      wsb.grabber.attach = jest.fn()
      wsb.renderer.init = jest.fn()
      wsb.recognizer.init = jest.fn()
      wsb.recognizer.import = jest.fn()

      const initPromise = wsb.init(wrapperHTML)
      wsb.recognizer.wsEvent.emitConnectionActive()

      const mimeType = 'text/plain'
      const textImport = 'winter is comming'
      const blob = new Blob([textImport], { type: mimeType })
      const importPromise = wsb.import(model, blob, mimeType)
      await initPromise
      const closeEvent = new CloseEvent('close', { code: 1001, reason: 'tatapouet' })
      wsb.recognizer.wsEvent.emitDisconnected(closeEvent)
      await expect(importPromise).rejects.toEqual(new Error(closeEvent.reason))
    })
  })

  describe('resize', () =>
  {
    test('should call renderer.resize', async () =>
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
    test('should call recognizer.resize after resizeTriggerDelay', async () =>
    {
      const wrapperHTML: HTMLElement = document.createElement('div')
      const model: IModel = new Model(width, height)
      const wsb = new WSBehaviors(DefaultConfiguration, model)

      wsb.grabber.attach = jest.fn()
      wsb.renderer.init = jest.fn()
      wsb.recognizer.init = jest.fn()
      wsb.renderer.resize = jest.fn()
      wsb.recognizer.resize = jest.fn(m => Promise.resolve(m))

      const initPromise = wsb.init(wrapperHTML)
      wsb.recognizer.wsEvent.emitConnectionActive()

      wsb.resize(model)
      await initPromise
      expect(wsb.recognizer.resize).toBeCalledTimes(0)

      await delay(DefaultConfiguration.triggers.resizeTriggerDelay)
      expect(wsb.recognizer.resize).toBeCalledTimes(1)
      expect(wsb.recognizer.resize).toBeCalledWith(model)
    })
    test('should resolve when recognizer emit CONTENT_CHANGE', async () =>
    {
      const wrapperHTML: HTMLElement = document.createElement('div')
      const model: IModel = new Model(width, height)
      const wsb = new WSBehaviors(DefaultConfiguration, model)

      wsb.grabber.attach = jest.fn()
      wsb.renderer.init = jest.fn()
      wsb.recognizer.init = jest.fn()
      wsb.renderer.resize = jest.fn()
      wsb.recognizer.resize = jest.fn(m => Promise.resolve(m))

      const initPromise = wsb.init(wrapperHTML)
      wsb.recognizer.wsEvent.emitConnectionActive()
      await initPromise

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

      await expect(resizePromise).resolves.toBe(model)
    })
    test('should reject when recognizer emit DISCONNECTED', async () =>
    {
      const wrapperHTML: HTMLElement = document.createElement('div')
      const model: IModel = new Model(width, height)
      const wsb = new WSBehaviors(DefaultConfiguration, model)
      wsb.grabber.attach = jest.fn()
      wsb.renderer.init = jest.fn()
      wsb.recognizer.init = jest.fn()
      wsb.renderer.resize = jest.fn()
      wsb.recognizer.resize = jest.fn(m => Promise.resolve(m))

      const initPromise = wsb.init(wrapperHTML)
      wsb.recognizer.wsEvent.emitConnectionActive()

      const resizePromise = wsb.resize(model)
      await initPromise
      const closeEvent = new CloseEvent('close', { code: 1001, reason: 'tatapouet' })
      wsb.recognizer.wsEvent.emitDisconnected(closeEvent)
      await expect(resizePromise).rejects.toEqual(new Error(closeEvent.reason))
    })
  })

  describe('undo', () =>
  {
    test('should call recognizer.undo', async () =>
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
    test('should resolve when recognizer emit CONTENT_CHANGE', async () =>
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
    test('should reject when recognizer emit DISCONNECTED', async () =>
    {
      const wrapperHTML: HTMLElement = document.createElement('div')
      const model: IModel = new Model(width, height)
      const wsb = new WSBehaviors(DefaultConfiguration, model)
      wsb.grabber.attach = jest.fn()
      wsb.renderer.init = jest.fn()
      wsb.recognizer.init = jest.fn()
      wsb.recognizer.undo = jest.fn()

      const initPromise = wsb.init(wrapperHTML)
      wsb.recognizer.wsEvent.emitConnectionActive()

      const undoPromise = wsb.undo()
      await initPromise
      const closeEvent = new CloseEvent('close', { code: 1001, reason: 'tatapouet' })
      wsb.recognizer.wsEvent.emitDisconnected(closeEvent)
      await expect(undoPromise).rejects.toEqual(new Error(closeEvent.reason))
    })
  })

  describe('redo', () =>
  {
    test('should call recognizer.redo', async () =>
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
    test('should resolve when recognizer emit CONTENT_CHANGE', async () =>
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
    test('should reject when recognizer emit DISCONNECTED', async () =>
    {
      const wrapperHTML: HTMLElement = document.createElement('div')
      const model: IModel = new Model(width, height)
      const wsb = new WSBehaviors(DefaultConfiguration, model)
      wsb.grabber.attach = jest.fn()
      wsb.renderer.init = jest.fn()
      wsb.recognizer.init = jest.fn()
      wsb.recognizer.redo = jest.fn()

      const initPromise = wsb.init(wrapperHTML)
      wsb.recognizer.wsEvent.emitConnectionActive()

      const redoPromise = wsb.redo()
      await initPromise
      const closeEvent = new CloseEvent('close', { code: 1001, reason: 'tatapouet' })
      wsb.recognizer.wsEvent.emitDisconnected(closeEvent)
      await expect(redoPromise).rejects.toEqual(new Error(closeEvent.reason))
    })
  })

  describe('clear', () =>
  {
    test('should call recognizer.clear', async () =>
    {
      const wrapperHTML: HTMLElement = document.createElement('div')
      const model: IModel = new Model(width, height)
      const wsb = new WSBehaviors(DefaultConfiguration, model)
      wsb.grabber.attach = jest.fn()
      wsb.renderer.init = jest.fn()
      wsb.recognizer.init = jest.fn()
      const initPromise = wsb.init(wrapperHTML)
      wsb.recognizer.wsEvent.emitConnectionActive()
      wsb.recognizer.clear = jest.fn()
      wsb.clear(model)
      await initPromise

      expect(wsb.recognizer.clear).toBeCalledTimes(1)
    })
    test('should resolve when recognizer emit CONTENT_CHANGE', async () =>
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
    test('should reject when recognizer emit DISCONNECTED', async () =>
    {
      const wrapperHTML: HTMLElement = document.createElement('div')
      const model: IModel = new Model(width, height)
      const wsb = new WSBehaviors(DefaultConfiguration, model)
      wsb.grabber.attach = jest.fn()
      wsb.renderer.init = jest.fn()
      wsb.recognizer.init = jest.fn()
      wsb.recognizer.clear = jest.fn()

      const initPromise = wsb.init(wrapperHTML)
      wsb.recognizer.wsEvent.emitConnectionActive()

      const clearPromise = wsb.clear(model)
      await initPromise
      const closeEvent = new CloseEvent('close', { code: 1001, reason: 'tatapouet' })
      wsb.recognizer.wsEvent.emitDisconnected(closeEvent)
      await expect(clearPromise).rejects.toEqual(new Error(closeEvent.reason))
    })
  })

  describe('destroy', () =>
  {
    test('should call grabber.detach', async () =>
    {
      const model: IModel = new Model(width, height)
      const wsb = new WSBehaviors(DefaultConfiguration, model)

      wsb.grabber.detach = jest.fn()
      wsb.renderer.destroy = jest.fn()
      wsb.recognizer.close = jest.fn()

      wsb.destroy()
      expect(wsb.grabber.detach).toBeCalledTimes(1)
    })
    test('should call renderer.destroy', async () =>
    {
      const model: IModel = new Model(width, height)
      const wsb = new WSBehaviors(DefaultConfiguration, model)

      wsb.grabber.detach = jest.fn()
      wsb.renderer.destroy = jest.fn()
      wsb.recognizer.close = jest.fn()

      wsb.destroy()
      expect(wsb.renderer.destroy).toBeCalledTimes(1)
    })
    test('should call recognizer.destroy', async () =>
    {
      const model: IModel = new Model(width, height)
      const wsb = new WSBehaviors(DefaultConfiguration, model)

      wsb.grabber.detach = jest.fn()
      wsb.renderer.destroy = jest.fn()
      wsb.recognizer.close = jest.fn()

      wsb.destroy()
      expect(wsb.recognizer.close).toBeCalledTimes(1)
      expect(wsb.recognizer.close).toBeCalledWith(1000, WSMessage.CLOSE_RECOGNIZER)
    })
  })

  describe('Event', () =>
  {
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
    test('should reject init promise when recognizer emit ERROR', async () =>
    {
      const wrapperHTML: HTMLElement = document.createElement('div')
      const model: IModel = new Model(width, height)
      const wsb = new WSBehaviors(DefaultConfiguration, model)

      wsb.grabber.attach = jest.fn()
      wsb.renderer.init = jest.fn()
      wsb.recognizer.init = jest.fn()
      wsb.globalEvent.emitError = jest.fn()

      const initPromise = wsb.init(wrapperHTML)

      const error = new Error('yeah')
      wsb.recognizer.wsEvent.emitError(error)

      expect(initPromise).rejects.toEqual(error)
    })
    test('should emit error when recognizer emit ERROR', async () =>
    {
      const wrapperHTML: HTMLElement = document.createElement('div')
      const model: IModel = new Model(width, height)
      const wsb = new WSBehaviors(DefaultConfiguration, model)

      wsb.grabber.attach = jest.fn()
      wsb.renderer.init = jest.fn()
      wsb.recognizer.init = jest.fn()
      wsb.globalEvent.emitError = jest.fn()

      const initPromise = wsb.init(wrapperHTML)

      const error = new Error('yeah')
      wsb.recognizer.wsEvent.emitError(error)
      try {
        await initPromise
        expect(true).toEqual('Should emit global event ERROR')
      } catch (error) {
        expect(wsb.globalEvent.emitError).toBeCalledTimes(1)
        expect(wsb.globalEvent.emitError).toBeCalledWith(error)
      }
    })
  })

})
