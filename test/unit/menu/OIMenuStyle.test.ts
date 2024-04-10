import { LeftClickEventFake } from "../__mocks__/PointerEventFake"
import { OIBehaviorsMock } from "../__mocks__/OIBehaviorsMock"
import { buildOICircle, buildOIStroke } from "../helpers"
import { Intention, OIMenuStyle, WriteTool } from "../../../src/iink"

describe("OIMenuStyle.ts", () =>
{
  test("should create", () =>
  {
    const behaviors = new OIBehaviorsMock()
    const menu = new OIMenuStyle(behaviors)
    expect(menu).toBeDefined()
  })

  describe("render", () =>
  {
    const behaviors = new OIBehaviorsMock()
    behaviors.init(behaviors.layerInfos)
    const menu = new OIMenuStyle(behaviors)
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
        expect(list.childElementCount).toEqual(menu.sizes.length)
      })
      test("should render menu thickness", () =>
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
        expect(list.childElementCount).toEqual(menu.sizes.length)
      })
      test("should render menu thickness", () =>
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
    const pointerUpEvt = new LeftClickEventFake("pointerup", {
      pointerType: "pen",
      clientX: 10,
      clientY: 10,
      pressure: 1
    })
    const layer = document.createElement("div")
    const behaviors = new OIBehaviorsMock()

    behaviors.init(behaviors.layerInfos)
    const menu = new OIMenuStyle(behaviors)
    menu.render(layer)

    beforeEach(() =>
    {
      behaviors.model.clear()
    })

    test("should update style color", () =>
    {
      const btn = layer.querySelector("#ms-menu-style-color-808080-btn") as HTMLButtonElement
      btn.dispatchEvent(pointerUpEvt)
      expect(behaviors.setPenStyle).toHaveBeenCalledTimes(1)
      expect(behaviors.setPenStyle).toHaveBeenCalledWith({ color: "#808080" })
    })
    test("should update color of selected symbols", () =>
    {
      const stroke = buildOIStroke()
      stroke.selected = true
      behaviors.model.addSymbol(stroke)
      const btn = layer.querySelector("#ms-menu-style-color-808080-btn") as HTMLButtonElement
      btn.dispatchEvent(pointerUpEvt)
      expect(behaviors.updateSymbolsStyle).toHaveBeenCalledTimes(1)
      expect(behaviors.updateSymbolsStyle).toHaveBeenCalledWith([stroke.id], { color: "#808080" })
    })
    test("should update fill of selected symbols", () =>
    {
      const stroke = buildOIStroke()
      stroke.selected = true
      behaviors.model.addSymbol(stroke)
      const btn = layer.querySelector("#ms-menu-style-fill-ffff00-btn") as HTMLButtonElement
      btn.dispatchEvent(pointerUpEvt)
      expect(behaviors.updateSymbolsStyle).toHaveBeenCalledTimes(1)
      expect(behaviors.updateSymbolsStyle).toHaveBeenCalledWith([stroke.id], { fill: "#ffff00" })
    })
    test("should update style thickness", () =>
    {
      const btn = layer.querySelector("#ms-menu-style-thickness-XL-btn") as HTMLButtonElement
      btn.dispatchEvent(pointerUpEvt)
      expect(behaviors.setPenStyle).toHaveBeenCalledTimes(1)
      expect(behaviors.setPenStyle).toHaveBeenCalledWith({ width: 8 })
    })
    test("should update thickness of selected symbols", () =>
    {
      const stroke = buildOIStroke()
      stroke.selected = true
      behaviors.model.addSymbol(stroke)
      const btn = layer.querySelector("#ms-menu-style-thickness-XL-btn") as HTMLButtonElement
      btn.dispatchEvent(pointerUpEvt)
      expect(behaviors.updateSymbolsStyle).toHaveBeenCalledTimes(1)
      expect(behaviors.updateSymbolsStyle).toHaveBeenCalledWith([stroke.id], { width: 8 })
    })
    test("should update style opacity", () =>
    {
      const input = layer.querySelector("#ms-menu-style-opacity-input") as HTMLInputElement
      input.value = "42"
      //@ts-ignore
      input.dispatchEvent(new Event('input', { target: input }))
      expect(behaviors.setPenStyle).toHaveBeenCalledTimes(1)
      expect(behaviors.setPenStyle).toHaveBeenCalledWith({ opacity: 0.42 })
    })
    test("should update opacity of selected symbols", () =>
    {
      const stroke = buildOIStroke()
      stroke.selected = true
      behaviors.model.addSymbol(stroke)
      const input = layer.querySelector("#ms-menu-style-opacity-input") as HTMLInputElement
      input.value = "42"
      input.dispatchEvent(new Event('input'))
      expect(behaviors.updateSymbolsStyle).toHaveBeenCalledTimes(1)
      expect(behaviors.updateSymbolsStyle).toHaveBeenCalledWith([stroke.id], { opacity: 0.42 })
    })
  })

  describe("update", () =>
  {
    const layer = document.createElement("div")
    const behaviors = new OIBehaviorsMock()
    behaviors.init(behaviors.layerInfos)
    const menu = new OIMenuStyle(behaviors)
    menu.render(layer)

    describe("when intention == write with pencil", () =>
    {
      beforeAll(() => {
        behaviors.intention = Intention.Write
        behaviors.writer.tool = WriteTool.Pencil
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

    describe("when intention == write with circle", () =>
    {
      beforeAll(() => {
        behaviors.intention = Intention.Write
        behaviors.writer.tool = WriteTool.Circle
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

    describe("when intention == select", () =>
    {
      beforeAll(() => {
        behaviors.intention = Intention.Select
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

    describe("when intention == select and shape selected", () =>
    {
      beforeAll(() => {
        behaviors.intention = Intention.Select
        const shape = buildOICircle()
        shape.selected = true
        behaviors.model.addSymbol(shape)
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

    describe("when intention == select and shape selected", () =>
    {
      beforeAll(() => {
        behaviors.intention = Intention.Move
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
    const behaviors = new OIBehaviorsMock()
    behaviors.init(behaviors.layerInfos)
    const menu = new OIMenuStyle(behaviors)
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
    const behaviors = new OIBehaviorsMock()
    behaviors.init(behaviors.layerInfos)
    const menu = new OIMenuStyle(behaviors)
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
