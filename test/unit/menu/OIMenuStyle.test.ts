import { LeftClickEventMock } from "../__mocks__/EventMock"
import { EditorOffscreenMock } from "../__mocks__/EditorOffscreenMock"
import { buildOICircle, buildOIStroke } from "../helpers"
import { EditorTool, OIMenuStyle, EditorWriteTool } from "../../../src/iink"

describe("OIMenuStyle.ts", () =>
{
  test("should create", () =>
  {
    const editor = new EditorOffscreenMock()
    const menu = new OIMenuStyle(editor)
    expect(menu).toBeDefined()
  })

  describe("render", () =>
  {
    const editor = new EditorOffscreenMock()
    editor.init()
    const menu = new OIMenuStyle(editor)
    describe("isMobile", () =>
    {
      const layer = document.createElement("div")
      beforeAll(() =>
      {
        Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, value: 500 })
        menu.render(layer)
      })
      test("should isMobile to be true", () =>
      {
        expect(menu.isMobile).toBe(true)
      })
      test("should render ms-menu-style and display", () =>
      {
        const btn = layer.querySelector("#ms-menu-style") as HTMLButtonElement
        expect(btn).not.toBeNull()
        expect(btn.parentElement?.style.display).toEqual("block")
      })
      test("should render menu stroke color", () =>
      {
        const menuColor = layer.querySelector("#ms-menu-style-color") as HTMLElement
        expect(menuColor).not.toBeNull()
        expect(menuColor.style.display).toEqual("block")
        const list = menuColor.querySelector("#ms-menu-style-color-list") as HTMLElement
        expect(list.childElementCount).toEqual(menu.colors.length)
      })
      test("should render menu fill color and not display", () =>
      {
        const menuFill = layer.querySelector("#ms-menu-style-fill") as HTMLElement
        expect(menuFill).not.toBeNull()
        expect(menuFill.style.display).toEqual("none")
        const list = menuFill.querySelector("#ms-menu-style-fill-list") as HTMLElement
        expect(list.childElementCount).toEqual(menu.colors.length)
      })
      test("should render menu thickness", () =>
      {
        const menuThickness = layer.querySelector("#ms-menu-style-thickness") as HTMLElement
        expect(menuThickness).not.toBeNull()
        expect(menuThickness.style.display).toEqual("block")
        const list = menuThickness.querySelector("#ms-menu-style-thickness-list") as HTMLElement
        expect(list.childElementCount).toEqual(menu.thicknessList.length)
      })
      test("should render menu font-size", () =>
      {
        const menuThickness = layer.querySelector("#ms-menu-style-font-size") as HTMLElement
        expect(menuThickness).not.toBeNull()
        expect(menuThickness.style.display).toEqual("block")
        const list = menuThickness.querySelector("#ms-menu-style-font-size-list") as HTMLElement
        expect(list.childElementCount).toEqual(menu.fontSizeList.length)
      })
      test("should render menu opacity", () =>
      {
        const menuOpacity = layer.querySelector("#ms-menu-style-opacity") as HTMLElement
        expect(menuOpacity).not.toBeNull()
        expect(menuOpacity.style.display).toEqual("block")
        const input = menuOpacity.querySelector("#ms-menu-style-opacity-input") as HTMLElement
        expect(input.getAttribute("type")).toEqual("range")
      })
    })
    describe("desktop", () =>
    {
      const layer = document.createElement("div")
      beforeAll(() =>
      {
        Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, value: 700 })
        menu.render(layer)
      })
      test("should isMobile to be false", () =>
      {
        expect(menu.isMobile).toBe(false)
      })
      test("should render ms-menu-style and not display", () =>
      {
        const btn = layer.querySelector("#ms-menu-style") as HTMLButtonElement
        expect(btn.parentElement?.style.display).toEqual("none")
      })
      test("should render menu stroke color", () =>
      {
        const menuColor = layer.querySelector("#ms-menu-style-color") as HTMLElement
        expect(menuColor).not.toBeNull()
        expect(menuColor.style.display).toEqual("block")
        const list = menuColor.querySelector("#ms-menu-style-color-list") as HTMLElement
        expect(list.childElementCount).toEqual(menu.colors.length)
      })
      test("should render menu fill color and not display", () =>
      {
        const menuFill = layer.querySelector("#ms-menu-style-fill") as HTMLElement
        expect(menuFill).not.toBeNull()
        expect(menuFill.style.display).toEqual("none")
        const list = menuFill.querySelector("#ms-menu-style-fill-list") as HTMLElement
        expect(list.childElementCount).toEqual(menu.colors.length)
      })
      test("should render menu thickness", () =>
      {
        const menuThickness = layer.querySelector("#ms-menu-style-thickness") as HTMLElement
        expect(menuThickness).not.toBeNull()
        expect(menuThickness.style.display).toEqual("block")
        const list = menuThickness.querySelector("#ms-menu-style-thickness-list") as HTMLElement
        expect(list.childElementCount).toEqual(menu.thicknessList.length)
      })
      test("should render menu font-size", () =>
      {
        const menuThickness = layer.querySelector("#ms-menu-style-font-size") as HTMLElement
        expect(menuThickness).not.toBeNull()
        expect(menuThickness.style.display).toEqual("block")
        const list = menuThickness.querySelector("#ms-menu-style-font-size-list") as HTMLElement
        expect(list.childElementCount).toEqual(menu.fontSizeList.length)
      })
      test("should render menu opacity", () =>
      {
        const menuOpacity = layer.querySelector("#ms-menu-style-opacity") as HTMLElement
        expect(menuOpacity).not.toBeNull()
        expect(menuOpacity.style.display).toEqual("block")
        const input = menuOpacity.querySelector("#ms-menu-style-opacity-input") as HTMLElement
        expect(input.getAttribute("type")).toEqual("range")
      })
    })
  })

  describe("update style", () =>
  {
    const pointerUpEvt = new LeftClickEventMock("pointerup", {
      pointerType: "pen",
      clientX: 10,
      clientY: 10,
      pressure: 1
    })
    const layer = document.createElement("div")
    const editor = new EditorOffscreenMock()
    editor.selector.resetSelectedGroup = jest.fn()

    editor.init()
    const menu = new OIMenuStyle(editor)
    menu.render(layer)

    beforeEach(() =>
    {
      editor.model.clear()
    })

    test("should update style color", () =>
    {
      const btn = layer.querySelector("#ms-menu-style-color-808080-btn") as HTMLButtonElement
      btn.dispatchEvent(pointerUpEvt)
      expect(editor.penStyle.color).toEqual("#808080")
    })
    test("should update color of selected symbols", () =>
    {
      const stroke = buildOIStroke()
      stroke.selected = true
      editor.model.addSymbol(stroke)
      const btn = layer.querySelector("#ms-menu-style-color-808080-btn") as HTMLButtonElement
      btn.dispatchEvent(pointerUpEvt)
      expect(editor.updateSymbolsStyle).toHaveBeenCalledTimes(1)
      expect(editor.updateSymbolsStyle).toHaveBeenCalledWith([stroke.id], { color: "#808080" })
    })
    test("should update fill of selected symbols", () =>
    {
      const stroke = buildOIStroke()
      stroke.selected = true
      editor.model.addSymbol(stroke)
      const btn = layer.querySelector("#ms-menu-style-fill-ffff00-btn") as HTMLButtonElement
      btn.dispatchEvent(pointerUpEvt)
      expect(editor.updateSymbolsStyle).toHaveBeenCalledTimes(1)
      expect(editor.updateSymbolsStyle).toHaveBeenCalledWith([stroke.id], { fill: "#ffff00" })
    })
    test("should update style thickness", () =>
    {
      const btn = layer.querySelector("#ms-menu-style-thickness-XL-btn") as HTMLButtonElement
      btn.dispatchEvent(pointerUpEvt)
      expect(editor.penStyle.width).toEqual(8)
    })
    test("should update thickness of selected symbols", () =>
    {
      const stroke = buildOIStroke()
      stroke.selected = true
      editor.model.addSymbol(stroke)
      const btn = layer.querySelector("#ms-menu-style-thickness-XL-btn") as HTMLButtonElement
      btn.dispatchEvent(pointerUpEvt)
      expect(editor.updateSymbolsStyle).toHaveBeenCalledTimes(1)
      expect(editor.updateSymbolsStyle).toHaveBeenCalledWith([stroke.id], { width: 8 })
      expect(editor.selector.resetSelectedGroup).toHaveBeenNthCalledWith(1, [stroke])
    })
    test("should update style opacity", () =>
    {
      const input = layer.querySelector("#ms-menu-style-opacity-input") as HTMLInputElement
      input.value = "42"
      //@ts-ignore
      input.dispatchEvent(new Event('input', { target: input }))
      expect(editor.penStyle.opacity).toEqual(0.42)
    })
    test("should update opacity of selected symbols", () =>
    {
      const stroke = buildOIStroke()
      stroke.selected = true
      editor.model.addSymbol(stroke)
      const input = layer.querySelector("#ms-menu-style-opacity-input") as HTMLInputElement
      input.value = "42"
      input.dispatchEvent(new Event('input'))
      expect(editor.updateSymbolsStyle).toHaveBeenCalledTimes(1)
      expect(editor.updateSymbolsStyle).toHaveBeenCalledWith([stroke.id], { opacity: 0.42 })
    })
  })

  describe("update", () =>
  {
    const layer = document.createElement("div")
    const editor = new EditorOffscreenMock()
    editor.init()
    const menu = new OIMenuStyle(editor)
    menu.render(layer)

    describe("when tool == write with pencil", () =>
    {
      beforeAll(() => {
        editor.tool = EditorTool.Write
        editor.writer.tool = EditorWriteTool.Pencil
        menu.update()
      })
      test("should display menu color", () =>
      {
        const m = layer.querySelector("#ms-menu-style-color") as HTMLElement
        expect(m.style.display).toEqual("block")
      })
      test("should not display menu fill", () =>
      {
        const m = layer.querySelector("#ms-menu-style-fill") as HTMLElement
        expect(m.style.display).toEqual("none")
      })
      test("should display menu thickness", () =>
      {
        const m = layer.querySelector("#ms-menu-style-thickness") as HTMLElement
        expect(m.style.display).toEqual("block")
      })
      test("should display menu opacity", () =>
      {
        const m = layer.querySelector("#ms-menu-style-opacity") as HTMLElement
        expect(m.style.display).toEqual("block")
      })
    })

    describe("when tool == write with circle", () =>
    {
      beforeAll(() => {
        editor.tool = EditorTool.Write
        editor.writer.tool = EditorWriteTool.Circle
        menu.update()
      })
      test("should display menu color", () =>
      {
        const m = layer.querySelector("#ms-menu-style-color") as HTMLElement
        expect(m.style.display).toEqual("block")
      })
      test("should display menu fill", () =>
      {
        const m = layer.querySelector("#ms-menu-style-fill") as HTMLElement
        expect(m.style.display).toEqual("block")
      })
      test("should display menu thickness", () =>
      {
        const m = layer.querySelector("#ms-menu-style-thickness") as HTMLElement
        expect(m.style.display).toEqual("block")
      })
      test("should display menu opacity", () =>
      {
        const m = layer.querySelector("#ms-menu-style-opacity") as HTMLElement
        expect(m.style.display).toEqual("block")
      })
    })

    describe("when tool == select", () =>
    {
      beforeAll(() => {
        editor.tool = EditorTool.Select
        menu.update()
      })
      test("should display menu color", () =>
      {
        const m = layer.querySelector("#ms-menu-style-color") as HTMLElement
        expect(m.style.display).toEqual("block")
      })
      test("should not display menu fill", () =>
      {
        const m = layer.querySelector("#ms-menu-style-fill") as HTMLElement
        expect(m.style.display).toEqual("none")
      })
      test("should display menu thickness", () =>
      {
        const m = layer.querySelector("#ms-menu-style-thickness") as HTMLElement
        expect(m.style.display).toEqual("block")
      })
      test("should display menu opacity", () =>
      {
        const m = layer.querySelector("#ms-menu-style-opacity") as HTMLElement
        expect(m.style.display).toEqual("block")
      })
    })

    describe("when tool == select and shape selected", () =>
    {
      beforeAll(() => {
        editor.tool = EditorTool.Select
        const shape = buildOICircle()
        shape.selected = true
        editor.model.addSymbol(shape)
        menu.update()
      })
      test("should display menu color", () =>
      {
        const m = layer.querySelector("#ms-menu-style-color") as HTMLElement
        expect(m.style.display).toEqual("block")
      })
      test("should display menu fill", () =>
      {
        const m = layer.querySelector("#ms-menu-style-fill") as HTMLElement
        expect(m.style.display).toEqual("block")
      })
      test("should display menu thickness", () =>
      {
        const m = layer.querySelector("#ms-menu-style-thickness") as HTMLElement
        expect(m.style.display).toEqual("block")
      })
      test("should display menu opacity", () =>
      {
        const m = layer.querySelector("#ms-menu-style-opacity") as HTMLElement
        expect(m.style.display).toEqual("block")
      })
    })

    describe("when tool == select and shape selected", () =>
    {
      beforeAll(() => {
        editor.tool = EditorTool.Move
        menu.update()
      })
      test("should hide", () =>
      {
        const m = layer.querySelector(".ms-menu") as HTMLElement
        expect(m.style.visibility).toEqual("hidden")
      })
    })
  })

  describe("show/hide", () =>
  {
    const layer = document.createElement("div")
    const editor = new EditorOffscreenMock()
    editor.init()
    const menu = new OIMenuStyle(editor)
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

  describe("destroy", () =>
  {
    const layer = document.createElement("div")
    const editor = new EditorOffscreenMock()
    editor.init()
    const menu = new OIMenuStyle(editor)
    menu.render(layer)
    test("should remove elements", () =>
    {
      expect(layer.childElementCount).toEqual(1)
      expect(menu.wrapper?.childElementCount).toEqual(1)
      menu.destroy()
      expect(layer.childElementCount).toEqual(0)
      expect(menu.wrapper).toBeUndefined()
    })
  })
})
