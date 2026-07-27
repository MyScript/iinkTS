import { createCanvasMock, asCanvas } from "../__mocks__/createCanvasMock"
import { ChangeEventMock, LeftClickEventMock } from "../__mocks__/EventMock"
import { CanvasTool, IIMenuAction, StrikeThroughAction, SurroundAction } from "@/iink"

describe("IIMenuAction.ts", () => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      json: () => Promise.resolve({ result: { fr: "fr_FR" } }),
    })
  ) as jest.Mock
  Object.defineProperty(HTMLElement.prototype, "clientWidth", { configurable: true, value: 500 })

  test("should create", () => {
    const canvas = createCanvasMock()
    const menu = new IIMenuAction(asCanvas(canvas))
    expect(menu).toBeDefined()
  })

  describe("render", () => {
    const canvas = createCanvasMock()
    const menu = new IIMenuAction(asCanvas(canvas))
    menu.render(canvas.layers.ui.root)
    test("should render menu action", () => {
      expect(canvas.layers.ui.root.querySelector("#ms-menu-action")).not.toBeNull()
    })
    test("should render menu gesture", () => {
      expect(canvas.layers.ui.root.querySelector("#ms-menu-action-gesture")).not.toBeNull()
    })
    test("should render menu guide", () => {
      expect(canvas.layers.ui.root.querySelector("#ms-menu-action-guide")).not.toBeNull()
    })
    test("should render menu snap", () => {
      expect(canvas.layers.ui.root.querySelector("#ms-menu-action-snap")).not.toBeNull()
    })
    test("should render menu clear", () => {
      expect(canvas.layers.ui.root.querySelector("#ms-menu-action-clear")).not.toBeNull()
    })
    test("should render menu language", () => {
      expect(canvas.layers.ui.root.querySelector("#ms-menu-action-language")).not.toBeNull()
    })
    test("should render menu undo", () => {
      expect(canvas.layers.ui.root.querySelector("#ms-menu-action-undoredo-undo")).not.toBeNull()
    })
    test("should render menu redo", () => {
      expect(canvas.layers.ui.root.querySelector("#ms-menu-action-undoredo-redo")).not.toBeNull()
    })
    test("should render menu convert", () => {
      expect(canvas.layers.ui.root.querySelector("#ms-menu-action-convert")).not.toBeNull()
    })
  })

  describe("show/hide", () => {
    const canvas = createCanvasMock()
    const menu = new IIMenuAction(asCanvas(canvas))
    menu.render(canvas.layers.ui.root)
    test("should hide", () => {
      expect(menu.wrapper?.style.visibility).toEqual("visible")
      menu.hide()
      expect(menu.wrapper?.style.visibility).toEqual("hidden")
    })
    test("should show", () => {
      expect(menu.wrapper?.style.visibility).toEqual("hidden")
      menu.show()
      expect(menu.wrapper?.style.visibility).toEqual("visible")
    })
  })

  describe("Main menu", () => {
    const canvas = createCanvasMock()
    const menu = new IIMenuAction(asCanvas(canvas))
    menu.render(canvas.layers.ui.root)
    test("should call canvas.clear on pointerup", () => {
      expect(canvas.clear).not.toHaveBeenCalled()
      const pointerEvt = new LeftClickEventMock("pointerup", {
        pointerType: "pen",
        clientX: 300,
        clientY: 500,
        pressure: 1,
      })
      canvas.layers.ui.root.querySelector("#ms-menu-action-clear")?.dispatchEvent(pointerEvt)
      expect(canvas.clear).toHaveBeenCalled()
    })
    test("should call canvas.changeLanguage on change", () => {
      expect(canvas.changeLanguage).not.toHaveBeenCalled()
      canvas.tool = CanvasTool.Select
      const changeEvt = new ChangeEventMock({
        target: { value: "fr_FR" } as unknown as HTMLInputElement,
      })
      canvas.layers.ui.root.querySelector("#ms-menu-action-language")?.dispatchEvent(changeEvt)
      expect(canvas.changeLanguage).toHaveBeenCalled()
    })
    test("should call canvas.undo on pointerup", () => {
      expect(canvas.undo).not.toHaveBeenCalled()
      const pointerEvt = new LeftClickEventMock("pointerup", {
        pointerType: "pen",
        clientX: 300,
        clientY: 500,
        pressure: 1,
      })
      canvas.layers.ui.root.querySelector("#ms-menu-action-undoredo-undo")?.dispatchEvent(pointerEvt)
      expect(canvas.undo).toHaveBeenCalled()
    })
    test("should call canvas.redo on pointerup", () => {
      expect(canvas.redo).not.toHaveBeenCalled()
      const pointerEvt = new LeftClickEventMock("pointerup", {
        pointerType: "pen",
        clientX: 300,
        clientY: 500,
        pressure: 1,
      })
      canvas.layers.ui.root.querySelector("#ms-menu-action-undoredo-redo")?.dispatchEvent(pointerEvt)
      expect(canvas.redo).toHaveBeenCalled()
    })
    test("should call canvas.convert on pointerup", () => {
      expect(canvas.convert).not.toHaveBeenCalled()
      const pointerEvt = new LeftClickEventMock("pointerup", {
        pointerType: "pen",
        clientX: 300,
        clientY: 500,
        pressure: 1,
      })
      canvas.layers.ui.root.querySelector("#ms-menu-action-convert")?.dispatchEvent(pointerEvt)
      expect(canvas.convert).toHaveBeenCalled()
    })
  })

  describe("Sub menu", () => {
    const canvas = createCanvasMock()
    const menu = new IIMenuAction(asCanvas(canvas))
    menu.render(canvas.layers.ui.root)
    test("submenu should be hidden", () => {
      expect(canvas.layers.ui.root.querySelector(".sub-menu-content")?.classList).not.toContain("open")
    })
    test("submenu should be displayed", () => {
      const pointerEvt = new LeftClickEventMock("pointerdown", {
        pointerType: "pen",
        clientX: 300,
        clientY: 500,
        pressure: 1,
      })
      canvas.layers.ui.root.querySelector("#ms-menu-action")?.dispatchEvent(pointerEvt)
      expect(canvas.layers.ui.root.querySelector(".sub-menu-content")?.classList).toContain("open")
    })
    test("should open gesture sub menu", () => {
      expect(canvas.layers.ui.root.querySelector("#ms-menu-action-gesture .sub-menu-content")?.classList).not.toContain(
        "open"
      )
      const pointerEvt = new LeftClickEventMock("pointerdown", {
        pointerType: "pen",
        clientX: 300,
        clientY: 500,
        pressure: 1,
      })
      canvas.layers.ui.root.querySelector("#ms-menu-action-gesture button")?.dispatchEvent(pointerEvt)
      expect(canvas.layers.ui.root.querySelector("#ms-menu-action-gesture .sub-menu-content")?.classList).toContain(
        "open"
      )
    })
    test("should define canvas to write on change gesture detected", () => {
      canvas.writer.detectGesture = true
      canvas.tool = CanvasTool.Select
      const changeEvt = new ChangeEventMock({
        target: { checked: false } as unknown as HTMLInputElement,
      })
      const input = canvas.layers.ui.root.querySelector("#ms-menu-action-gesture-detect-input") as HTMLInputElement
      input.checked = false
      input.dispatchEvent(changeEvt)
      expect(canvas.tool).toEqual(CanvasTool.Write)
      expect(canvas.writer.detectGesture).toEqual(false)
    })
    test("should define canvas to write on change gesture surround", () => {
      canvas.tool = CanvasTool.Select
      canvas.gesture.surroundAction = SurroundAction.Select
      const changeEvt = new ChangeEventMock({
        target: { value: SurroundAction.Surround } as unknown as HTMLInputElement,
      })
      const input = canvas.layers.ui.root.querySelector("#ms-menu-action-gesture-surround-input") as HTMLInputElement
      input.value = SurroundAction.Surround
      input.dispatchEvent(changeEvt)
      expect(canvas.tool).toEqual(CanvasTool.Write)
      expect(canvas.gesture.surroundAction).toEqual(SurroundAction.Surround)
    })
    test("should define canvas to write on change gesture strikethrough", () => {
      canvas.tool = CanvasTool.Select
      canvas.gesture.strikeThroughAction = StrikeThroughAction.Draw
      const changeEvt = new ChangeEventMock({
        target: { value: StrikeThroughAction.Erase } as unknown as HTMLInputElement,
      })
      const input = canvas.layers.ui.root.querySelector(
        "#ms-menu-action-gesture-strikethrough-input"
      ) as HTMLInputElement
      input.value = StrikeThroughAction.Erase
      input.dispatchEvent(changeEvt)
      expect(canvas.tool).toEqual(CanvasTool.Write)
      expect(canvas.gesture.strikeThroughAction).toEqual(StrikeThroughAction.Erase)
    })
    test("should open guide sub menu", () => {
      expect(canvas.layers.ui.root.querySelector("#ms-menu-action-guide .sub-menu-content")?.classList).not.toContain(
        "open"
      )
      const pointerEvt = new LeftClickEventMock("pointerdown", {
        pointerType: "pen",
        clientX: 300,
        clientY: 500,
        pressure: 1,
      })
      canvas.layers.ui.root.querySelector("#ms-menu-action-guide button")?.dispatchEvent(pointerEvt)
      expect(canvas.layers.ui.root.querySelector("#ms-menu-action-guide .sub-menu-content")?.classList).toContain(
        "open"
      )
    })
    test("should set guide enable to false on change", () => {
      canvas.configuration.rendering.guides.enable = true
      const changeEvt = new ChangeEventMock({
        target: { checked: false } as unknown as HTMLInputElement,
      })
      const input = canvas.layers.ui.root.querySelector("#ms-menu-action-guide-enable-input") as HTMLInputElement
      input.checked = false
      input.dispatchEvent(changeEvt)
      expect(canvas.configuration.rendering.guides.enable).toEqual(false)
    })
    test("should set guide type to grid on change", () => {
      canvas.configuration.rendering.guides.type = "point"
      const changeEvt = new ChangeEventMock({
        target: { value: "grid" } as unknown as HTMLInputElement,
      })
      const input = canvas.layers.ui.root.querySelector("#ms-menu-action-guide-type-input") as HTMLInputElement
      input.value = "grid"
      input.dispatchEvent(changeEvt)
      expect(canvas.configuration.rendering.guides.type).toEqual("grid")
    })
    test("should set guide size to 25 on change", () => {
      canvas.configuration.rendering.guides.gap = 100
      const btn = canvas.layers.ui.root.querySelector("#ms-menu-action-guide-size-25") as HTMLButtonElement
      const pointerEvt = new LeftClickEventMock("pointerup", {
        pointerType: "pen",
        clientX: 300,
        clientY: 500,
        pressure: 1,
      })
      btn.dispatchEvent(pointerEvt)
      expect(canvas.configuration.rendering.guides.gap).toEqual(25)
    })
  })

  describe("destroy", () => {
    const canvas = createCanvasMock()
    const menu = new IIMenuAction(asCanvas(canvas))
    menu.render(canvas.layers.ui.root)
    test("should remove elements", () => {
      expect(canvas.layers.ui.root.contains(menu.wrapper!)).toEqual(true)
      expect(menu.wrapper?.childElementCount).toBeGreaterThan(0)
      menu.destroy()
      expect(canvas.layers.ui.root.contains(menu.wrapper!)).toEqual(false)
      expect(menu.wrapper).toBeUndefined()
    })
  })
})
