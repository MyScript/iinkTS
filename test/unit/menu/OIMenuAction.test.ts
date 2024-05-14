import { OIBehaviorsMock } from "../__mocks__/OIBehaviorsMock"
import { Intention, OIMenuAction, StrikeThroughAction, SurroundAction } from "../../../src/iink"
import { ChangeEventMock, LeftClickEventMock } from "../__mocks__/EventMock"

describe("OIMenuAction.ts", () =>
{
  global.fetch = jest.fn(() =>
    Promise.resolve({
      json: () => Promise.resolve({ result: { fr: "fr_FR" } }),
    }),
  ) as jest.Mock
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, value: 500 })

  test("should create", () =>
  {
    const behaviors = new OIBehaviorsMock()
    const menu = new OIMenuAction(behaviors)
    expect(menu).toBeDefined()
  })

  describe("render", () =>
  {
    const layer = document.createElement("div")
    const behaviors = new OIBehaviorsMock()
    behaviors.init(behaviors.layerInfos)
    const menu = new OIMenuAction(behaviors)
    menu.render(layer)
    test("should render menu action", () =>
    {
      expect(layer.querySelector("#ms-menu-action")).not.toBeNull()
    })
    test("should render menu gesture", () =>
    {
      expect(layer.querySelector("#ms-menu-action-gesture")).not.toBeNull()
    })
    test("should render menu guide", () =>
    {
      expect(layer.querySelector("#ms-menu-action-guide")).not.toBeNull()
    })
    test("should render menu snap", () =>
    {
      expect(layer.querySelector("#ms-menu-action-snap")).not.toBeNull()
    })
    test("should render menu debug", () =>
    {
      expect(layer.querySelector("#ms-menu-action-debug")).not.toBeNull()
    })
    test("should render menu clear", () =>
    {
      expect(layer.querySelector("#ms-menu-action-clear")).not.toBeNull()
    })
    test("should render menu language", () =>
    {
      expect(layer.querySelector("#ms-menu-action-language")).not.toBeNull()
    })
    test("should render menu undo", () =>
    {
      expect(layer.querySelector("#ms-menu-action-undo")).not.toBeNull()
    })
    test("should render menu redo", () =>
    {
      expect(layer.querySelector("#ms-menu-action-redo")).not.toBeNull()
    })
    test("should render menu convert", () =>
    {
      expect(layer.querySelector("#ms-menu-action-convert")).not.toBeNull()
    })
  })

  describe("show/hide", () =>
  {
    const layer = document.createElement("div")
    const behaviors = new OIBehaviorsMock()
    behaviors.init(behaviors.layerInfos)
    const menu = new OIMenuAction(behaviors)
    menu.render(layer)
    test("should hide", () =>
    {
      expect(menu.wrapper?.style.visibility).toEqual("visible")
      menu.hide()
      expect(menu.wrapper?.style.visibility).toEqual("hidden")
    })
    test("should show", () =>
    {
      expect(menu.wrapper?.style.visibility).toEqual("hidden")
      menu.show()
      expect(menu.wrapper?.style.visibility).toEqual("visible")
    })
  })

  describe("Main menu", () =>
  {
    const layer = document.createElement("div")
    const behaviors = new OIBehaviorsMock()
    behaviors.init(behaviors.layerInfos)
    const menu = new OIMenuAction(behaviors)
    menu.render(layer)
    test("should call behaviors.clear on pointerup", () =>
    {
      expect(behaviors.clear).not.toBeCalled()
      const pointerEvt = new LeftClickEventMock("pointerup", {
        pointerType: "pen",
        clientX: 300,
        clientY: 500,
        pressure: 1
      })
      layer.querySelector("#ms-menu-action-clear")?.dispatchEvent(pointerEvt)
      expect(behaviors.clear).toBeCalled()
    })
    test("should call behaviors.changeLanguage on change", () =>
    {
      expect(behaviors.changeLanguage).not.toBeCalled()
      behaviors.intention = Intention.Select
      const changeEvt = new ChangeEventMock({
        target: { value: "fr_FR" } as unknown as HTMLInputElement
      })
      layer.querySelector("#ms-menu-action-language")?.dispatchEvent(changeEvt)
      expect(behaviors.changeLanguage).toBeCalled()
    })
    test("should call behaviors.undo on pointerup", () =>
    {
      expect(behaviors.undo).not.toBeCalled()
      const pointerEvt = new LeftClickEventMock("pointerup", {
        pointerType: "pen",
        clientX: 300,
        clientY: 500,
        pressure: 1
      })
      layer.querySelector("#ms-menu-action-undo")?.dispatchEvent(pointerEvt)
      expect(behaviors.undo).toBeCalled()
    })
    test("should call behaviors.redo on pointerup", () =>
    {
      expect(behaviors.redo).not.toBeCalled()
      const pointerEvt = new LeftClickEventMock("pointerup", {
        pointerType: "pen",
        clientX: 300,
        clientY: 500,
        pressure: 1
      })
      layer.querySelector("#ms-menu-action-redo")?.dispatchEvent(pointerEvt)
      expect(behaviors.redo).toBeCalled()
    })
    test("should call behaviors.convert on pointerup", () =>
    {
      expect(behaviors.convert).not.toBeCalled()
      const pointerEvt = new LeftClickEventMock("pointerup", {
        pointerType: "pen",
        clientX: 300,
        clientY: 500,
        pressure: 1
      })
      layer.querySelector("#ms-menu-action-convert")?.dispatchEvent(pointerEvt)
      expect(behaviors.convert).toBeCalled()
    })
  })

  describe("Sub menu", () =>
  {
    const layer = document.createElement("div")
    const behaviors = new OIBehaviorsMock()
    behaviors.init(behaviors.layerInfos)
    const menu = new OIMenuAction(behaviors)
    menu.render(layer)
    test("submenu should be hidden", () =>
    {
      expect(layer.querySelector(".sub-menu-content")?.classList).not.toContain("open")
    })
    test("submenu should be displayed", () =>
    {
      const pointerEvt = new LeftClickEventMock("pointerdown", {
        pointerType: "pen",
        clientX: 300,
        clientY: 500,
        pressure: 1
      })
      layer.querySelector("#ms-menu-action")?.dispatchEvent(pointerEvt)
      expect(layer.querySelector(".sub-menu-content")?.classList).toContain("open")
    })
    test("should open gesture sub menu", () =>
    {
      expect(layer.querySelector("#ms-menu-action-gesture + .sub-menu-content")?.classList).not.toContain("open")
      const pointerEvt = new LeftClickEventMock("pointerdown", {
        pointerType: "pen",
        clientX: 300,
        clientY: 500,
        pressure: 1
      })
      layer.querySelector("#ms-menu-action-gesture")?.dispatchEvent(pointerEvt)
      expect(layer.querySelector("#ms-menu-action-gesture + .sub-menu-content")?.classList).toContain("open")
    })
    test("should define behaviors to write on change gesture detected", () =>
    {
      behaviors.writer.detectGesture = true
      behaviors.intention = Intention.Select
      const changeEvt = new ChangeEventMock({
        target: { value: false } as unknown as HTMLInputElement
      })
      const input = layer.querySelector("#ms-menu-action-gesture-detect") as HTMLInputElement
      input.checked = false
      input.dispatchEvent(changeEvt)
      expect(behaviors.intention).toEqual(Intention.Write)
      expect(behaviors.writer.detectGesture).toEqual(false)
    })
    test("should define behaviors to write on change gesture surround", () =>
    {
      behaviors.intention = Intention.Select
      behaviors.gesture.surroundAction = SurroundAction.Select
      const changeEvt = new ChangeEventMock({
        target: { value: SurroundAction.Surround } as unknown as HTMLInputElement
      })
      const input = layer.querySelector("#ms-menu-action-gesture-surround") as HTMLInputElement
      input.value = SurroundAction.Surround
      input.dispatchEvent(changeEvt)
      expect(behaviors.intention).toEqual(Intention.Write)
      expect(behaviors.gesture.surroundAction).toEqual(SurroundAction.Surround)
    })
    test("should define behaviors to write on change gesture strikethrough", () =>
    {
      behaviors.intention = Intention.Select
      behaviors.gesture.strikeThroughAction = StrikeThroughAction.Draw
      const changeEvt = new ChangeEventMock({
        target: { value: StrikeThroughAction.Erase } as unknown as HTMLInputElement
      })
      const input = layer.querySelector("#ms-menu-action-gesture-strikethrough") as HTMLInputElement
      input.value = StrikeThroughAction.Erase
      input.dispatchEvent(changeEvt)
      expect(behaviors.intention).toEqual(Intention.Write)
      expect(behaviors.gesture.strikeThroughAction).toEqual(StrikeThroughAction.Erase)
    })
    test("should open guide sub menu", () =>
    {
      expect(layer.querySelector("#ms-menu-action-guide + .sub-menu-content")?.classList).not.toContain("open")
      const pointerEvt = new LeftClickEventMock("pointerdown", {
        pointerType: "pen",
        clientX: 300,
        clientY: 500,
        pressure: 1
      })
      layer.querySelector("#ms-menu-action-guide")?.dispatchEvent(pointerEvt)
      expect(layer.querySelector("#ms-menu-action-guide + .sub-menu-content")?.classList).toContain("open")
    })
    test("should set guide enable to false on change", () =>
    {
      behaviors.configuration.rendering.guides.enable = true
      const changeEvt = new ChangeEventMock({
        target: { checked: false } as unknown as HTMLInputElement
      })
      const input = layer.querySelector("#ms-menu-action-guide-enable") as HTMLInputElement
      input.checked = false
      input.dispatchEvent(changeEvt)
      expect(behaviors.configuration.rendering.guides.enable).toEqual(false)
    })
    test("should set guide type to false on change", () =>
    {
      behaviors.configuration.rendering.guides.type = "point"
      const changeEvt = new ChangeEventMock({
        target: { checked: "grid" } as unknown as HTMLInputElement
      })
      const input = layer.querySelector("#ms-menu-action-guide-type") as HTMLInputElement
      input.value = "grid"
      input.dispatchEvent(changeEvt)
      expect(behaviors.configuration.rendering.guides.type).toEqual("grid")
    })
    test("should set guide size to false on change", () =>
    {
      behaviors.configuration.rendering.guides.gap = 100
      const btn = layer.querySelector("#ms-menu-action-guide-size-20-btn") as HTMLButtonElement
      const pointerEvt = new LeftClickEventMock("pointerup", {
        pointerType: "pen",
        clientX: 300,
        clientY: 500,
        pressure: 1
      })
      btn.dispatchEvent(pointerEvt)
      expect(behaviors.configuration.rendering.guides.gap).toEqual(20)
    })
  })

  describe("destroy", () =>
  {
    const layer = document.createElement("div")
    const behaviors = new OIBehaviorsMock()
    behaviors.init(behaviors.layerInfos)
    const menu = new OIMenuAction(behaviors)
    menu.render(layer)
    test("should remove elements", () =>
    {
      expect(layer.childElementCount).toEqual(1)
      expect(menu.wrapper?.childElementCount).toEqual(6)
      menu.destroy()
      expect(layer.childElementCount).toEqual(0)
      expect(menu.wrapper).toBeUndefined()
    })
  })
})
