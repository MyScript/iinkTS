import { EditorOffscreenMock } from "../__mocks__/EditorOffscreenMock"
import { EditorTool, OIMenuAction, StrikeThroughAction, SurroundAction } from "../../../src/iink"
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
    const editor = new EditorOffscreenMock()
    const menu = new OIMenuAction(editor)
    expect(menu).toBeDefined()
  })

  describe("render", () =>
  {
    const editor = new EditorOffscreenMock()
    editor.init()
    const menu = new OIMenuAction(editor)
    menu.render(editor.layers.ui.root)
    test("should render menu action", () =>
    {
      expect(editor.layers.ui.root.querySelector("#ms-menu-action")).not.toBeNull()
    })
    test("should render menu gesture", () =>
    {
      expect(editor.layers.ui.root.querySelector("#ms-menu-action-gesture")).not.toBeNull()
    })
    test("should render menu guide", () =>
    {
      expect(editor.layers.ui.root.querySelector("#ms-menu-action-guide")).not.toBeNull()
    })
    test("should render menu snap", () =>
    {
      expect(editor.layers.ui.root.querySelector("#ms-menu-action-snap")).not.toBeNull()
    })
    test("should render menu debug", () =>
    {
      expect(editor.layers.ui.root.querySelector("#ms-menu-action-debug")).not.toBeNull()
    })
    test("should render menu clear", () =>
    {
      expect(editor.layers.ui.root.querySelector("#ms-menu-action-clear")).not.toBeNull()
    })
    test("should render menu language", () =>
    {
      expect(editor.layers.ui.root.querySelector("#ms-menu-action-language")).not.toBeNull()
    })
    test("should render menu undo", () =>
    {
      expect(editor.layers.ui.root.querySelector("#ms-menu-action-undo")).not.toBeNull()
    })
    test("should render menu redo", () =>
    {
      expect(editor.layers.ui.root.querySelector("#ms-menu-action-redo")).not.toBeNull()
    })
    test("should render menu convert", () =>
    {
      expect(editor.layers.ui.root.querySelector("#ms-menu-action-convert")).not.toBeNull()
    })
  })

  describe("show/hide", () =>
  {
    const editor = new EditorOffscreenMock()
    editor.init()
    const menu = new OIMenuAction(editor)
    menu.render(editor.layers.ui.root)
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
    const editor = new EditorOffscreenMock()
    editor.init()
    const menu = new OIMenuAction(editor)
    menu.render(editor.layers.ui.root)
    test("should call editor.clear on pointerup", () =>
    {
      expect(editor.clear).not.toBeCalled()
      const pointerEvt = new LeftClickEventMock("pointerup", {
        pointerType: "pen",
        clientX: 300,
        clientY: 500,
        pressure: 1
      })
      editor.layers.ui.root.querySelector("#ms-menu-action-clear")?.dispatchEvent(pointerEvt)
      expect(editor.clear).toBeCalled()
    })
    test("should call editor.changeLanguage on change", () =>
    {
      expect(editor.changeLanguage).not.toBeCalled()
      editor.tool = EditorTool.Select
      const changeEvt = new ChangeEventMock({
        target: { value: "fr_FR" } as unknown as HTMLInputElement
      })
      editor.layers.ui.root.querySelector("#ms-menu-action-language")?.dispatchEvent(changeEvt)
      expect(editor.changeLanguage).toBeCalled()
    })
    test("should call editor.undo on pointerup", () =>
    {
      expect(editor.undo).not.toBeCalled()
      const pointerEvt = new LeftClickEventMock("pointerup", {
        pointerType: "pen",
        clientX: 300,
        clientY: 500,
        pressure: 1
      })
      editor.layers.ui.root.querySelector("#ms-menu-action-undo")?.dispatchEvent(pointerEvt)
      expect(editor.undo).toBeCalled()
    })
    test("should call editor.redo on pointerup", () =>
    {
      expect(editor.redo).not.toBeCalled()
      const pointerEvt = new LeftClickEventMock("pointerup", {
        pointerType: "pen",
        clientX: 300,
        clientY: 500,
        pressure: 1
      })
      editor.layers.ui.root.querySelector("#ms-menu-action-redo")?.dispatchEvent(pointerEvt)
      expect(editor.redo).toBeCalled()
    })
    test("should call editor.convert on pointerup", () =>
    {
      expect(editor.convert).not.toBeCalled()
      const pointerEvt = new LeftClickEventMock("pointerup", {
        pointerType: "pen",
        clientX: 300,
        clientY: 500,
        pressure: 1
      })
      editor.layers.ui.root.querySelector("#ms-menu-action-convert")?.dispatchEvent(pointerEvt)
      expect(editor.convert).toBeCalled()
    })
  })

  describe("Sub menu", () =>
  {
    const editor = new EditorOffscreenMock()
    editor.init()
    const menu = new OIMenuAction(editor)
    menu.render(editor.layers.ui.root)
    test("submenu should be hidden", () =>
    {
      expect(editor.layers.ui.root.querySelector(".sub-menu-content")?.classList).not.toContain("open")
    })
    test("submenu should be displayed", () =>
    {
      const pointerEvt = new LeftClickEventMock("pointerdown", {
        pointerType: "pen",
        clientX: 300,
        clientY: 500,
        pressure: 1
      })
      editor.layers.ui.root.querySelector("#ms-menu-action")?.dispatchEvent(pointerEvt)
      expect(editor.layers.ui.root.querySelector(".sub-menu-content")?.classList).toContain("open")
    })
    test("should open gesture sub menu", () =>
    {
      expect(editor.layers.ui.root.querySelector("#ms-menu-action-gesture + .sub-menu-content")?.classList).not.toContain("open")
      const pointerEvt = new LeftClickEventMock("pointerdown", {
        pointerType: "pen",
        clientX: 300,
        clientY: 500,
        pressure: 1
      })
      editor.layers.ui.root.querySelector("#ms-menu-action-gesture")?.dispatchEvent(pointerEvt)
      expect(editor.layers.ui.root.querySelector("#ms-menu-action-gesture + .sub-menu-content")?.classList).toContain("open")
    })
    test("should define editor to write on change gesture detected", () =>
    {
      editor.writer.detectGesture = true
      editor.tool = EditorTool.Select
      const changeEvt = new ChangeEventMock({
        target: { value: false } as unknown as HTMLInputElement
      })
      const input = editor.layers.ui.root.querySelector("#ms-menu-action-gesture-detect") as HTMLInputElement
      input.checked = false
      input.dispatchEvent(changeEvt)
      expect(editor.tool).toEqual(EditorTool.Write)
      expect(editor.writer.detectGesture).toEqual(false)
    })
    test("should define editor to write on change gesture surround", () =>
    {
      editor.tool = EditorTool.Select
      editor.gesture.surroundAction = SurroundAction.Select
      const changeEvt = new ChangeEventMock({
        target: { value: SurroundAction.Surround } as unknown as HTMLInputElement
      })
      const input = editor.layers.ui.root.querySelector("#ms-menu-action-gesture-surround") as HTMLInputElement
      input.value = SurroundAction.Surround
      input.dispatchEvent(changeEvt)
      expect(editor.tool).toEqual(EditorTool.Write)
      expect(editor.gesture.surroundAction).toEqual(SurroundAction.Surround)
    })
    test("should define editor to write on change gesture strikethrough", () =>
    {
      editor.tool = EditorTool.Select
      editor.gesture.strikeThroughAction = StrikeThroughAction.Draw
      const changeEvt = new ChangeEventMock({
        target: { value: StrikeThroughAction.Erase } as unknown as HTMLInputElement
      })
      const input = editor.layers.ui.root.querySelector("#ms-menu-action-gesture-strikethrough") as HTMLInputElement
      input.value = StrikeThroughAction.Erase
      input.dispatchEvent(changeEvt)
      expect(editor.tool).toEqual(EditorTool.Write)
      expect(editor.gesture.strikeThroughAction).toEqual(StrikeThroughAction.Erase)
    })
    test("should open guide sub menu", () =>
    {
      expect(editor.layers.ui.root.querySelector("#ms-menu-action-guide + .sub-menu-content")?.classList).not.toContain("open")
      const pointerEvt = new LeftClickEventMock("pointerdown", {
        pointerType: "pen",
        clientX: 300,
        clientY: 500,
        pressure: 1
      })
      editor.layers.ui.root.querySelector("#ms-menu-action-guide")?.dispatchEvent(pointerEvt)
      expect(editor.layers.ui.root.querySelector("#ms-menu-action-guide + .sub-menu-content")?.classList).toContain("open")
    })
    test("should set guide enable to false on change", () =>
    {
      editor.configuration.rendering.guides.enable = true
      const changeEvt = new ChangeEventMock({
        target: { checked: false } as unknown as HTMLInputElement
      })
      const input = editor.layers.ui.root.querySelector("#ms-menu-action-guide-enable") as HTMLInputElement
      input.checked = false
      input.dispatchEvent(changeEvt)
      expect(editor.configuration.rendering.guides.enable).toEqual(false)
    })
    test("should set guide type to false on change", () =>
    {
      editor.configuration.rendering.guides.type = "point"
      const changeEvt = new ChangeEventMock({
        target: { checked: "grid" } as unknown as HTMLInputElement
      })
      const input = editor.layers.ui.root.querySelector("#ms-menu-action-guide-type") as HTMLInputElement
      input.value = "grid"
      input.dispatchEvent(changeEvt)
      expect(editor.configuration.rendering.guides.type).toEqual("grid")
    })
    test("should set guide size to false on change", () =>
    {
      editor.configuration.rendering.guides.gap = 100
      const btn = editor.layers.ui.root.querySelector("#ms-menu-action-guide-size-25-btn") as HTMLButtonElement
      const pointerEvt = new LeftClickEventMock("pointerup", {
        pointerType: "pen",
        clientX: 300,
        clientY: 500,
        pressure: 1
      })
      btn.dispatchEvent(pointerEvt)
      expect(editor.configuration.rendering.guides.gap).toEqual(25)
    })
  })

  describe("destroy", () =>
  {
    const editor = new EditorOffscreenMock()
    editor.init()
    const menu = new OIMenuAction(editor)
    menu.render(editor.layers.ui.root)
    test("should remove elements", () =>
    {
      expect(editor.layers.ui.root.contains(menu.wrapper!)).toEqual(true)
      expect(menu.wrapper?.childElementCount).toEqual(6)
      menu.destroy()
      expect(editor.layers.ui.root.contains(menu.wrapper!)).toEqual(false)
      expect(menu.wrapper).toBeUndefined()
    })
  })
})
