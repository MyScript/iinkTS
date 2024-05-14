import { LeftClickEventMock } from "../__mocks__/EventMock"
import {
  SmartGuide,
  DefaultRenderingConfiguration,
  InternalEvent,
  TMarginConfiguration
} from "../../../src/iink"

describe("SmartGuide.ts", () =>
{
  const margin: TMarginConfiguration = {
    bottom: 100,
    top: 20,
    left: 30,
    right: 40
  }
  test("should instanciate SmartGuide", () =>
  {
    const sm = new SmartGuide()
    expect(sm).toBeDefined()
  })

  test("should have internalEvent property", () =>
  {
    const sm = new SmartGuide()
    expect(sm.internalEvent).toBe(InternalEvent.getInstance())
  })

  describe("Initilize", () =>
  {
    const domElement = document.createElement("div")
    const sm = new SmartGuide()
    sm.init(domElement, margin, DefaultRenderingConfiguration)

    test("should init wrapper", () =>
    {
      const smartguide = domElement.querySelector(".smartguide") as HTMLDivElement
      expect(smartguide).toBeDefined()
      expect(smartguide.id).toBe(`smartguide-${ sm.uuid }`)
    })
    test("should init prompter", () =>
    {
      const prompter = domElement.querySelector(".prompter-container") as HTMLDivElement
      expect(prompter).toBeDefined()
      expect(prompter.id).toBe(`prompter-container-${ sm.uuid }`)

      const prompterText = domElement.querySelector(".prompter-text") as HTMLDivElement
      expect(prompterText).toBeDefined()
      expect(prompterText.id).toBe(`prompter-text-${ sm.uuid }`)
    })
    test("should init ellipsis", () =>
    {
      const wrapper = domElement.querySelector(".ellipsis") as HTMLDivElement
      expect(wrapper).toBeDefined()
      expect(wrapper.id).toBe(`ellipsis-${ sm.uuid }`)
    })
    test("should init ellipsis", () =>
    {
      const wrapper = domElement.querySelector(".tag-icon") as HTMLDivElement
      expect(wrapper).toBeDefined()
      expect(wrapper.id).toBe(`tag-icon-${ sm.uuid }`)
    })
    test("should init candidates", () =>
    {
      const wrapper = domElement.querySelector(".candidates") as HTMLDivElement
      expect(wrapper).toBeDefined()
      expect(wrapper.id).toBe(`candidates-${ sm.uuid }`)
    })
    test("should init more-menu", () =>
    {
      const wrapper = domElement.querySelector(".more-menu") as HTMLDivElement
      expect(wrapper).toBeDefined()
      expect(wrapper.id).toBe(`more-menu-${ sm.uuid }`)

      const copyBtn = domElement.querySelector(`#copy-${ sm.uuid }`) as HTMLDivElement
      expect(copyBtn).toBeDefined()
      expect(copyBtn.classList).toContain("options-label-button")

      const deleteBtn = domElement.querySelector(`#delete-${ sm.uuid }`) as HTMLDivElement
      expect(deleteBtn).toBeDefined()
      expect(deleteBtn.classList).toContain("options-label-button")
    })
  })

  describe("Menu visibility", () =>
  {
    const domElement = document.createElement("div")
    const sm = new SmartGuide()
    sm.init(domElement, margin, DefaultRenderingConfiguration)

    const pointerDownEvt = new LeftClickEventMock("pointerdown", {
      pointerType: "pen",
      clientX: 10,
      clientY: 10,
      pressure: 1
    })
    test("should hidden by default", () =>
    {
      const menu = domElement.querySelector(".more-menu") as HTMLDivElement
      expect(menu.classList).toContain("close")
      expect(menu.classList).not.toContain("open")
    })
    test("should open menu", () =>
    {
      const ellispis = domElement.querySelector(".ellipsis") as HTMLDivElement
      ellispis.dispatchEvent(pointerDownEvt)
      const menu = domElement.querySelector(".more-menu") as HTMLDivElement
      expect(menu.classList).not.toContain("close")
      expect(menu.classList).toContain("open")
    })
    test("should close menu", () =>
    {
      const ellispis = domElement.querySelector(".ellipsis") as HTMLDivElement
      ellispis.dispatchEvent(pointerDownEvt)
      const menu = domElement.querySelector(".more-menu") as HTMLDivElement
      expect(menu.classList).toContain("close")
      expect(menu.classList).not.toContain("open")
    })
  })

  describe("Menu actions", () =>
  {
    const domElement = document.createElement("div")
    const sm = new SmartGuide()
    sm.internalEvent.emitConvert = jest.fn()
    sm.internalEvent.emitClear = jest.fn()
    sm.init(domElement, margin, DefaultRenderingConfiguration)

    const pointerDownEvt = new LeftClickEventMock("pointerdown", {
      pointerType: "pen",
      clientX: 10,
      clientY: 10,
      pressure: 1
    })
    const ellispis = domElement.querySelector(".ellipsis") as HTMLDivElement
    ellispis.dispatchEvent(pointerDownEvt)
    test("should emit CONVERT", () =>
    {
      const btn = domElement.querySelector(`#convert-${ sm.uuid }`) as HTMLDivElement
      btn.dispatchEvent(pointerDownEvt)
      expect(sm.internalEvent.emitConvert).toBeCalledTimes(1)
    })
    test.skip("should COPY", () =>
    {
      // TODO
    })
    test("should emit CLEAR", () =>
    {
      const btn = domElement.querySelector(`#delete-${ sm.uuid }`) as HTMLDivElement
      btn.dispatchEvent(pointerDownEvt)
      expect(sm.internalEvent.emitClear).toBeCalledTimes(1)
    })
  })

  describe("Display", () =>
  {
    const domElement = document.createElement("div")
    const sm = new SmartGuide()
    sm.init(domElement, margin, DefaultRenderingConfiguration)
    const jiix = {
      "type": "Text",
      "label": "hello how",
      "words": [
        {
          "id": "1",
          "label": "hello",
          "candidates": ["hello", "helle", "hellor", "hells", "hellon"]
        },
        {
          "label": " "
        },
        {
          "id": "2",
          "label": "how",
          "candidates": ["how", "hou", "hore", "hon", "hor"]
        }
      ],
      "version": "3",
      "id": "MainBlock"
    }

    test("should display jiix label into prompter-text", () =>
    {
      sm.update(jiix)
      const prompterText = domElement.querySelector(".prompter-text") as HTMLDivElement
      expect(prompterText).toBeDefined()
      expect(prompterText.textContent).toContain(jiix.words[0].label)
      expect(prompterText.textContent).toContain(jiix.words[2].label)
      expect(prompterText.children.length).toBeGreaterThan(0)
      const candidates = domElement.querySelector(".candidates") as HTMLDivElement
      expect(candidates.children).toHaveLength(0)
    })

    test.skip("should open candidates", () =>
    {
      // cannot be tested here, you have to simulate an event with a target different from the prompter
      const prompterTextElement = domElement.querySelector(".prompter-text") as HTMLDivElement
      const pointerDownEvt = new LeftClickEventMock("pointerdown", {
        pointerType: "pen",
        clientX: 10,
        clientY: 10,
        pressure: 1,
      })

      prompterTextElement.dispatchEvent(pointerDownEvt)
      const candidates = domElement.querySelector(".candidates") as HTMLDivElement
      expect(candidates.children).toHaveLength(jiix.words.length)
    })
  })

})
