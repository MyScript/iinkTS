import { OIBehaviorsMock } from "../__mocks__/OIBehaviorsMock"
import { LeftClickEventMock } from "../__mocks__/EventMock"
import { EditorTool, OIMenuTool, EditorWriteTool } from "../../../src/iink"

describe("OIMenuTool.ts", () =>
{
  test("should create", () =>
  {
    const behaviors = new OIBehaviorsMock()
    const menu = new OIMenuTool(behaviors)
    expect(menu).toBeDefined()
  })

  describe("render", () =>
  {
    const layer = document.createElement("div")
    const behaviors = new OIBehaviorsMock()
    const menu = new OIMenuTool(behaviors)
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
    const behaviors = new OIBehaviorsMock()
    behaviors.init()
    const menu = new OIMenuTool(behaviors)
    const pointerUpEvt = new LeftClickEventMock("pointerup", {
      pointerType: "pen",
      clientX: 10,
      clientY: 10,
      pressure: 1
    })
    menu.render(behaviors.layers.ui.root)
    test("should set menu select", () =>
    {
      behaviors.tool = EditorTool.Erase
      const menuEl = behaviors.layers.ui.root.querySelector("#ms-menu-tool-select") as HTMLDivElement
      menuEl.dispatchEvent(pointerUpEvt)
      expect(behaviors.tool).toEqual(EditorTool.Select)
    })
    test("should set menu move", () =>
    {
      behaviors.tool = EditorTool.Erase
      const menuEl = behaviors.layers.ui.root.querySelector("#ms-menu-tool-move") as HTMLDivElement
      menuEl.dispatchEvent(pointerUpEvt)
      expect(behaviors.tool).toEqual(EditorTool.Move)
    })
    test("should set menu erase", () =>
    {
      behaviors.tool = EditorTool.Write
      const menuEl = behaviors.layers.ui.root.querySelector("#ms-menu-tool-erase") as HTMLDivElement
      menuEl.dispatchEvent(pointerUpEvt)
      expect(behaviors.tool).toEqual(EditorTool.Erase)
    })
    test("should set menu write pencil", () =>
    {
      behaviors.tool = EditorTool.Erase
      behaviors.writer.tool = EditorWriteTool.Rectangle
      const menuEl = behaviors.layers.ui.root.querySelector("#ms-menu-tool-write-pencil") as HTMLDivElement
      menuEl.dispatchEvent(pointerUpEvt)
      expect(behaviors.tool).toEqual(EditorTool.Write)
      expect(behaviors.writer.tool).toEqual(EditorWriteTool.Pencil)
    })
    test("should display sub menu shape", () =>
    {
      const menuEl = behaviors.layers.ui.root.querySelector("#ms-menu-tool-write-shape") as HTMLDivElement
      const subMenuEl1 = behaviors.layers.ui.root.querySelector(".sub-menu-content-shape") as HTMLDivElement
      expect(subMenuEl1.classList.contains("open")).toBeFalsy()
      menuEl.dispatchEvent(pointerUpEvt)
      const subMenuEl2 = behaviors.layers.ui.root.querySelector(".sub-menu-content-shape") as HTMLDivElement
      expect(subMenuEl2.classList.contains("open")).toBeFalsy()
    })
    test("should set write rectangle", () =>
    {
      behaviors.tool = EditorTool.Erase
      behaviors.writer.tool = EditorWriteTool.Pencil
      const subMenuEl1 = behaviors.layers.ui.root.querySelector("#ms-menu-tool-write-shape-rectangle") as HTMLDivElement
      subMenuEl1.dispatchEvent(pointerUpEvt)
      const subMenuEl2 = behaviors.layers.ui.root.querySelector("#ms-menu-tool-write-shape-rectangle") as HTMLDivElement
      expect(subMenuEl2.classList.contains("open")).toBeFalsy()

      expect(behaviors.tool).toEqual(EditorTool.Write)
      expect(behaviors.writer.tool).toEqual(EditorWriteTool.Rectangle)
    })
    test("should set write triangle", () =>
    {
      behaviors.tool = EditorTool.Erase
      behaviors.writer.tool = EditorWriteTool.Pencil
      const subMenuEl1 = behaviors.layers.ui.root.querySelector("#ms-menu-tool-write-shape-triangle") as HTMLDivElement
      subMenuEl1.dispatchEvent(pointerUpEvt)
      const subMenuEl2 = behaviors.layers.ui.root.querySelector("#ms-menu-tool-write-shape-triangle") as HTMLDivElement
      expect(subMenuEl2.classList.contains("open")).toBeFalsy()

      expect(behaviors.tool).toEqual(EditorTool.Write)
      expect(behaviors.writer.tool).toEqual(EditorWriteTool.Triangle)
    })
    test("should set write ellipse", () =>
    {
      behaviors.tool = EditorTool.Erase
      behaviors.writer.tool = EditorWriteTool.Pencil
      const subMenuEl1 = behaviors.layers.ui.root.querySelector("#ms-menu-tool-write-shape-ellipse") as HTMLDivElement
      subMenuEl1.dispatchEvent(pointerUpEvt)
      const subMenuEl2 = behaviors.layers.ui.root.querySelector("#ms-menu-tool-write-shape-ellipse") as HTMLDivElement
      expect(subMenuEl2.classList.contains("open")).toBeFalsy()

      expect(behaviors.tool).toEqual(EditorTool.Write)
      expect(behaviors.writer.tool).toEqual(EditorWriteTool.Ellipse)
    })
    test("should set write circle", () =>
    {
      behaviors.tool = EditorTool.Erase
      behaviors.writer.tool = EditorWriteTool.Pencil
      const subMenuEl1 = behaviors.layers.ui.root.querySelector("#ms-menu-tool-write-shape-circle") as HTMLDivElement
      subMenuEl1.dispatchEvent(pointerUpEvt)
      const subMenuEl2 = behaviors.layers.ui.root.querySelector("#ms-menu-tool-write-shape-circle") as HTMLDivElement
      expect(subMenuEl2.classList.contains("open")).toBeFalsy()

      expect(behaviors.tool).toEqual(EditorTool.Write)
      expect(behaviors.writer.tool).toEqual(EditorWriteTool.Circle)
    })
    test("should display sub menu edge", () =>
    {
      const menuEl = behaviors.layers.ui.root.querySelector("#ms-menu-tool-write-edge") as HTMLDivElement
      const subMenuEl1 = behaviors.layers.ui.root.querySelector(".sub-menu-content-edge") as HTMLDivElement
      expect(subMenuEl1.classList.contains("open")).toBeFalsy()
      menuEl.dispatchEvent(pointerUpEvt)
      const subMenuEl2 = behaviors.layers.ui.root.querySelector(".sub-menu-content-edge") as HTMLDivElement
      expect(subMenuEl2.classList.contains("open")).toBeFalsy()
    })
    test("should set write arrow", () =>
    {
      behaviors.tool = EditorTool.Erase
      behaviors.writer.tool = EditorWriteTool.Pencil
      const subMenuEl1 = behaviors.layers.ui.root.querySelector("#ms-menu-tool-write-edge-arrow") as HTMLDivElement
      subMenuEl1.dispatchEvent(pointerUpEvt)
      const subMenuEl2 = behaviors.layers.ui.root.querySelector("#ms-menu-tool-write-edge-arrow") as HTMLDivElement
      expect(subMenuEl2.classList.contains("open")).toBeFalsy()

      expect(behaviors.tool).toEqual(EditorTool.Write)
      expect(behaviors.writer.tool).toEqual(EditorWriteTool.Arrow)
    })
  })

  describe("update", () =>
  {
    const behaviors = new OIBehaviorsMock()
    behaviors.init()
    const menu = new OIMenuTool(behaviors)
    menu.render(behaviors.layers.ui.root)
    test("should set menu select activated", () =>
    {
      expect(behaviors.layers.ui.root.querySelector("#ms-menu-tool-select")?.classList.contains("active")).toBe(false)
      behaviors.tool = EditorTool.Select
      menu.update()
      expect(behaviors.layers.ui.root.querySelector("#ms-menu-tool-select")?.classList.contains("active")).toBe(true)
    })
    test("should set menu move activated", () =>
    {
      expect(behaviors.layers.ui.root.querySelector("#ms-menu-tool-move")?.classList.contains("active")).toBe(false)
      behaviors.tool = EditorTool.Move
      menu.update()
      expect(behaviors.layers.ui.root.querySelector("#ms-menu-tool-move")?.classList.contains("active")).toBe(true)
    })
    test("should set menu erase activated", () =>
    {
      expect(behaviors.layers.ui.root.querySelector("#ms-menu-tool-erase")?.classList.contains("active")).toBe(false)
      behaviors.tool = EditorTool.Erase
      menu.update()
      expect(behaviors.layers.ui.root.querySelector("#ms-menu-tool-erase")?.classList.contains("active")).toBe(true)
    })
    test("should set menu write pencil activated", () =>
    {
      expect(behaviors.layers.ui.root.querySelector("#ms-menu-tool-write-pencil")?.classList.contains("active")).toBe(false)
      behaviors.tool = EditorTool.Write
      behaviors.writer.tool = EditorWriteTool.Pencil
      menu.update()
      expect(behaviors.layers.ui.root.querySelector("#ms-menu-tool-write-pencil")?.classList.contains("active")).toBe(true)
    })
    test("should set menu write circle activated", () =>
    {
      behaviors.tool = EditorTool.Select
      menu.update()
      expect(behaviors.layers.ui.root.querySelector("#ms-menu-tool-write-shape")?.classList.contains("active")).toBe(false)
      behaviors.tool = EditorTool.Write
      behaviors.writer.tool = EditorWriteTool.Circle
      menu.update()
      expect(behaviors.layers.ui.root.querySelector("#ms-menu-tool-write-shape")?.classList.contains("active")).toBe(true)
    })
    test("should set menu write triangle activated", () =>
    {
      behaviors.tool = EditorTool.Select
      menu.update()
      expect(behaviors.layers.ui.root.querySelector("#ms-menu-tool-write-shape")?.classList.contains("active")).toBe(false)
      behaviors.tool = EditorTool.Write
      behaviors.writer.tool = EditorWriteTool.Triangle
      menu.update()
      expect(behaviors.layers.ui.root.querySelector("#ms-menu-tool-write-shape")?.classList.contains("active")).toBe(true)
    })
    test("should set menu write rectangle activated", () =>
    {
      behaviors.tool = EditorTool.Select
      menu.update()
      expect(behaviors.layers.ui.root.querySelector("#ms-menu-tool-write-shape")?.classList.contains("active")).toBe(false)
      behaviors.tool = EditorTool.Write
      behaviors.writer.tool = EditorWriteTool.Rectangle
      menu.update()
      expect(behaviors.layers.ui.root.querySelector("#ms-menu-tool-write-shape")?.classList.contains("active")).toBe(true)
    })
    test("should set menu write line activated", () =>
    {
      behaviors.tool = EditorTool.Select
      menu.update()
      expect(behaviors.layers.ui.root.querySelector("#ms-menu-tool-write-edge")?.classList.contains("active")).toBe(false)
      behaviors.tool = EditorTool.Write
      behaviors.writer.tool = EditorWriteTool.Line
      menu.update()
      expect(behaviors.layers.ui.root.querySelector("#ms-menu-tool-write-edge")?.classList.contains("active")).toBe(true)
    })
    test("should set menu write arrow activated", () =>
    {
      behaviors.tool = EditorTool.Select
      menu.update()
      expect(behaviors.layers.ui.root.querySelector("#ms-menu-tool-write-edge")?.classList.contains("active")).toBe(false)
      behaviors.tool = EditorTool.Write
      behaviors.writer.tool = EditorWriteTool.Arrow
      menu.update()
      expect(behaviors.layers.ui.root.querySelector("#ms-menu-tool-write-edge")?.classList.contains("active")).toBe(true)
    })
    test("should set menu write doubleArrow activated", () =>
    {
      behaviors.tool = EditorTool.Select
      menu.update()
      expect(behaviors.layers.ui.root.querySelector("#ms-menu-tool-write-edge")?.classList.contains("active")).toBe(false)
      behaviors.tool = EditorTool.Write
      behaviors.writer.tool = EditorWriteTool.DoubleArrow
      menu.update()
      expect(behaviors.layers.ui.root.querySelector("#ms-menu-tool-write-edge")?.classList.contains("active")).toBe(true)
    })
  })

  describe("show/hide", () =>
  {
    const behaviors = new OIBehaviorsMock()
    behaviors.init()
    const menu = new OIMenuTool(behaviors)
    menu.render(behaviors.layers.ui.root)
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
    const behaviors = new OIBehaviorsMock()
    behaviors.init()
    const menu = new OIMenuTool(behaviors)
    menu.render(behaviors.layers.ui.root)
    test("should remove elements", () =>
    {
      expect(menu.wrapper?.childElementCount).toEqual(6)
      menu.destroy()
      expect(menu.wrapper).toBeUndefined()
    })
  })
})
