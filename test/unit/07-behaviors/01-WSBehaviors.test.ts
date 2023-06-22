
import { TConfiguration } from '../../../src/@types/Configuration'
import { IModel, TExport } from '../../../src/@types/model/Model'
import { TWebSocketSVGPatchEvent } from '../../../src/@types/recognizer/WSRecognizer'
import { TPoint } from '../../../src/@types/renderer/Point'
import { TPenStyle } from '../../../src/@types/style/PenStyle'
import { TTheme } from '../../../src/@types/style/Theme'
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

    test('should resolve init when recognizer init is resolve', async () =>
    {
      const wrapperHTML: HTMLElement = document.createElement('div')
      const model: IModel = new Model(width, height)
      const wsb = new WSBehaviors(DefaultConfiguration, model)

      wsb.grabber.attach = jest.fn()
      wsb.renderer.init = jest.fn()
      wsb.recognizer.init = jest.fn()
      const initPromise = await wsb.init(wrapperHTML)
      wsb.recognizer.init(width, height)
      expect(initPromise).toBeUndefined()
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
      await initPromise
      wsb.renderer.drawPendingStroke = jest.fn()
      wsb.drawCurrentStroke(model)
      expect(wsb.renderer.drawPendingStroke).toBeCalledTimes(1)
      expect(wsb.renderer.drawPendingStroke).toBeCalledWith(model.currentStroke)
    })

    test('should not call renderer.drawPendingStroke if currentStroke is null', async () =>
    {
      const wrapperHTML: HTMLElement = document.createElement('div')
      const model: IModel = new Model(width, height)
      const wsb = new WSBehaviors(DefaultConfiguration, model)
      wsb.grabber.attach = jest.fn()
      wsb.renderer.init = jest.fn()
      wsb.recognizer.init = jest.fn()
      const initPromise = wsb.init(wrapperHTML)
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
      wsb.renderer.clearPendingStroke = jest.fn()
      wsb.recognizer.init = jest.fn(() => Promise.resolve())
      wsb.recognizer.addStrokes = jest.fn(m => Promise.resolve(m))
      await wsb.init(wrapperHTML)
      await wsb.updateModelRendering(model)
      expect(wsb.recognizer.addStrokes).toBeCalledTimes(1)
      expect(wsb.recognizer.addStrokes).toBeCalledWith(model)
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
      wsb.recognizer.export = jest.fn(m => Promise.resolve(m))
      const initPromise = wsb.init(wrapperHTML)

      wsb.export(model)
      await initPromise

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
      wsb.recognizer.addStrokes = jest.fn(m => Promise.resolve(m))
      wsb.recognizer.export = jest.fn(m => Promise.resolve(m))
      const initPromise = wsb.init(wrapperHTML)

      wsb.export(model)
      await initPromise

      expect(wsb.recognizer.addStrokes).toBeCalledTimes(1)
      expect(wsb.recognizer.export).toBeCalledTimes(0)
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
      wsb.recognizer.export = jest.fn(m => Promise.resolve(m))
      const initPromise = wsb.init(wrapperHTML)


      wsb.export(model)
      await initPromise

      expect(wsb.recognizer.export).toBeCalledTimes(1)
      expect(wsb.recognizer.export).toBeCalledWith(model, undefined)
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

      const mimeType = 'text/plain'
      const textImport = 'winter is comming'
      const blob = new Blob([textImport], { type: mimeType })
      wsb.import(model, blob, mimeType)
      await initPromise

      expect(wsb.recognizer.import).toBeCalledTimes(1)
      expect(wsb.recognizer.import).toBeCalledWith(blob, mimeType)
    })

    test('should return model form recognizer when recognizer emit EXPORTED', async () =>
    {
      const exportExpected: TExport = { 'test/plain': 'cofveve' }

      const wrapperHTML: HTMLElement = document.createElement('div')
      const model: IModel = new Model(width, height)
      const wsb = new WSBehaviors(DefaultConfiguration, model)
      wsb.grabber.attach = jest.fn()
      wsb.renderer.init = jest.fn()
      wsb.recognizer.init = jest.fn()

      wsb.recognizer.import = jest.fn((_blob) => {
        return Promise.resolve(exportExpected)
      })
      await wsb.init(wrapperHTML)

      const mimeType = 'text/plain'
      const textImport = 'winter is comming'
      const _blob = new Blob([textImport], { type: mimeType })
      const modelReceive = await wsb.import(model, _blob, mimeType)

      await expect(modelReceive.exports).toBe(exportExpected)
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
      wsb.renderer.resize = jest.fn()
      wsb.recognizer.resize = jest.fn(m => Promise.resolve(m))

      await wsb.init(wrapperHTML)

      await wsb.resize(model)

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

      await wsb.init(wrapperHTML)
      await wsb.resize(model)

      await delay(DefaultConfiguration.triggers.resizeTriggerDelay)
      expect(wsb.recognizer.resize).toBeCalledTimes(1)
      expect(wsb.recognizer.resize).toBeCalledWith(model)
    })
  })

  describe('undo', () =>
  {
    test('should call recognizer.undo', async () =>
    {
      const wrapperHTML: HTMLElement = document.createElement('div')
      const model: IModel = new Model(width, height)
      const wsb = new WSBehaviors(DefaultConfiguration, model)

      wsb.grabber.attach = jest.fn()
      wsb.renderer.init = jest.fn()
      wsb.recognizer.init = jest.fn()
      wsb.recognizer.undo = jest.fn(m => Promise.resolve(m))

      await wsb.init(wrapperHTML)

      await wsb.undo(model)

      expect(wsb.recognizer.undo).toBeCalledTimes(1)
    })
  })

  describe('redo', () =>
  {
    test('should call recognizer.redo', async () =>
    {
      const wrapperHTML: HTMLElement = document.createElement('div')
      const model: IModel = new Model(width, height)
      const wsb = new WSBehaviors(DefaultConfiguration, model)

      wsb.grabber.attach = jest.fn()
      wsb.renderer.init = jest.fn()
      wsb.recognizer.init = jest.fn()
      wsb.recognizer.redo = jest.fn(m => Promise.resolve(m))

      await wsb.init(wrapperHTML)

      await wsb.redo(model)

      expect(wsb.recognizer.redo).toBeCalledTimes(1)
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
      wsb.recognizer.clear = jest.fn()
      expect(async () => {
        await wsb.clear(model)
      }).rejects.toThrowError()
      await initPromise

      expect(wsb.recognizer.clear).toBeCalledTimes(1)
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
  })

  describe('Style', () =>
  {
    test('should change PenStyle', () =>
    {
      const model: IModel = new Model(width, height)
      const wsb = new WSBehaviors(DefaultConfiguration, model)
      const CustomPenStyle: TPenStyle = {color: "#d1d1d1"}
      wsb.recognizer.init = jest.fn()
      wsb.recognizer.setPenStyle = jest.fn()
      wsb.setPenStyle(CustomPenStyle)
      expect(wsb.recognizer.setPenStyle).toBeCalledTimes(1)
    })

    test('should change PenStyleClasses', () => {
      const model: IModel = new Model(width, height)
      const wsb = new WSBehaviors(DefaultConfiguration, model)
      wsb.recognizer.init = jest.fn()
      wsb.recognizer.setPenStyleClasses = jest.fn()
      wsb.setPenStyleClasses("test")
      expect(wsb.recognizer.setPenStyleClasses).toBeCalledTimes(1)
    })

    test('should change theme', () => {
      const model: IModel = new Model(width, height)
      const wsb = new WSBehaviors(DefaultConfiguration, model)
      wsb.recognizer.init = jest.fn()
      wsb.recognizer.setTheme = jest.fn()
      const theme: TTheme = {
        ink: {
          width: 42,
          color: '#2E7D32',
          '-myscript-pen-width': 2,
          '-myscript-pen-fill-style': 'purple',
          '-myscript-pen-fill-color': '#FFFFFF00'
        },
        '.math': {
          'font-family': 'STIXGeneral'
        },
        '.math-solved': {
          'font-family': 'STIXGeneral',
          color: 'blue'
        },
        '.text': {
          'font-family': 'Rubik Distressed',
          'font-size': 10
        }
      }
      wsb.setTheme(theme)
      expect(wsb.recognizer.setTheme).toBeCalledTimes(1)
      expect(wsb.recognizer.setTheme).toBeCalledWith(theme)
    })
  })

})
