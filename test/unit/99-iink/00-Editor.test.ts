import { Editor, EditorMode } from "../../../src/Editor"
import { DefaultConfiguration } from "../../../src/configuration/DefaultConfiguration"
import { AllOverrideConfiguration } from "../_dataset/configuration.dataset"
import { TPoint } from "../../../src/@types/renderer/Point"
import { LeftClickEventFake } from "../utils/PointerEventFake"
import { DefaultPenStyle } from "../../../src/style/DefaultPenStyle"
import { DefaultTheme } from "../../../src/style/DefaultTheme"


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

  test('should resize', () =>
  {
    const wrapperHTML: HTMLElement = document.createElement('div')
    const editor = new Editor(wrapperHTML)
    editor.behaviors.resize = jest.fn()
    editor.resize()
    expect(editor.behaviors.resize).toBeCalledTimes(1)
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

  describe('setMode', () => {
    const wrapperHTML: HTMLElement = document.createElement('div')
    const editor = new Editor(wrapperHTML)
    test('should init mode = pen', () =>
    {
      expect(editor.mode).toBe(EditorMode.Pen)
    })
    test('should setMode = erase', () =>
    {
      editor.setMode(EditorMode.Eraser)
      expect(editor.mode).toBe(EditorMode.Eraser)
      expect(wrapperHTML.classList).toContain('erasing')
    })
    test('should setMode = erase', () =>
    {
      editor.setMode(EditorMode.Touche)
      expect(editor.mode).toBe(EditorMode.Touche)
      expect(wrapperHTML.classList).not.toContain('erasing')
    })
  })

  describe('pointer', () =>
  {
    const wrapperHTML: HTMLElement = document.createElement('div')
    const editor = new Editor(wrapperHTML)
    editor.model.initCurrentStroke = jest.fn()
    editor.model.appendToCurrentStroke = jest.fn()
    editor.model.endCurrentStroke = jest.fn()
    editor.behaviors.drawCurrentStroke = jest.fn()
    editor.behaviors.drawModel = jest.fn()

    const eventTarget = document.createElement('div')
    eventTarget.classList.add('ms-canvas')
    const pointerDownEvt = new LeftClickEventFake('pointerdown', {
      pointerType: "pen",
      clientX: 1,
      clientY: 1,
      pressure: 1
    })
    const point: TPoint = { p: 1, t: 1, x: 1, y: 1}

    test.skip('should pointerDown', () =>
    {
      // TODO find solution to define target on pointerDownEvt
      editor.pointerDown(pointerDownEvt as PointerEvent, point)
      expect(editor.model.initCurrentStroke).toHaveBeenCalledTimes(1)
      expect(editor.behaviors.drawCurrentStroke).toHaveBeenCalledTimes(1)
    })
    test('should pointerMove', () =>
    {
      editor.pointerMove(pointerDownEvt as PointerEvent, point)
      expect(editor.model.appendToCurrentStroke).toHaveBeenCalledTimes(1)
      expect(editor.behaviors.drawCurrentStroke).toHaveBeenCalledTimes(1)
    })
    test('should pointerUp', () =>
    {
      editor.pointerUp(pointerDownEvt as PointerEvent, point)
      expect(editor.model.endCurrentStroke).toHaveBeenCalledTimes(1)
      expect(editor.behaviors.drawModel).toHaveBeenCalledTimes(1)
    })
  })

})