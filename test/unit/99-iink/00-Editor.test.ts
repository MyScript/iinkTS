import { Editor } from "../../../src/Editor"
import { DefaultConfiguration } from "../../../src/configuration/DefaultConfiguration"
import { AllOverrideConfiguration } from "../_dataset/configuration.dataset"
// import { TPoint } from "../../../src/@types/renderer/Point"
// import { LeftClickEventFake } from "../utils/PointerEventFake"
import { DefaultPenStyle } from "../../../src/style/DefaultPenStyle"
import { DefaultTheme } from "../../../src/style/DefaultTheme"
import { Model } from "../../../src/model/Model"
import { TExport } from "../../../src/@types/model/Model"
import { TStroke } from "../../../src/@types/model/Stroke"


describe('Editor.ts', () =>
{

  test('should create Editor with default configuration', () =>
  {
    const wrapperHTML: HTMLElement = document.createElement('div')
    wrapperHTML.style.height = '100px'
    wrapperHTML.style.width = '100px'
    const editor = new Editor(wrapperHTML)

    expect(editor.configuration.events).toStrictEqual(DefaultConfiguration.events)
    expect(editor.configuration.grabber).toStrictEqual(DefaultConfiguration.grabber)
    expect(editor.configuration.recognition).toStrictEqual(DefaultConfiguration.recognition)
    expect(editor.configuration.rendering).toStrictEqual(DefaultConfiguration.rendering)
    expect(editor.configuration.server).toStrictEqual(DefaultConfiguration.server)
    expect(editor.configuration.triggers).toStrictEqual(DefaultConfiguration.triggers)
  })

  test('should override default configuration', () =>
  {
    const wrapperHTML: HTMLElement = document.createElement('div')
    wrapperHTML.style.height = '100px'
    wrapperHTML.style.width = '100px'
    const editor = new Editor(wrapperHTML)

    expect(editor.configuration.events).toStrictEqual(DefaultConfiguration.events)
    expect(editor.configuration.grabber).toStrictEqual(DefaultConfiguration.grabber)
    expect(editor.configuration.recognition).toStrictEqual(DefaultConfiguration.recognition)
    expect(editor.configuration.rendering).toStrictEqual(DefaultConfiguration.rendering)
    expect(editor.configuration.server).toStrictEqual(DefaultConfiguration.server)
    expect(editor.configuration.triggers).toStrictEqual(DefaultConfiguration.triggers)

    editor.configuration = AllOverrideConfiguration

    expect(editor.configuration.events).toStrictEqual(AllOverrideConfiguration.events)
    expect(editor.configuration.grabber).toStrictEqual(AllOverrideConfiguration.grabber)
    expect(editor.configuration.recognition).toStrictEqual(AllOverrideConfiguration.recognition)
    expect(editor.configuration.rendering).toStrictEqual(AllOverrideConfiguration.rendering)
    expect(editor.configuration.server).toStrictEqual(AllOverrideConfiguration.server)
    expect(editor.configuration.triggers).toStrictEqual(AllOverrideConfiguration.triggers)
  })

  /* test('should create Editor and not be initialized', async () =>
  {
    const wrapperHTML: HTMLElement = document.createElement('div')
    wrapperHTML.style.height = '100px'
    wrapperHTML.style.width = '100px'
    const editor = new Editor(wrapperHTML)
    expect(editor.initializationPromise).toBe(false)
  }) */

  test('should append loader element', () =>
  {
    const wrapperHTML: HTMLElement = document.createElement('div')
    wrapperHTML.style.height = '100px'
    wrapperHTML.style.width = '100px'
    new Editor(wrapperHTML)
    expect(wrapperHTML.querySelector('.loader')).toBeDefined()

  })

  test('should append error element', () =>
  {
    const wrapperHTML: HTMLElement = document.createElement('div')
    wrapperHTML.style.height = '100px'
    wrapperHTML.style.width = '100px'
    new Editor(wrapperHTML)
    expect(wrapperHTML.querySelector('.error-msg')).toBeDefined()

  })

  test('should init model', () =>
  {
    const wrapperHTML: HTMLElement = document.createElement('div')
    const editor = new Editor(wrapperHTML)
    expect(editor.model).toBeDefined()
  })

  test('should undo', async () =>
  {
    const wrapperHTML: HTMLElement = document.createElement('div')
    const editor = new Editor(wrapperHTML)
    editor.undo = jest.fn()
    editor.undo()
    expect(editor.undo).toBeCalledTimes(1)
  })

  test('should redo', () =>
  {
    const wrapperHTML: HTMLElement = document.createElement('div')
    const editor = new Editor(wrapperHTML)
    editor.redo = jest.fn()
    editor.redo()
    expect(editor.redo).toBeCalledTimes(1)
  })

  test('should clear', () =>
  {
    const wrapperHTML: HTMLElement = document.createElement('div')
    const editor = new Editor(wrapperHTML)
    editor.clear = jest.fn()
    editor.clear()
    expect(editor.clear).toBeCalledTimes(1)
  })

  test('should resize', () =>
  {
    const wrapperHTML: HTMLElement = document.createElement('div')
    const editor = new Editor(wrapperHTML)
    editor.resize = jest.fn()
    editor.resize()
    expect(editor.resize).toBeCalledTimes(1)
  })

  test('should export', () =>
  {
    const wrapperHTML: HTMLElement = document.createElement('div')
    const editor = new Editor(wrapperHTML)
    const model = new Model(100, 50)
    model.exports = {
      "text/plain": 'tatapouet'
    }
    editor.export = jest.fn(() => Promise.resolve(model))
    editor.events.emitExported = jest.fn()
    editor.export(['text/plain'])
    expect(editor.export).toBeCalledTimes(1)
  })

  test('should convert', () =>
  {
    const wrapperHTML: HTMLElement = document.createElement('div')
    const editor = new Editor(wrapperHTML)
    const model = new Model(100, 50)
    model.converts = {
      "text/plain": 'tatapouet'
    }
    editor.convert = jest.fn(() => Promise.resolve(model))

    editor.convert()
    expect(editor.convert).toBeCalledTimes(1)
  })

  test('should import Blob', () =>
  {
    const wrapperHTML: HTMLElement = document.createElement('div')
    const editor = new Editor(wrapperHTML)
    const model = new Model(100, 50)
    model.exports = {
      "text/plain": 'tatapouet'
    }
    editor.behaviors.recognizer.import = jest.fn(() => Promise.resolve(model.exports as TExport))
    editor.events.emitImported = jest.fn()

    editor.importBlob(new Blob(), 'text/plain')
    expect(editor.behaviors.recognizer.import).toBeCalledTimes(1)
  })

  test('should import Text', () =>
  {
    const wrapperHTML: HTMLElement = document.createElement('div')
    const editor = new Editor(wrapperHTML)
    const model = new Model(100, 50)
    model.exports = {
      "text/plain": 'tatapouet'
    }
    editor.behaviors.recognizer.import = jest.fn(() => Promise.resolve(model.exports as TExport))
    editor.events.emitImported = jest.fn()

    editor.importText("hello", 'text/plain')
    expect(editor.behaviors.recognizer.import).toBeCalledTimes(1)
  })

  test('should import points Events', () => {
    const wrapperHTML: HTMLElement = document.createElement('div')
    const editor = new Editor(wrapperHTML)
    const model = new Model(100, 50)
    const tstrokeToImport: TStroke[] = JSON.parse(`[{
      "pointerType": "PEN",
      "pointerId": 1,
      "x": [128, 125, 122, 119, 118, 117, 116, 117, 119, 123, 127, 135, 139, 141, 144, 144, 143, 142, 141, 142],
      "y": [83, 91, 99, 107, 114, 121, 125, 120, 112, 101, 90, 76, 70, 66, 76, 88, 101, 111, 118, 123],
      "t": [1516190046205, 1516190046247, 1516190046264, 1516190046280, 1516190046297, 1516190046314, 1516190046330, 1516190046380, 1516190046397, 1516190046413, 1516190046430, 1516190046447, 1516190046463, 1516190046480, 1516190046547, 1516190046563, 1516190046581, 1516190046597, 1516190046614, 1516190046630],
      "p": [0.5, 0.7076987214308235, 0.8060672826037246, 0.8060672826037246, 0.785875329883628, 0.785875329883628, 0.7185264889882718, 0.7461846839143089, 0.8024894359144054, 0.6578786777951477, 0.6578786777951477, 0.5984465727129564, 0.7880849230110567, 0.7292125754002905, 0.6768853685004259, 0.6535898384862245, 0.6389126863152722, 0.6829846120277299, 0.785875329883628, 0.7461846839143089]
    },{
      "pointerType": "PEN",
      "pointerId": 1,
      "x": [117, 122, 128, 139, 146],
      "y": [105, 105, 106, 107, 106],
      "t": [1516190046870, 1516190046930, 1516190046947, 1516190046963, 1516190046980],
      "p": [0.5, 0.7763932022500211, 0.7681880209236327, 0.6676543814462531, 0.785875329883628]
    }]`)
    editor.importPointEvents = jest.fn(() => Promise.resolve(model))
    editor.importPointEvents(tstrokeToImport)
    expect(editor.importPointEvents).toBeCalledTimes(1)
  })

  describe('Style', () => {
    const wrapperHTML: HTMLElement = document.createElement('div')
    const editor = new Editor(wrapperHTML)
    test('should init theme', () =>
    {
      expect(editor.theme).toStrictEqual(DefaultTheme)
    })
    test('should init penStyle', () =>
    {
      expect(editor.penStyle).toStrictEqual(DefaultPenStyle)
    })
  })

  // describe('setMode', () => {
  //   const wrapperHTML: HTMLElement = document.createElement('div')
  //   const editor = new Editor(wrapperHTML)
  //   test('should init mode = pen', () =>
  //   {
  //     expect(editor.mode).toBe(EditorMode.Pen)
  //   })
  //   test('should setMode = erase', () =>
  //   {
  //     editor.setMode(EditorMode.Eraser)
  //     expect(editor.mode).toBe(EditorMode.Eraser)
  //     expect(wrapperHTML.classList).toContain('erasing')
  //   })
  //   test('should setMode = erase', () =>
  //   {
  //     editor.setMode(EditorMode.Touche)
  //     expect(editor.mode).toBe(EditorMode.Touche)
  //     expect(wrapperHTML.classList).not.toContain('erasing')
  //   })
  // })

  // describe('pointer', () =>
  // {
  //   const wrapperHTML: HTMLElement = document.createElement('div')
  //   const editor = new Editor(wrapperHTML)
  //   editor.model.initCurrentStroke = jest.fn()
  //   editor.model.appendToCurrentStroke = jest.fn()
  //   editor.model.endCurrentStroke = jest.fn()
  //   editor.behaviors.drawCurrentStroke = jest.fn()
  //   editor.behaviors.updateModelRendering = jest.fn()

  //   const eventTarget = document.createElement('div')
  //   eventTarget.classList.add('ms-canvas')
  //   const pointerDownEvt = new LeftClickEventFake('pointerdown', {
  //     pointerType: "pen",
  //     clientX: 1,
  //     clientY: 1,
  //     pressure: 1
  //   })
  //   const point: TPoint = { p: 1, t: 1, x: 1, y: 1}

  //   test.skip('should pointerDown', () =>
  //   {
  //     // TODO find solution to define target on pointerDownEvt
  //     editor.pointerDown(pointerDownEvt as PointerEvent, point)
  //     expect(editor.model.initCurrentStroke).toHaveBeenCalledTimes(1)
  //     expect(editor.behaviors.drawCurrentStroke).toHaveBeenCalledTimes(1)
  //   })
  //   test('should pointerMove', () =>
  //   {
  //     editor.pointerMove(pointerDownEvt as PointerEvent, point)
  //     expect(editor.model.appendToCurrentStroke).toHaveBeenCalledTimes(1)
  //     expect(editor.behaviors.drawCurrentStroke).toHaveBeenCalledTimes(1)
  //   })
  //   test('should pointerUp', () =>
  //   {
  //     editor.pointerUp(pointerDownEvt as PointerEvent, point)
  //     expect(editor.model.endCurrentStroke).toHaveBeenCalledTimes(1)
  //     expect(editor.behaviors.updateModelRendering).toHaveBeenCalledTimes(1)
  //   })
  // })

})
