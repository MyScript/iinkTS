import { createCanvasMock, asEditor } from "../__mocks__/createCanvasMock"
import { LeftClickEventMock } from "../__mocks__/EventMock"
import { CanvasTool, IIMenuTool, CanvasWriteTool } from "@/iink"

describe("IIMenuTool.ts", () => {
  test("should create", () => {
    const editor = createCanvasMock()
    const menu = new IIMenuTool(asEditor(editor))
    expect(menu).toBeDefined()
  })

  describe("render", () => {
    const layer = document.createElement("div")
    const editor = createCanvasMock()
    const menu = new IIMenuTool(asEditor(editor))
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
    const editor = createCanvasMock()
    const menu = new IIMenuTool(asEditor(editor))
    const clickEvt = new LeftClickEventMock("click", {
      pointerType: "pen",
      clientX: 10,
      clientY: 10,
      pressure: 1,
    })
    menu.render(editor.layers.ui.root)
    test("should set menu select", () => {
      editor.tool = CanvasTool.Erase
      const menuEl = editor.layers.ui.root.querySelector("#ms-menu-tool-select") as HTMLDivElement
      menuEl.dispatchEvent(clickEvt)
      expect(editor.tool).toEqual(CanvasTool.Select)
    })
    test("should set menu move", () => {
      editor.tool = CanvasTool.Erase
      const menuEl = editor.layers.ui.root.querySelector("#ms-menu-tool-move") as HTMLDivElement
      menuEl.dispatchEvent(clickEvt)
      expect(editor.tool).toEqual(CanvasTool.Move)
    })
    test("should set menu erase", () => {
      editor.tool = CanvasTool.Write
      const menuEl = editor.layers.ui.root.querySelector("#ms-menu-tool-erase") as HTMLDivElement
      menuEl.dispatchEvent(clickEvt)
      expect(editor.tool).toEqual(CanvasTool.Erase)
    })
    test("should set menu write pencil", () => {
      editor.tool = CanvasTool.Erase
      editor.writer.tool = CanvasWriteTool.Rectangle
      const menuEl = editor.layers.ui.root.querySelector("#ms-menu-tool-write-pencil") as HTMLDivElement
      menuEl.dispatchEvent(clickEvt)
      expect(editor.tool).toEqual(CanvasTool.Write)
      expect(editor.writer.tool).toEqual(CanvasWriteTool.Pencil)
    })
    test("should display sub menu shape", () => {
      const menuEl = editor.layers.ui.root.querySelector("#ms-menu-tool-write-shape") as HTMLDivElement
      const subMenuEl1 = editor.layers.ui.root.querySelector(".sub-menu-content-shape") as HTMLDivElement
      expect(subMenuEl1.classList.contains("open")).toBeFalsy()
      menuEl.dispatchEvent(clickEvt)
      const subMenuEl2 = editor.layers.ui.root.querySelector(".sub-menu-content-shape") as HTMLDivElement
      expect(subMenuEl2.classList.contains("open")).toBeFalsy()
    })
    test("should set write rectangle", () => {
      editor.tool = CanvasTool.Erase
      editor.writer.tool = CanvasWriteTool.Pencil
      const subMenuEl1 = editor.layers.ui.root.querySelector("#ms-menu-tool-write-shape-rectangle") as HTMLDivElement
      subMenuEl1.dispatchEvent(clickEvt)
      const subMenuEl2 = editor.layers.ui.root.querySelector("#ms-menu-tool-write-shape-rectangle") as HTMLDivElement
      expect(subMenuEl2.classList.contains("open")).toBeFalsy()

      expect(editor.tool).toEqual(CanvasTool.Write)
      expect(editor.writer.tool).toEqual(CanvasWriteTool.Rectangle)
    })
    test("should set write triangle", () => {
      editor.tool = CanvasTool.Erase
      editor.writer.tool = CanvasWriteTool.Pencil
      const subMenuEl1 = editor.layers.ui.root.querySelector("#ms-menu-tool-write-shape-triangle") as HTMLDivElement
      subMenuEl1.dispatchEvent(clickEvt)
      const subMenuEl2 = editor.layers.ui.root.querySelector("#ms-menu-tool-write-shape-triangle") as HTMLDivElement
      expect(subMenuEl2.classList.contains("open")).toBeFalsy()

      expect(editor.tool).toEqual(CanvasTool.Write)
      expect(editor.writer.tool).toEqual(CanvasWriteTool.Triangle)
    })
    test("should set write ellipse", () => {
      editor.tool = CanvasTool.Erase
      editor.writer.tool = CanvasWriteTool.Pencil
      const subMenuEl1 = editor.layers.ui.root.querySelector("#ms-menu-tool-write-shape-ellipse") as HTMLDivElement
      subMenuEl1.dispatchEvent(clickEvt)
      const subMenuEl2 = editor.layers.ui.root.querySelector("#ms-menu-tool-write-shape-ellipse") as HTMLDivElement
      expect(subMenuEl2.classList.contains("open")).toBeFalsy()

      expect(editor.tool).toEqual(CanvasTool.Write)
      expect(editor.writer.tool).toEqual(CanvasWriteTool.Ellipse)
    })
    test("should set write circle", () => {
      editor.tool = CanvasTool.Erase
      editor.writer.tool = CanvasWriteTool.Pencil
      const subMenuEl1 = editor.layers.ui.root.querySelector("#ms-menu-tool-write-shape-circle") as HTMLDivElement
      subMenuEl1.dispatchEvent(clickEvt)
      const subMenuEl2 = editor.layers.ui.root.querySelector("#ms-menu-tool-write-shape-circle") as HTMLDivElement
      expect(subMenuEl2.classList.contains("open")).toBeFalsy()

      expect(editor.tool).toEqual(CanvasTool.Write)
      expect(editor.writer.tool).toEqual(CanvasWriteTool.Circle)
    })
    test("should display sub menu edge", () => {
      const menuEl = editor.layers.ui.root.querySelector("#ms-menu-tool-write-edge") as HTMLDivElement
      const subMenuEl1 = editor.layers.ui.root.querySelector(".sub-menu-content-edge") as HTMLDivElement
      expect(subMenuEl1.classList.contains("open")).toBeFalsy()
      menuEl.dispatchEvent(clickEvt)
      const subMenuEl2 = editor.layers.ui.root.querySelector(".sub-menu-content-edge") as HTMLDivElement
      expect(subMenuEl2.classList.contains("open")).toBeFalsy()
    })
    test("should set write arrow", () => {
      editor.tool = CanvasTool.Erase
      editor.writer.tool = CanvasWriteTool.Pencil
      const subMenuEl1 = editor.layers.ui.root.querySelector("#ms-menu-tool-write-edge-arrow") as HTMLDivElement
      subMenuEl1.dispatchEvent(clickEvt)
      const subMenuEl2 = editor.layers.ui.root.querySelector("#ms-menu-tool-write-edge-arrow") as HTMLDivElement
      expect(subMenuEl2.classList.contains("open")).toBeFalsy()

      expect(editor.tool).toEqual(CanvasTool.Write)
      expect(editor.writer.tool).toEqual(CanvasWriteTool.Arrow)
    })
  })

  describe("update", () => {
    const editor = createCanvasMock()
    const menu = new IIMenuTool(asEditor(editor))
    menu.render(editor.layers.ui.root)
    test("should set menu select activated", () => {
      expect(editor.layers.ui.root.querySelector("#ms-menu-tool-select")?.classList.contains("active")).toBe(false)
      editor.tool = CanvasTool.Select
      menu.update()
      expect(editor.layers.ui.root.querySelector("#ms-menu-tool-select")?.classList.contains("active")).toBe(true)
    })
    test("should set menu move activated", () => {
      expect(editor.layers.ui.root.querySelector("#ms-menu-tool-move")?.classList.contains("active")).toBe(false)
      editor.tool = CanvasTool.Move
      menu.update()
      expect(editor.layers.ui.root.querySelector("#ms-menu-tool-move")?.classList.contains("active")).toBe(true)
    })
    test("should set menu erase activated", () => {
      expect(editor.layers.ui.root.querySelector("#ms-menu-tool-erase")?.classList.contains("active")).toBe(false)
      editor.tool = CanvasTool.Erase
      menu.update()
      expect(editor.layers.ui.root.querySelector("#ms-menu-tool-erase")?.classList.contains("active")).toBe(true)
    })
    test("should set menu write pencil activated", () => {
      expect(editor.layers.ui.root.querySelector("#ms-menu-tool-write-pencil")?.classList.contains("active")).toBe(
        false
      )
      editor.tool = CanvasTool.Write
      editor.writer.tool = CanvasWriteTool.Pencil
      menu.update()
      expect(editor.layers.ui.root.querySelector("#ms-menu-tool-write-pencil")?.classList.contains("active")).toBe(true)
    })
    test("should set menu write circle activated", () => {
      editor.tool = CanvasTool.Select
      menu.update()
      expect(editor.layers.ui.root.querySelector("#ms-menu-tool-write-shape")?.classList.contains("active")).toBe(false)
      editor.tool = CanvasTool.Write
      editor.writer.tool = CanvasWriteTool.Circle
      menu.update()
      expect(editor.layers.ui.root.querySelector("#ms-menu-tool-write-shape")?.classList.contains("active")).toBe(true)
    })
    test("should set menu write triangle activated", () => {
      editor.tool = CanvasTool.Select
      menu.update()
      expect(editor.layers.ui.root.querySelector("#ms-menu-tool-write-shape")?.classList.contains("active")).toBe(false)
      editor.tool = CanvasTool.Write
      editor.writer.tool = CanvasWriteTool.Triangle
      menu.update()
      expect(editor.layers.ui.root.querySelector("#ms-menu-tool-write-shape")?.classList.contains("active")).toBe(true)
    })
    test("should set menu write rectangle activated", () => {
      editor.tool = CanvasTool.Select
      menu.update()
      expect(editor.layers.ui.root.querySelector("#ms-menu-tool-write-shape")?.classList.contains("active")).toBe(false)
      editor.tool = CanvasTool.Write
      editor.writer.tool = CanvasWriteTool.Rectangle
      menu.update()
      expect(editor.layers.ui.root.querySelector("#ms-menu-tool-write-shape")?.classList.contains("active")).toBe(true)
    })
    test("should set menu write line activated", () => {
      editor.tool = CanvasTool.Select
      menu.update()
      expect(editor.layers.ui.root.querySelector("#ms-menu-tool-write-edge")?.classList.contains("active")).toBe(false)
      editor.tool = CanvasTool.Write
      editor.writer.tool = CanvasWriteTool.Line
      menu.update()
      expect(editor.layers.ui.root.querySelector("#ms-menu-tool-write-edge")?.classList.contains("active")).toBe(true)
    })
    test("should set menu write arrow activated", () => {
      editor.tool = CanvasTool.Select
      menu.update()
      expect(editor.layers.ui.root.querySelector("#ms-menu-tool-write-edge")?.classList.contains("active")).toBe(false)
      editor.tool = CanvasTool.Write
      editor.writer.tool = CanvasWriteTool.Arrow
      menu.update()
      expect(editor.layers.ui.root.querySelector("#ms-menu-tool-write-edge")?.classList.contains("active")).toBe(true)
    })
    test("should set menu write doubleArrow activated", () => {
      editor.tool = CanvasTool.Select
      menu.update()
      expect(editor.layers.ui.root.querySelector("#ms-menu-tool-write-edge")?.classList.contains("active")).toBe(false)
      editor.tool = CanvasTool.Write
      editor.writer.tool = CanvasWriteTool.DoubleArrow
      menu.update()
      expect(editor.layers.ui.root.querySelector("#ms-menu-tool-write-edge")?.classList.contains("active")).toBe(true)
    })
  })

  describe("show/hide", () => {
    const editor = createCanvasMock()
    const menu = new IIMenuTool(asEditor(editor))
    menu.render(editor.layers.ui.root)
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
    const editor = createCanvasMock()
    const menu = new IIMenuTool(asEditor(editor))
    menu.render(editor.layers.ui.root)
    test("should remove elements", () => {
      expect(menu.wrapper?.childElementCount).toEqual(6)
      menu.destroy()
      expect(menu.wrapper).toBeUndefined()
    })
  })
})
