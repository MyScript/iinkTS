import { createCanvasMock, asCanvas } from "../__mocks__/createCanvasMock"
import { LeftClickEventMock } from "../__mocks__/EventMock"
import { CanvasTool, IIMenuTool, CanvasWriteTool } from "@/iink"

describe("IIMenuTool.ts", () => {
  test("should create", () => {
    const canvas = createCanvasMock()
    const menu = new IIMenuTool(asCanvas(canvas))
    expect(menu).toBeDefined()
  })

  describe("render", () => {
    const layer = document.createElement("div")
    const canvas = createCanvasMock()
    const menu = new IIMenuTool(asCanvas(canvas))
    menu.render(layer)
    test("should display menu write pencil", () => {
      expect(layer.querySelector("#ms-menu-tool-write-pencil")).not.toBeNull()
    })
    test("should display menu select", () => {
      expect(layer.querySelector("#ms-menu-tool-select")).not.toBeNull()
    })
    test("should display menu erase", () => {
      expect(layer.querySelector("#ms-menu-tool-erase")).not.toBeNull()
    })
    test("should display menu move", () => {
      expect(layer.querySelector("#ms-menu-tool-move")).not.toBeNull()
    })
    test("should display menu shape", () => {
      expect(layer.querySelector("#ms-menu-tool-write-shape")).not.toBeNull()
    })
  })

  describe("change tool", () => {
    const canvas = createCanvasMock()
    const menu = new IIMenuTool(asCanvas(canvas))
    const clickEvt = new LeftClickEventMock("click", {
      pointerType: "pen",
      clientX: 10,
      clientY: 10,
      pressure: 1,
    })
    menu.render(canvas.layers.ui.root)
    test("should set menu select", () => {
      canvas.tool = CanvasTool.Erase
      const menuEl = canvas.layers.ui.root.querySelector("#ms-menu-tool-select") as HTMLDivElement
      menuEl.dispatchEvent(clickEvt)
      expect(canvas.tool).toEqual(CanvasTool.Select)
    })
    test("should set menu move", () => {
      canvas.tool = CanvasTool.Erase
      const menuEl = canvas.layers.ui.root.querySelector("#ms-menu-tool-move") as HTMLDivElement
      menuEl.dispatchEvent(clickEvt)
      expect(canvas.tool).toEqual(CanvasTool.Move)
    })
    test("should set menu erase", () => {
      canvas.tool = CanvasTool.Write
      const menuEl = canvas.layers.ui.root.querySelector("#ms-menu-tool-erase") as HTMLDivElement
      menuEl.dispatchEvent(clickEvt)
      expect(canvas.tool).toEqual(CanvasTool.Erase)
    })
    test("should set menu write pencil", () => {
      canvas.tool = CanvasTool.Erase
      canvas.writer.tool = CanvasWriteTool.Rectangle
      const menuEl = canvas.layers.ui.root.querySelector("#ms-menu-tool-write-pencil") as HTMLDivElement
      menuEl.dispatchEvent(clickEvt)
      expect(canvas.tool).toEqual(CanvasTool.Write)
      expect(canvas.writer.tool).toEqual(CanvasWriteTool.Pencil)
    })
    test("should display sub menu shape", () => {
      const menuEl = canvas.layers.ui.root.querySelector("#ms-menu-tool-write-shape") as HTMLDivElement
      const subMenuEl1 = canvas.layers.ui.root.querySelector(".sub-menu-content-shape") as HTMLDivElement
      expect(subMenuEl1.classList.contains("open")).toBeFalsy()
      menuEl.dispatchEvent(clickEvt)
      const subMenuEl2 = canvas.layers.ui.root.querySelector(".sub-menu-content-shape") as HTMLDivElement
      expect(subMenuEl2.classList.contains("open")).toBeFalsy()
    })
    test("should set write rectangle", () => {
      canvas.tool = CanvasTool.Erase
      canvas.writer.tool = CanvasWriteTool.Pencil
      const subMenuEl1 = canvas.layers.ui.root.querySelector("#ms-menu-tool-write-shape-rectangle") as HTMLDivElement
      subMenuEl1.dispatchEvent(clickEvt)
      const subMenuEl2 = canvas.layers.ui.root.querySelector("#ms-menu-tool-write-shape-rectangle") as HTMLDivElement
      expect(subMenuEl2.classList.contains("open")).toBeFalsy()

      expect(canvas.tool).toEqual(CanvasTool.Write)
      expect(canvas.writer.tool).toEqual(CanvasWriteTool.Rectangle)
    })
    test("should set write triangle", () => {
      canvas.tool = CanvasTool.Erase
      canvas.writer.tool = CanvasWriteTool.Pencil
      const subMenuEl1 = canvas.layers.ui.root.querySelector("#ms-menu-tool-write-shape-triangle") as HTMLDivElement
      subMenuEl1.dispatchEvent(clickEvt)
      const subMenuEl2 = canvas.layers.ui.root.querySelector("#ms-menu-tool-write-shape-triangle") as HTMLDivElement
      expect(subMenuEl2.classList.contains("open")).toBeFalsy()

      expect(canvas.tool).toEqual(CanvasTool.Write)
      expect(canvas.writer.tool).toEqual(CanvasWriteTool.Triangle)
    })
    test("should set write ellipse", () => {
      canvas.tool = CanvasTool.Erase
      canvas.writer.tool = CanvasWriteTool.Pencil
      const subMenuEl1 = canvas.layers.ui.root.querySelector("#ms-menu-tool-write-shape-ellipse") as HTMLDivElement
      subMenuEl1.dispatchEvent(clickEvt)
      const subMenuEl2 = canvas.layers.ui.root.querySelector("#ms-menu-tool-write-shape-ellipse") as HTMLDivElement
      expect(subMenuEl2.classList.contains("open")).toBeFalsy()

      expect(canvas.tool).toEqual(CanvasTool.Write)
      expect(canvas.writer.tool).toEqual(CanvasWriteTool.Ellipse)
    })
    test("should set write circle", () => {
      canvas.tool = CanvasTool.Erase
      canvas.writer.tool = CanvasWriteTool.Pencil
      const subMenuEl1 = canvas.layers.ui.root.querySelector("#ms-menu-tool-write-shape-circle") as HTMLDivElement
      subMenuEl1.dispatchEvent(clickEvt)
      const subMenuEl2 = canvas.layers.ui.root.querySelector("#ms-menu-tool-write-shape-circle") as HTMLDivElement
      expect(subMenuEl2.classList.contains("open")).toBeFalsy()

      expect(canvas.tool).toEqual(CanvasTool.Write)
      expect(canvas.writer.tool).toEqual(CanvasWriteTool.Circle)
    })
    test("should display sub menu edge", () => {
      const menuEl = canvas.layers.ui.root.querySelector("#ms-menu-tool-write-edge") as HTMLDivElement
      const subMenuEl1 = canvas.layers.ui.root.querySelector(".sub-menu-content-edge") as HTMLDivElement
      expect(subMenuEl1.classList.contains("open")).toBeFalsy()
      menuEl.dispatchEvent(clickEvt)
      const subMenuEl2 = canvas.layers.ui.root.querySelector(".sub-menu-content-edge") as HTMLDivElement
      expect(subMenuEl2.classList.contains("open")).toBeFalsy()
    })
    test("should set write arrow", () => {
      canvas.tool = CanvasTool.Erase
      canvas.writer.tool = CanvasWriteTool.Pencil
      const subMenuEl1 = canvas.layers.ui.root.querySelector("#ms-menu-tool-write-edge-arrow") as HTMLDivElement
      subMenuEl1.dispatchEvent(clickEvt)
      const subMenuEl2 = canvas.layers.ui.root.querySelector("#ms-menu-tool-write-edge-arrow") as HTMLDivElement
      expect(subMenuEl2.classList.contains("open")).toBeFalsy()

      expect(canvas.tool).toEqual(CanvasTool.Write)
      expect(canvas.writer.tool).toEqual(CanvasWriteTool.Arrow)
    })
  })

  describe("update", () => {
    const canvas = createCanvasMock()
    const menu = new IIMenuTool(asCanvas(canvas))
    menu.render(canvas.layers.ui.root)
    test("should set menu select activated", () => {
      expect(canvas.layers.ui.root.querySelector("#ms-menu-tool-select")?.classList.contains("active")).toBe(false)
      canvas.tool = CanvasTool.Select
      menu.update()
      expect(canvas.layers.ui.root.querySelector("#ms-menu-tool-select")?.classList.contains("active")).toBe(true)
    })
    test("should set menu move activated", () => {
      expect(canvas.layers.ui.root.querySelector("#ms-menu-tool-move")?.classList.contains("active")).toBe(false)
      canvas.tool = CanvasTool.Move
      menu.update()
      expect(canvas.layers.ui.root.querySelector("#ms-menu-tool-move")?.classList.contains("active")).toBe(true)
    })
    test("should set menu erase activated", () => {
      expect(canvas.layers.ui.root.querySelector("#ms-menu-tool-erase")?.classList.contains("active")).toBe(false)
      canvas.tool = CanvasTool.Erase
      menu.update()
      expect(canvas.layers.ui.root.querySelector("#ms-menu-tool-erase")?.classList.contains("active")).toBe(true)
    })
    test("should set menu write pencil activated", () => {
      expect(canvas.layers.ui.root.querySelector("#ms-menu-tool-write-pencil")?.classList.contains("active")).toBe(
        false
      )
      canvas.tool = CanvasTool.Write
      canvas.writer.tool = CanvasWriteTool.Pencil
      menu.update()
      expect(canvas.layers.ui.root.querySelector("#ms-menu-tool-write-pencil")?.classList.contains("active")).toBe(true)
    })
    test("should set menu write circle activated", () => {
      canvas.tool = CanvasTool.Select
      menu.update()
      expect(canvas.layers.ui.root.querySelector("#ms-menu-tool-write-shape")?.classList.contains("active")).toBe(false)
      canvas.tool = CanvasTool.Write
      canvas.writer.tool = CanvasWriteTool.Circle
      menu.update()
      expect(canvas.layers.ui.root.querySelector("#ms-menu-tool-write-shape")?.classList.contains("active")).toBe(true)
    })
    test("should set menu write triangle activated", () => {
      canvas.tool = CanvasTool.Select
      menu.update()
      expect(canvas.layers.ui.root.querySelector("#ms-menu-tool-write-shape")?.classList.contains("active")).toBe(false)
      canvas.tool = CanvasTool.Write
      canvas.writer.tool = CanvasWriteTool.Triangle
      menu.update()
      expect(canvas.layers.ui.root.querySelector("#ms-menu-tool-write-shape")?.classList.contains("active")).toBe(true)
    })
    test("should set menu write rectangle activated", () => {
      canvas.tool = CanvasTool.Select
      menu.update()
      expect(canvas.layers.ui.root.querySelector("#ms-menu-tool-write-shape")?.classList.contains("active")).toBe(false)
      canvas.tool = CanvasTool.Write
      canvas.writer.tool = CanvasWriteTool.Rectangle
      menu.update()
      expect(canvas.layers.ui.root.querySelector("#ms-menu-tool-write-shape")?.classList.contains("active")).toBe(true)
    })
    test("should set menu write line activated", () => {
      canvas.tool = CanvasTool.Select
      menu.update()
      expect(canvas.layers.ui.root.querySelector("#ms-menu-tool-write-edge")?.classList.contains("active")).toBe(false)
      canvas.tool = CanvasTool.Write
      canvas.writer.tool = CanvasWriteTool.Line
      menu.update()
      expect(canvas.layers.ui.root.querySelector("#ms-menu-tool-write-edge")?.classList.contains("active")).toBe(true)
    })
    test("should set menu write arrow activated", () => {
      canvas.tool = CanvasTool.Select
      menu.update()
      expect(canvas.layers.ui.root.querySelector("#ms-menu-tool-write-edge")?.classList.contains("active")).toBe(false)
      canvas.tool = CanvasTool.Write
      canvas.writer.tool = CanvasWriteTool.Arrow
      menu.update()
      expect(canvas.layers.ui.root.querySelector("#ms-menu-tool-write-edge")?.classList.contains("active")).toBe(true)
    })
    test("should set menu write doubleArrow activated", () => {
      canvas.tool = CanvasTool.Select
      menu.update()
      expect(canvas.layers.ui.root.querySelector("#ms-menu-tool-write-edge")?.classList.contains("active")).toBe(false)
      canvas.tool = CanvasTool.Write
      canvas.writer.tool = CanvasWriteTool.DoubleArrow
      menu.update()
      expect(canvas.layers.ui.root.querySelector("#ms-menu-tool-write-edge")?.classList.contains("active")).toBe(true)
    })
  })

  describe("show/hide", () => {
    const canvas = createCanvasMock()
    const menu = new IIMenuTool(asCanvas(canvas))
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

  describe("destroy", () => {
    const canvas = createCanvasMock()
    const menu = new IIMenuTool(asCanvas(canvas))
    menu.render(canvas.layers.ui.root)
    test("should remove elements", () => {
      expect(menu.wrapper?.childElementCount).toEqual(6)
      menu.destroy()
      expect(menu.wrapper).toBeUndefined()
    })
  })
})
