// import { UndoRedoContext } from '../../../src/undo-redo/UndoRedoContext'
// import { Model } from '../../../src/model/Model'
import { TMarginConfiguration } from '../../../src/@types/configuration/recognition/MarginConfiguration'
import { GlobalEvent } from '../../../src/event/GlobalEvent'
import { SmartGuide } from '../../../src/smartguide/SmartGuide'
import { LeftClickEventFake } from '../utils/PointerEventFake'

describe('SmartGuide.ts', () =>
{
  const margin: TMarginConfiguration = {
    bottom: 100,
    top: 20,
    left: 30,
    right: 40
  }
  test('should instanciate SmartGuide', () =>
  {
    const sm = new SmartGuide()
    expect(sm).toBeDefined()
  })

  test('should have globalEvent property', () =>
  {
    const sm = new SmartGuide()
    expect(sm.globalEvent).toBe(GlobalEvent.getInstance())
  })

  describe('Initilize', () => {
    const domElement = document.createElement('div')
    const sm = new SmartGuide()
    sm.init(domElement, margin)

    test('should init wrapper', () =>
    {
      const smartguide = domElement.querySelector('.smartguide') as HTMLDivElement
      expect(smartguide).toBeDefined()
      expect(smartguide.id).toBe(`smartguide-${ sm.uuid }`)
    })
    test('should init prompter', () =>
    {
      const prompter = domElement.querySelector('.prompter-container') as HTMLDivElement
      expect(prompter).toBeDefined()
      expect(prompter.id).toBe(`prompter-container-${ sm.uuid }`)

      const prompterText = domElement.querySelector('.prompter-text') as HTMLDivElement
      expect(prompterText).toBeDefined()
      expect(prompterText.id).toBe(`prompter-text-${ sm.uuid }`)
    })
    test('should init ellipsis', () =>
    {
      const wrapper = domElement.querySelector('.ellipsis') as HTMLDivElement
      expect(wrapper).toBeDefined()
      expect(wrapper.id).toBe(`ellipsis-${ sm.uuid }`)
    })
    test('should init ellipsis', () =>
    {
      const wrapper = domElement.querySelector('.tag-icon') as HTMLDivElement
      expect(wrapper).toBeDefined()
      expect(wrapper.id).toBe(`tag-icon-${ sm.uuid }`)
    })
    test('should init candidates', () =>
    {
      const wrapper = domElement.querySelector('.candidates') as HTMLDivElement
      expect(wrapper).toBeDefined()
      expect(wrapper.id).toBe(`candidates-${ sm.uuid }`)
    })
    test('should init more-menu', () =>
    {
      const wrapper = domElement.querySelector('.more-menu') as HTMLDivElement
      expect(wrapper).toBeDefined()
      expect(wrapper.id).toBe(`more-menu-${ sm.uuid }`)

      const copyBtn = domElement.querySelector(`#copy-${ sm.uuid }`) as HTMLDivElement
      expect(copyBtn).toBeDefined()
      expect(copyBtn.classList).toContain('options-label-button')

      const deleteBtn = domElement.querySelector(`#delete-${ sm.uuid }`) as HTMLDivElement
      expect(deleteBtn).toBeDefined()
      expect(deleteBtn.classList).toContain('options-label-button')
    })
  })

  describe('Menu visibility', () => {
    const domElement = document.createElement('div')
    const sm = new SmartGuide()
    sm.init(domElement, margin)
    test('should hidden by default', () =>
    {
      const menu = domElement.querySelector('.more-menu') as HTMLDivElement
      expect(menu.classList).toContain('close')
      expect(menu.classList).not.toContain('open')
      expect(sm.isMenuOpen).toEqual(false)
    })
    test('should open menu', () =>
    {
      sm.toggleMenuVisibility()
      const menu = domElement.querySelector('.more-menu') as HTMLDivElement
      expect(menu.classList).not.toContain('close')
      expect(menu.classList).toContain('open')
      expect(sm.isMenuOpen).toEqual(true)
    })
    test('should close menu', () =>
    {
      sm.toggleMenuVisibility()
      const menu = domElement.querySelector('.more-menu') as HTMLDivElement
      expect(menu.classList).toContain('close')
      expect(menu.classList).not.toContain('open')
      expect(sm.isMenuOpen).toEqual(false)
    })
    test('shoud call toggleMenuVisibility on click ellipsis', () =>
    {
      sm.toggleMenuVisibility = jest.fn()
      const ellispis = domElement.querySelector('.ellipsis') as HTMLDivElement
      const pointerDownEvt = new LeftClickEventFake('pointerdown', {
        pointerType: "pen",
        clientX: 10,
        clientY: 10,
        pressure: 1
      })
      ellispis.dispatchEvent(pointerDownEvt)
      expect(sm.toggleMenuVisibility).toBeCalledTimes(1)
    })

  })

  describe('Menu actions', () => {
    const domElement = document.createElement('div')
    const sm = new SmartGuide()
    sm.globalEvent.emitConvert = jest.fn()
    sm.globalEvent.emitClear = jest.fn()
    sm.init(domElement, margin)
    sm.toggleMenuVisibility()

    const pointerDownEvt = new LeftClickEventFake('pointerdown', {
      pointerType: "pen",
      clientX: 10,
      clientY: 10,
      pressure: 1
    })
    test('should emit CONVERT', () =>
    {
      const btn = domElement.querySelector(`#convert-${ sm.uuid }`) as HTMLDivElement
      btn.dispatchEvent(pointerDownEvt)
      expect(sm.globalEvent.emitConvert).toBeCalledTimes(1)
    })
    test.skip('should COPY', () =>
    {
      // TODO
    })
    test('should emit CLEAR', () =>
    {
      const btn = domElement.querySelector(`#delete-${ sm.uuid }`) as HTMLDivElement
      btn.dispatchEvent(pointerDownEvt)
      expect(sm.globalEvent.emitClear).toBeCalledTimes(1)
    })
  })

  describe('Display', () => {
    const domElement = document.createElement('div')
    const sm = new SmartGuide()
    sm.init(domElement, margin)
    // "application/vnd.myscript.jiix":
    const jiix = {
      "type": "Text",
      "label": "hello how",
      "words": [
        {
          "id": "1",
          "label": "hello",
          "candidates": [ "hello", "helle", "hellor", "hells", "hellon" ]
        },
        {
          "label": " "
        },
        {
          "id": "2",
          "label": "how",
          "candidates": [ "how", "hou", "hore", "hon", "hor" ]
        }
      ],
      "version": "3",
      "id": "MainBlock"
    }

    test('should display jiix label into prompter-text', () => {
      sm.update(jiix)
      const prompterText = domElement.querySelector('.prompter-text') as HTMLDivElement
      expect(prompterText).toBeDefined()
      expect(prompterText.textContent).toContain(jiix.words[0].label)
      expect(prompterText.textContent).toContain(jiix.words[2].label)
      expect(prompterText.children.length).toBeGreaterThan(0)
      const candidates = domElement.querySelector('.candidates') as HTMLDivElement
      expect(candidates.children).toHaveLength(0)
    })

    test.skip('should open candidates', () => {
      // cannot be tested here, you have to simulate an event with a target different from the prompter
      const prompterTextElement = domElement.querySelector('.prompter-text') as HTMLDivElement
      const pointerDownEvt = new LeftClickEventFake('pointerdown', {
        pointerType: "pen",
        clientX: 10,
        clientY: 10,
        pressure: 1,
      })

      prompterTextElement.dispatchEvent(pointerDownEvt)
      const candidates = domElement.querySelector('.candidates') as HTMLDivElement
      expect(candidates.children).toHaveLength(jiix.words.length)
    })

  })

})
