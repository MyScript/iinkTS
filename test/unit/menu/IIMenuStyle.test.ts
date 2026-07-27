import { LeftClickEventMock } from "../__mocks__/EventMock"
import { createCanvasMock, asCanvas } from "../__mocks__/createCanvasMock"
import { buildIICircle, buildIIStroke } from "../helpers"
import { CanvasTool, IIMenuStyle, CanvasWriteTool } from "@/iink"

describe("IIMenuStyle.ts", () => {
  test("should create", () => {
    const canvas = createCanvasMock()
    const menu = new IIMenuStyle(asCanvas(canvas))
    expect(menu).toBeDefined()
  })

  describe("render", () => {
    const canvas = createCanvasMock()
    const menu = new IIMenuStyle(asCanvas(canvas))
    describe("isMobile", () => {
      const layer = document.createElement("div")
      beforeAll(() => {
        Object.defineProperty(HTMLElement.prototype, "clientWidth", { configurable: true, value: 500 })
        menu.render(layer)
      })
      test("should isMobile to be true", () => {
        expect(menu.isMobile).toBe(true)
      })
      test("should render menu stroke color", () => {
        const menuColor = layer.querySelector("#ms-menu-style-color") as HTMLElement
        expect(menuColor).not.toBeNull()
        expect(menuColor.style.display).toEqual("block")
        const list = menuColor.querySelector("#ms-menu-style-color-list") as HTMLElement
        expect(list.childElementCount).toEqual(menu.config.colors.length)
      })
      test("should render menu fill color and not display", () => {
        const menuFill = layer.querySelector("#ms-menu-style-fill") as HTMLElement
        expect(menuFill).not.toBeNull()
        expect(menuFill.style.display).toEqual("none")
        const list = menuFill.querySelector("#ms-menu-style-fill-list") as HTMLElement
        expect(list.childElementCount).toEqual(menu.config.colors.length)
      })
      test("should render menu thickness", () => {
        const menuThickness = layer.querySelector("#ms-menu-style-thickness") as HTMLElement
        expect(menuThickness).not.toBeNull()
        expect(menuThickness.style.display).toEqual("block")
        const buttons = menuThickness.querySelectorAll("button")
        expect(buttons.length).toEqual(menu.config.thicknessList.length)
      })
      test("should render menu font-size", () => {
        const menuFontSize = layer.querySelector("#ms-menu-style-font-size") as HTMLElement
        expect(menuFontSize).not.toBeNull()
        expect(menuFontSize.style.display).toEqual("block")
        const buttons = menuFontSize.querySelectorAll("button")
        expect(buttons.length).toEqual(menu.config.fontSizeList.length)
      })
      test("should render menu opacity", () => {
        const menuOpacity = layer.querySelector("#ms-menu-style-opacity") as HTMLElement
        expect(menuOpacity).not.toBeNull()
        expect(menuOpacity.style.display).toEqual("block")
        const input = menuOpacity.querySelector("#ms-menu-style-opacity-input") as HTMLElement
        expect(input.getAttribute("type")).toEqual("range")
      })
    })
    describe("desktop", () => {
      const layer = document.createElement("div")
      beforeAll(() => {
        Object.defineProperty(HTMLElement.prototype, "clientWidth", { configurable: true, value: 700 })
        menu.render(layer)
      })
      test("should isMobile to be false", () => {
        expect(menu.isMobile).toBe(false)
      })
      test("should render ms-menu-style and not display", () => {
        const btn = layer.querySelector("#ms-menu-style") as HTMLButtonElement
        expect(btn.parentElement?.style.display).toEqual("none")
      })
      test("should render menu stroke color", () => {
        const menuColor = layer.querySelector("#ms-menu-style-color") as HTMLElement
        expect(menuColor).not.toBeNull()
        expect(menuColor.style.display).toEqual("block")
        const list = menuColor.querySelector("#ms-menu-style-color-list") as HTMLElement
        expect(list.childElementCount).toEqual(menu.config.colors.length)
      })
      test("should render menu fill color and not display", () => {
        const menuFill = layer.querySelector("#ms-menu-style-fill") as HTMLElement
        expect(menuFill).not.toBeNull()
        expect(menuFill.style.display).toEqual("none")
        const list = menuFill.querySelector("#ms-menu-style-fill-list") as HTMLElement
        expect(list.childElementCount).toEqual(menu.config.colors.length)
      })
      test("should render menu thickness", () => {
        const menuThickness = layer.querySelector("#ms-menu-style-thickness") as HTMLElement
        expect(menuThickness).not.toBeNull()
        expect(menuThickness.style.display).toEqual("block")
        const buttons = menuThickness.querySelectorAll("button")
        expect(buttons.length).toEqual(menu.config.thicknessList.length)
      })
      test("should render menu font-size", () => {
        const menuFontSize = layer.querySelector("#ms-menu-style-font-size") as HTMLElement
        expect(menuFontSize).not.toBeNull()
        expect(menuFontSize.style.display).toEqual("block")
        const buttons = menuFontSize.querySelectorAll("button")
        expect(buttons.length).toEqual(menu.config.fontSizeList.length)
      })
      test("should render menu opacity", () => {
        const menuOpacity = layer.querySelector("#ms-menu-style-opacity") as HTMLElement
        expect(menuOpacity).not.toBeNull()
        expect(menuOpacity.style.display).toEqual("block")
        const input = menuOpacity.querySelector("#ms-menu-style-opacity-input") as HTMLElement
        expect(input.getAttribute("type")).toEqual("range")
      })
    })
  })

  describe("update style", () => {
    const pointerUpEvt = new LeftClickEventMock("pointerup", {
      pointerType: "pen",
      clientX: 10,
      clientY: 10,
      pressure: 1,
    })
    const clickEvt = new LeftClickEventMock("click", {
      pointerType: "pen",
      clientX: 10,
      clientY: 10,
      pressure: 1,
    })
    const layer = document.createElement("div")
    const canvas = createCanvasMock()
    canvas.selector.drawSelectedGroup = jest.fn()
    canvas.selector.redrawSelectedGroup = jest.fn()

    const menu = new IIMenuStyle(asCanvas(canvas))
    menu.render(layer)

    beforeEach(() => {
      canvas.model.clear()
    })

    test("should update style color", () => {
      const btn = layer.querySelector("#ms-menu-style-color-list-808080") as HTMLButtonElement
      btn.dispatchEvent(clickEvt)
      expect(canvas.penStyle.color).toEqual("#808080")
    })
    test("should update color of selected symbols", () => {
      const stroke = buildIIStroke()
      canvas.model.addSymbol(stroke)
      canvas.model.selectedIds.add(stroke.id)
      const btn = layer.querySelector("#ms-menu-style-color-list-808080") as HTMLButtonElement
      btn.dispatchEvent(clickEvt)
      expect(canvas.updateSymbolsStyle).toHaveBeenCalledTimes(1)
      expect(canvas.updateSymbolsStyle).toHaveBeenCalledWith([stroke.id], { color: "#808080" })
    })
    test("should update fill of selected symbols", () => {
      const stroke = buildIIStroke()
      canvas.model.addSymbol(stroke)
      canvas.model.selectedIds.add(stroke.id)
      const btn = layer.querySelector("#ms-menu-style-fill-list-ffff00") as HTMLButtonElement
      btn.dispatchEvent(clickEvt)
      expect(canvas.updateSymbolsStyle).toHaveBeenCalledTimes(1)
      expect(canvas.updateSymbolsStyle).toHaveBeenCalledWith([stroke.id], { fill: "#ffff00" })
    })
    test("should update style thickness", () => {
      const btn = layer.querySelector("#ms-menu-style-thickness-8") as HTMLButtonElement
      btn.dispatchEvent(pointerUpEvt)
      expect(canvas.penStyle.width).toEqual(8)
    })
    test("should update thickness of selected symbols", () => {
      const stroke = buildIIStroke()
      canvas.model.addSymbol(stroke)
      canvas.model.selectedIds.add(stroke.id)
      const btn = layer.querySelector("#ms-menu-style-thickness-8") as HTMLButtonElement
      btn.dispatchEvent(pointerUpEvt)
      expect(canvas.updateSymbolsStyle).toHaveBeenCalledTimes(1)
      expect(canvas.updateSymbolsStyle).toHaveBeenCalledWith([stroke.id], { width: 8 })
      expect(canvas.selector.redrawSelectedGroup).toHaveBeenNthCalledWith(1)
    })
    test("should update style opacity", () => {
      const input = layer.querySelector("#ms-menu-style-opacity-input") as HTMLInputElement
      input.value = "42"
      //@ts-ignore
      input.dispatchEvent(new Event("input", { target: input }))
      expect(canvas.penStyle.opacity).toEqual(0.42)
    })
    test("should update opacity of selected symbols", () => {
      const stroke = buildIIStroke()
      canvas.model.addSymbol(stroke)
      canvas.model.selectedIds.add(stroke.id)
      const input = layer.querySelector("#ms-menu-style-opacity-input") as HTMLInputElement
      input.value = "42"
      input.dispatchEvent(new Event("input"))
      expect(canvas.updateSymbolsStyle).toHaveBeenCalledTimes(1)
      expect(canvas.updateSymbolsStyle).toHaveBeenCalledWith([stroke.id], { opacity: 0.42 })
    })
  })

  describe("update", () => {
    const layer = document.createElement("div")
    const canvas = createCanvasMock()
    const menu = new IIMenuStyle(asCanvas(canvas))
    menu.render(layer)

    describe("when tool == write with pencil", () => {
      beforeAll(() => {
        canvas.tool = CanvasTool.Write
        canvas.writer.tool = CanvasWriteTool.Pencil
        menu.update()
      })
      test("should display menu color", () => {
        const m = layer.querySelector("#ms-menu-style-color") as HTMLElement
        expect(m.style.display).toEqual("block")
      })
      test("should not display menu fill", () => {
        const m = layer.querySelector("#ms-menu-style-fill") as HTMLElement
        expect(m.style.display).toEqual("none")
      })
      test("should display menu thickness", () => {
        const m = layer.querySelector("#ms-menu-style-thickness") as HTMLElement
        expect(m.style.display).toEqual("block")
      })
      test("should display menu opacity", () => {
        const m = layer.querySelector("#ms-menu-style-opacity") as HTMLElement
        expect(m.style.display).toEqual("block")
      })
    })

    describe("when tool == write with circle", () => {
      beforeAll(() => {
        canvas.tool = CanvasTool.Write
        canvas.writer.tool = CanvasWriteTool.Circle
        menu.update()
      })
      test("should display menu color", () => {
        const m = layer.querySelector("#ms-menu-style-color") as HTMLElement
        expect(m.style.display).toEqual("block")
      })
      test("should display menu fill", () => {
        const m = layer.querySelector("#ms-menu-style-fill") as HTMLElement
        expect(m.style.display).toEqual("block")
      })
      test("should display menu thickness", () => {
        const m = layer.querySelector("#ms-menu-style-thickness") as HTMLElement
        expect(m.style.display).toEqual("block")
      })
      test("should display menu opacity", () => {
        const m = layer.querySelector("#ms-menu-style-opacity") as HTMLElement
        expect(m.style.display).toEqual("block")
      })
    })

    describe("when tool == select", () => {
      beforeAll(() => {
        canvas.tool = CanvasTool.Select
        menu.update()
      })
      test("should display menu color", () => {
        const m = layer.querySelector("#ms-menu-style-color") as HTMLElement
        expect(m.style.display).toEqual("block")
      })
      test("should not display menu fill", () => {
        const m = layer.querySelector("#ms-menu-style-fill") as HTMLElement
        expect(m.style.display).toEqual("none")
      })
      test("should display menu thickness", () => {
        const m = layer.querySelector("#ms-menu-style-thickness") as HTMLElement
        expect(m.style.display).toEqual("block")
      })
      test("should display menu opacity", () => {
        const m = layer.querySelector("#ms-menu-style-opacity") as HTMLElement
        expect(m.style.display).toEqual("block")
      })
    })

    describe("when tool == select and shape selected", () => {
      beforeAll(() => {
        canvas.tool = CanvasTool.Select
        const shape = buildIICircle()
        canvas.model.addSymbol(shape)
        canvas.model.selectedIds.add(shape.id)
        menu.update()
      })
      test("should display menu color", () => {
        const m = layer.querySelector("#ms-menu-style-color") as HTMLElement
        expect(m.style.display).toEqual("block")
      })
      test("should display menu fill", () => {
        const m = layer.querySelector("#ms-menu-style-fill") as HTMLElement
        expect(m.style.display).toEqual("block")
      })
      test("should display menu thickness", () => {
        const m = layer.querySelector("#ms-menu-style-thickness") as HTMLElement
        expect(m.style.display).toEqual("block")
      })
      test("should display menu opacity", () => {
        const m = layer.querySelector("#ms-menu-style-opacity") as HTMLElement
        expect(m.style.display).toEqual("block")
      })
    })

    describe("when tool == select and shape selected", () => {
      beforeAll(() => {
        canvas.tool = CanvasTool.Move
        menu.update()
      })
      test("should hide", () => {
        const m = layer.querySelector(".ms-menu") as HTMLElement
        expect(m.style.visibility).toEqual("hidden")
      })
    })
  })

  describe("show/hide", () => {
    const layer = document.createElement("div")
    const canvas = createCanvasMock()
    const menu = new IIMenuStyle(asCanvas(canvas))
    menu.render(layer)
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

  describe("destroy", () => {
    const layer = document.createElement("div")
    const canvas = createCanvasMock()
    const menu = new IIMenuStyle(asCanvas(canvas))
    menu.render(layer)
    test("should remove elements", () => {
      expect(layer.childElementCount).toEqual(1)
      expect(menu.wrapper?.childElementCount).toEqual(1)
      menu.destroy()
      expect(layer.childElementCount).toEqual(0)
      expect(menu.wrapper).toBeUndefined()
    })
  })
})
