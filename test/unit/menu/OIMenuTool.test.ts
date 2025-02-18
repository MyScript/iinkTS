import { InteractiveInkEditorMock } from "../__mocks__/InteractiveInkEditorMock"
import { LeftClickEventMock } from "../__mocks__/EventMock"
import { EditorTool, IIMenuTool, EditorWriteTool } from "../../../src/iink"

describe("IIMenuTool.ts", () =>
{
  test("should create", () =>
  {
    const editor = new InteractiveInkEditorMock()
    const menu = new IIMenuTool(editor)
    expect(menu).toBeDefined()
  })

  describe("render", () =>
  {
    const layer = document.createElement("div")
    const editor = new InteractiveInkEditorMock()
    const menu = new IIMenuTool(editor)
    menu.render(layer)
    test("should display menu write pencil", () =>
    {
      expect(layer.querySelector("#ms-menu-tool-write-pencil")).not.toBeNull()
    })
    test("should display menu select", () =>
    {
      expect(layer.querySelector("#ms-menu-tool-select")).not.toBeNull()
    })
    test("should display menu erase", () =>
    {
      expect(layer.querySelector("#ms-menu-tool-erase")).not.toBeNull()
    })
    test("should display menu move", () =>
    {
      expect(layer.querySelector("#ms-menu-tool-move")).not.toBeNull()
    })
    test("should display menu shape", () =>
    {
      expect(layer.querySelector("#ms-menu-tool-write-shape")).not.toBeNull()
    })
  })

  describe("change tool", () =>
  {
    const editor = new InteractiveInkEditorMock()
    editor.init()
    const menu = new IIMenuTool(editor)
    const pointerUpEvt = new LeftClickEventMock("pointerup", {
      pointerType: "pen",
      clientX: 10,
      clientY: 10,
      pressure: 1
    })
    menu.render(editor.layers.ui.root)
    test("should set menu select", () =>
    {
      editor.tool = EditorTool.Erase
      const menuEl = editor.layers.ui.root.querySelector("#ms-menu-tool-select") as HTMLDivElement
      menuEl.dispatchEvent(pointerUpEvt)
      expect(editor.tool).toEqual(EditorTool.Select)
    })
    test("should set menu move", () =>
    {
      editor.tool = EditorTool.Erase
      const menuEl = editor.layers.ui.root.querySelector("#ms-menu-tool-move") as HTMLDivElement
      menuEl.dispatchEvent(pointerUpEvt)
      expect(editor.tool).toEqual(EditorTool.Move)
    })
    test("should set menu erase", () =>
    {
      editor.tool = EditorTool.Write
      const menuEl = editor.layers.ui.root.querySelector("#ms-menu-tool-erase") as HTMLDivElement
      menuEl.dispatchEvent(pointerUpEvt)
      expect(editor.tool).toEqual(EditorTool.Erase)
    })
    test("should set menu write pencil", () =>
    {
      editor.tool = EditorTool.Erase
      editor.writer.tool = EditorWriteTool.Rectangle
      const menuEl = editor.layers.ui.root.querySelector("#ms-menu-tool-write-pencil") as HTMLDivElement
      menuEl.dispatchEvent(pointerUpEvt)
      expect(editor.tool).toEqual(EditorTool.Write)
      expect(editor.writer.tool).toEqual(EditorWriteTool.Pencil)
    })
    test("should display sub menu shape", () =>
    {
      const menuEl = editor.layers.ui.root.querySelector("#ms-menu-tool-write-shape") as HTMLDivElement
      const subMenuEl1 = editor.layers.ui.root.querySelector(".sub-menu-content-shape") as HTMLDivElement
      expect(subMenuEl1.classList.contains("open")).toBeFalsy()
      menuEl.dispatchEvent(pointerUpEvt)
      const subMenuEl2 = editor.layers.ui.root.querySelector(".sub-menu-content-shape") as HTMLDivElement
      expect(subMenuEl2.classList.contains("open")).toBeFalsy()
    })
    test("should set write rectangle", () =>
    {
      editor.tool = EditorTool.Erase
      editor.writer.tool = EditorWriteTool.Pencil
      const subMenuEl1 = editor.layers.ui.root.querySelector("#ms-menu-tool-write-shape-rectangle") as HTMLDivElement
      subMenuEl1.dispatchEvent(pointerUpEvt)
      const subMenuEl2 = editor.layers.ui.root.querySelector("#ms-menu-tool-write-shape-rectangle") as HTMLDivElement
      expect(subMenuEl2.classList.contains("open")).toBeFalsy()

      expect(editor.tool).toEqual(EditorTool.Write)
      expect(editor.writer.tool).toEqual(EditorWriteTool.Rectangle)
    })
    test("should set write triangle", () =>
    {
      editor.tool = EditorTool.Erase
      editor.writer.tool = EditorWriteTool.Pencil
      const subMenuEl1 = editor.layers.ui.root.querySelector("#ms-menu-tool-write-shape-triangle") as HTMLDivElement
      subMenuEl1.dispatchEvent(pointerUpEvt)
      const subMenuEl2 = editor.layers.ui.root.querySelector("#ms-menu-tool-write-shape-triangle") as HTMLDivElement
      expect(subMenuEl2.classList.contains("open")).toBeFalsy()

      expect(editor.tool).toEqual(EditorTool.Write)
      expect(editor.writer.tool).toEqual(EditorWriteTool.Triangle)
    })
    test("should set write ellipse", () =>
    {
      editor.tool = EditorTool.Erase
      editor.writer.tool = EditorWriteTool.Pencil
      const subMenuEl1 = editor.layers.ui.root.querySelector("#ms-menu-tool-write-shape-ellipse") as HTMLDivElement
      subMenuEl1.dispatchEvent(pointerUpEvt)
      const subMenuEl2 = editor.layers.ui.root.querySelector("#ms-menu-tool-write-shape-ellipse") as HTMLDivElement
      expect(subMenuEl2.classList.contains("open")).toBeFalsy()

      expect(editor.tool).toEqual(EditorTool.Write)
      expect(editor.writer.tool).toEqual(EditorWriteTool.Ellipse)
    })
    test("should set write circle", () =>
    {
      editor.tool = EditorTool.Erase
      editor.writer.tool = EditorWriteTool.Pencil
      const subMenuEl1 = editor.layers.ui.root.querySelector("#ms-menu-tool-write-shape-circle") as HTMLDivElement
      subMenuEl1.dispatchEvent(pointerUpEvt)
      const subMenuEl2 = editor.layers.ui.root.querySelector("#ms-menu-tool-write-shape-circle") as HTMLDivElement
      expect(subMenuEl2.classList.contains("open")).toBeFalsy()

      expect(editor.tool).toEqual(EditorTool.Write)
      expect(editor.writer.tool).toEqual(EditorWriteTool.Circle)
    })
    test("should display sub menu edge", () =>
    {
      const menuEl = editor.layers.ui.root.querySelector("#ms-menu-tool-write-edge") as HTMLDivElement
      const subMenuEl1 = editor.layers.ui.root.querySelector(".sub-menu-content-edge") as HTMLDivElement
      expect(subMenuEl1.classList.contains("open")).toBeFalsy()
      menuEl.dispatchEvent(pointerUpEvt)
      const subMenuEl2 = editor.layers.ui.root.querySelector(".sub-menu-content-edge") as HTMLDivElement
      expect(subMenuEl2.classList.contains("open")).toBeFalsy()
    })
    test("should set write arrow", () =>
    {
      editor.tool = EditorTool.Erase
      editor.writer.tool = EditorWriteTool.Pencil
      const subMenuEl1 = editor.layers.ui.root.querySelector("#ms-menu-tool-write-edge-arrow") as HTMLDivElement
      subMenuEl1.dispatchEvent(pointerUpEvt)
      const subMenuEl2 = editor.layers.ui.root.querySelector("#ms-menu-tool-write-edge-arrow") as HTMLDivElement
      expect(subMenuEl2.classList.contains("open")).toBeFalsy()

      expect(editor.tool).toEqual(EditorTool.Write)
      expect(editor.writer.tool).toEqual(EditorWriteTool.Arrow)
    })
  })

  describe("update", () =>
  {
    const editor = new InteractiveInkEditorMock()
    editor.init()
    const menu = new IIMenuTool(editor)
    menu.render(editor.layers.ui.root)
    test("should set menu select activated", () =>
    {
      expect(editor.layers.ui.root.querySelector("#ms-menu-tool-select")?.classList.contains("active")).toBe(false)
      editor.tool = EditorTool.Select
      menu.update()
      expect(editor.layers.ui.root.querySelector("#ms-menu-tool-select")?.classList.contains("active")).toBe(true)
    })
    test("should set menu move activated", () =>
    {
      expect(editor.layers.ui.root.querySelector("#ms-menu-tool-move")?.classList.contains("active")).toBe(false)
      editor.tool = EditorTool.Move
      menu.update()
      expect(editor.layers.ui.root.querySelector("#ms-menu-tool-move")?.classList.contains("active")).toBe(true)
    })
    test("should set menu erase activated", () =>
    {
      expect(editor.layers.ui.root.querySelector("#ms-menu-tool-erase")?.classList.contains("active")).toBe(false)
      editor.tool = EditorTool.Erase
      menu.update()
      expect(editor.layers.ui.root.querySelector("#ms-menu-tool-erase")?.classList.contains("active")).toBe(true)
    })
    test("should set menu write pencil activated", () =>
    {
      expect(editor.layers.ui.root.querySelector("#ms-menu-tool-write-pencil")?.classList.contains("active")).toBe(false)
      editor.tool = EditorTool.Write
      editor.writer.tool = EditorWriteTool.Pencil
      menu.update()
      expect(editor.layers.ui.root.querySelector("#ms-menu-tool-write-pencil")?.classList.contains("active")).toBe(true)
    })
    test("should set menu write circle activated", () =>
    {
      editor.tool = EditorTool.Select
      menu.update()
      expect(editor.layers.ui.root.querySelector("#ms-menu-tool-write-shape")?.classList.contains("active")).toBe(false)
      editor.tool = EditorTool.Write
      editor.writer.tool = EditorWriteTool.Circle
      menu.update()
      expect(editor.layers.ui.root.querySelector("#ms-menu-tool-write-shape")?.classList.contains("active")).toBe(true)
    })
    test("should set menu write triangle activated", () =>
    {
      editor.tool = EditorTool.Select
      menu.update()
      expect(editor.layers.ui.root.querySelector("#ms-menu-tool-write-shape")?.classList.contains("active")).toBe(false)
      editor.tool = EditorTool.Write
      editor.writer.tool = EditorWriteTool.Triangle
      menu.update()
      expect(editor.layers.ui.root.querySelector("#ms-menu-tool-write-shape")?.classList.contains("active")).toBe(true)
    })
    test("should set menu write rectangle activated", () =>
    {
      editor.tool = EditorTool.Select
      menu.update()
      expect(editor.layers.ui.root.querySelector("#ms-menu-tool-write-shape")?.classList.contains("active")).toBe(false)
      editor.tool = EditorTool.Write
      editor.writer.tool = EditorWriteTool.Rectangle
      menu.update()
      expect(editor.layers.ui.root.querySelector("#ms-menu-tool-write-shape")?.classList.contains("active")).toBe(true)
    })
    test("should set menu write line activated", () =>
    {
      editor.tool = EditorTool.Select
      menu.update()
      expect(editor.layers.ui.root.querySelector("#ms-menu-tool-write-edge")?.classList.contains("active")).toBe(false)
      editor.tool = EditorTool.Write
      editor.writer.tool = EditorWriteTool.Line
      menu.update()
      expect(editor.layers.ui.root.querySelector("#ms-menu-tool-write-edge")?.classList.contains("active")).toBe(true)
    })
    test("should set menu write arrow activated", () =>
    {
      editor.tool = EditorTool.Select
      menu.update()
      expect(editor.layers.ui.root.querySelector("#ms-menu-tool-write-edge")?.classList.contains("active")).toBe(false)
      editor.tool = EditorTool.Write
      editor.writer.tool = EditorWriteTool.Arrow
      menu.update()
      expect(editor.layers.ui.root.querySelector("#ms-menu-tool-write-edge")?.classList.contains("active")).toBe(true)
    })
    test("should set menu write doubleArrow activated", () =>
    {
      editor.tool = EditorTool.Select
      menu.update()
      expect(editor.layers.ui.root.querySelector("#ms-menu-tool-write-edge")?.classList.contains("active")).toBe(false)
      editor.tool = EditorTool.Write
      editor.writer.tool = EditorWriteTool.DoubleArrow
      menu.update()
      expect(editor.layers.ui.root.querySelector("#ms-menu-tool-write-edge")?.classList.contains("active")).toBe(true)
    })
  })

  describe("show/hide", () =>
  {
    const editor = new InteractiveInkEditorMock()
    editor.init()
    const menu = new IIMenuTool(editor)
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

  describe("destroy", () =>
  {
    const editor = new InteractiveInkEditorMock()
    editor.init()
    const menu = new IIMenuTool(editor)
    menu.render(editor.layers.ui.root)
    test("should remove elements", () =>
    {
      expect(menu.wrapper?.childElementCount).toEqual(6)
      menu.destroy()
      expect(menu.wrapper).toBeUndefined()
    })
  })
})
