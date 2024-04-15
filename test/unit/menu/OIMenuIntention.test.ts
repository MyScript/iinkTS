import { OIBehaviorsMock } from "../__mocks__/OIBehaviorsMock"
import { LeftClickEventMock } from "../__mocks__/EventMock"
import { Intention, OIMenuIntention, WriteTool } from "../../../src/iink"

describe("OIMenuIntention.ts", () =>
{
  test("should create", () =>
  {
    const behaviors = new OIBehaviorsMock()
    const menu = new OIMenuIntention(behaviors)
    expect(menu).toBeDefined()
  })

  describe("render", () =>
  {
    const layer = document.createElement("div")
    const behaviors = new OIBehaviorsMock()
    const menu = new OIMenuIntention(behaviors)
    menu.render(layer)
    test("should display menu write pencil", () =>
    {
      expect(layer.querySelector("#ms-menu-intention-write-pencil")).not.toBeNull()
    })
    test("should display menu select", () =>
    {
      expect(layer.querySelector("#ms-menu-intention-select")).not.toBeNull()
    })
    test("should display menu erase", () =>
    {
      expect(layer.querySelector("#ms-menu-intention-erase")).not.toBeNull()
    })
    test("should display menu move", () =>
    {
      expect(layer.querySelector("#ms-menu-intention-move")).not.toBeNull()
    })
    test("should display menu shape", () =>
    {
      expect(layer.querySelector("#ms-menu-intention-write-shape")).not.toBeNull()
    })
  })

  describe("change intention", () =>
  {
    const behaviors = new OIBehaviorsMock()
    behaviors.init(behaviors.layerInfos)
    const menu = new OIMenuIntention(behaviors)
    const pointerUpEvt = new LeftClickEventMock("pointerup", {
      pointerType: "pen",
      clientX: 10,
      clientY: 10,
      pressure: 1
    })
    menu.render(behaviors.layerInfos)
    test("should set menu select", () =>
    {
      behaviors.intention = Intention.Erase
      const menuEl = behaviors.layerInfos.querySelector("#ms-menu-intention-select") as HTMLDivElement
      menuEl.dispatchEvent(pointerUpEvt)
      expect(behaviors.intention).toEqual(Intention.Select)
    })
    test("should set menu move", () =>
    {
      behaviors.intention = Intention.Erase
      const menuEl = behaviors.layerInfos.querySelector("#ms-menu-intention-move") as HTMLDivElement
      menuEl.dispatchEvent(pointerUpEvt)
      expect(behaviors.intention).toEqual(Intention.Move)
    })
    test("should set menu erase", () =>
    {
      behaviors.intention = Intention.Write
      const menuEl = behaviors.layerInfos.querySelector("#ms-menu-intention-erase") as HTMLDivElement
      menuEl.dispatchEvent(pointerUpEvt)
      expect(behaviors.intention).toEqual(Intention.Erase)
    })
    test("should set menu write pencil", () =>
    {
      behaviors.intention = Intention.Erase
      behaviors.writer.tool = WriteTool.Rectangle
      const menuEl = behaviors.layerInfos.querySelector("#ms-menu-intention-write-pencil") as HTMLDivElement
      menuEl.dispatchEvent(pointerUpEvt)
      expect(behaviors.intention).toEqual(Intention.Write)
      expect(behaviors.writer.tool).toEqual(WriteTool.Pencil)
    })
    test("should display sub menu shape", () =>
    {
      const menuEl = behaviors.layerInfos.querySelector("#ms-menu-intention-write-shape") as HTMLDivElement
      const subMenuEl1 = behaviors.layerInfos.querySelector(".sub-menu-content-shape") as HTMLDivElement
      expect(subMenuEl1.classList.contains("open")).toBeFalsy()
      menuEl.dispatchEvent(pointerUpEvt)
      const subMenuEl2 = behaviors.layerInfos.querySelector(".sub-menu-content-shape") as HTMLDivElement
      expect(subMenuEl2.classList.contains("open")).toBeFalsy()
    })
    test("should set write rectangle", () =>
    {
      behaviors.intention = Intention.Erase
      behaviors.writer.tool = WriteTool.Pencil
      const subMenuEl1 = behaviors.layerInfos.querySelector("#ms-menu-intention-write-shape-rectangle") as HTMLDivElement
      subMenuEl1.dispatchEvent(pointerUpEvt)
      const subMenuEl2 = behaviors.layerInfos.querySelector("#ms-menu-intention-write-shape-rectangle") as HTMLDivElement
      expect(subMenuEl2.classList.contains("open")).toBeFalsy()

      expect(behaviors.intention).toEqual(Intention.Write)
      expect(behaviors.writer.tool).toEqual(WriteTool.Rectangle)
    })
    test("should set write triangle", () =>
    {
      behaviors.intention = Intention.Erase
      behaviors.writer.tool = WriteTool.Pencil
      const subMenuEl1 = behaviors.layerInfos.querySelector("#ms-menu-intention-write-shape-triangle") as HTMLDivElement
      subMenuEl1.dispatchEvent(pointerUpEvt)
      const subMenuEl2 = behaviors.layerInfos.querySelector("#ms-menu-intention-write-shape-triangle") as HTMLDivElement
      expect(subMenuEl2.classList.contains("open")).toBeFalsy()

      expect(behaviors.intention).toEqual(Intention.Write)
      expect(behaviors.writer.tool).toEqual(WriteTool.Triangle)
    })
    test("should set write ellipse", () =>
    {
      behaviors.intention = Intention.Erase
      behaviors.writer.tool = WriteTool.Pencil
      const subMenuEl1 = behaviors.layerInfos.querySelector("#ms-menu-intention-write-shape-ellipse") as HTMLDivElement
      subMenuEl1.dispatchEvent(pointerUpEvt)
      const subMenuEl2 = behaviors.layerInfos.querySelector("#ms-menu-intention-write-shape-ellipse") as HTMLDivElement
      expect(subMenuEl2.classList.contains("open")).toBeFalsy()

      expect(behaviors.intention).toEqual(Intention.Write)
      expect(behaviors.writer.tool).toEqual(WriteTool.Ellipse)
    })
    test("should set write circle", () =>
    {
      behaviors.intention = Intention.Erase
      behaviors.writer.tool = WriteTool.Pencil
      const subMenuEl1 = behaviors.layerInfos.querySelector("#ms-menu-intention-write-shape-circle") as HTMLDivElement
      subMenuEl1.dispatchEvent(pointerUpEvt)
      const subMenuEl2 = behaviors.layerInfos.querySelector("#ms-menu-intention-write-shape-circle") as HTMLDivElement
      expect(subMenuEl2.classList.contains("open")).toBeFalsy()

      expect(behaviors.intention).toEqual(Intention.Write)
      expect(behaviors.writer.tool).toEqual(WriteTool.Circle)
    })
    test("should display sub menu edge", () =>
    {
      const menuEl = behaviors.layerInfos.querySelector("#ms-menu-intention-write-edge") as HTMLDivElement
      const subMenuEl1 = behaviors.layerInfos.querySelector(".sub-menu-content-edge") as HTMLDivElement
      expect(subMenuEl1.classList.contains("open")).toBeFalsy()
      menuEl.dispatchEvent(pointerUpEvt)
      const subMenuEl2 = behaviors.layerInfos.querySelector(".sub-menu-content-edge") as HTMLDivElement
      expect(subMenuEl2.classList.contains("open")).toBeFalsy()
    })
    test("should set write arrow", () =>
    {
      behaviors.intention = Intention.Erase
      behaviors.writer.tool = WriteTool.Pencil
      const subMenuEl1 = behaviors.layerInfos.querySelector("#ms-menu-intention-write-edge-arrow") as HTMLDivElement
      subMenuEl1.dispatchEvent(pointerUpEvt)
      const subMenuEl2 = behaviors.layerInfos.querySelector("#ms-menu-intention-write-edge-arrow") as HTMLDivElement
      expect(subMenuEl2.classList.contains("open")).toBeFalsy()

      expect(behaviors.intention).toEqual(Intention.Write)
      expect(behaviors.writer.tool).toEqual(WriteTool.Arrow)
    })
  })

  describe("update", () =>
  {
    const behaviors = new OIBehaviorsMock()
    behaviors.init(behaviors.layerInfos)
    const menu = new OIMenuIntention(behaviors)
    menu.render(behaviors.layerInfos)
    test("should set menu select activated", () =>
    {
      expect(behaviors.layerInfos.querySelector("#ms-menu-intention-select")?.classList.contains("active")).toBe(false)
      behaviors.intention = Intention.Select
      menu.update()
      expect(behaviors.layerInfos.querySelector("#ms-menu-intention-select")?.classList.contains("active")).toBe(true)
    })
    test("should set menu move activated", () =>
    {
      expect(behaviors.layerInfos.querySelector("#ms-menu-intention-move")?.classList.contains("active")).toBe(false)
      behaviors.intention = Intention.Move
      menu.update()
      expect(behaviors.layerInfos.querySelector("#ms-menu-intention-move")?.classList.contains("active")).toBe(true)
    })
    test("should set menu erase activated", () =>
    {
      expect(behaviors.layerInfos.querySelector("#ms-menu-intention-erase")?.classList.contains("active")).toBe(false)
      behaviors.intention = Intention.Erase
      menu.update()
      expect(behaviors.layerInfos.querySelector("#ms-menu-intention-erase")?.classList.contains("active")).toBe(true)
    })
    test("should set menu write pencil activated", () =>
    {
      expect(behaviors.layerInfos.querySelector("#ms-menu-intention-write-pencil")?.classList.contains("active")).toBe(false)
      behaviors.intention = Intention.Write
      behaviors.writer.tool = WriteTool.Pencil
      menu.update()
      expect(behaviors.layerInfos.querySelector("#ms-menu-intention-write-pencil")?.classList.contains("active")).toBe(true)
    })
    test("should set menu write circle activated", () =>
    {
      behaviors.intention = Intention.Select
      menu.update()
      expect(behaviors.layerInfos.querySelector("#ms-menu-intention-write-shape")?.classList.contains("active")).toBe(false)
      behaviors.intention = Intention.Write
      behaviors.writer.tool = WriteTool.Circle
      menu.update()
      expect(behaviors.layerInfos.querySelector("#ms-menu-intention-write-shape")?.classList.contains("active")).toBe(true)
    })
    test("should set menu write triangle activated", () =>
    {
      behaviors.intention = Intention.Select
      menu.update()
      expect(behaviors.layerInfos.querySelector("#ms-menu-intention-write-shape")?.classList.contains("active")).toBe(false)
      behaviors.intention = Intention.Write
      behaviors.writer.tool = WriteTool.Triangle
      menu.update()
      expect(behaviors.layerInfos.querySelector("#ms-menu-intention-write-shape")?.classList.contains("active")).toBe(true)
    })
    test("should set menu write rectangle activated", () =>
    {
      behaviors.intention = Intention.Select
      menu.update()
      expect(behaviors.layerInfos.querySelector("#ms-menu-intention-write-shape")?.classList.contains("active")).toBe(false)
      behaviors.intention = Intention.Write
      behaviors.writer.tool = WriteTool.Rectangle
      menu.update()
      expect(behaviors.layerInfos.querySelector("#ms-menu-intention-write-shape")?.classList.contains("active")).toBe(true)
    })
    test("should set menu write line activated", () =>
    {
      behaviors.intention = Intention.Select
      menu.update()
      expect(behaviors.layerInfos.querySelector("#ms-menu-intention-write-edge")?.classList.contains("active")).toBe(false)
      behaviors.intention = Intention.Write
      behaviors.writer.tool = WriteTool.Line
      menu.update()
      expect(behaviors.layerInfos.querySelector("#ms-menu-intention-write-edge")?.classList.contains("active")).toBe(true)
    })
    test("should set menu write arrow activated", () =>
    {
      behaviors.intention = Intention.Select
      menu.update()
      expect(behaviors.layerInfos.querySelector("#ms-menu-intention-write-edge")?.classList.contains("active")).toBe(false)
      behaviors.intention = Intention.Write
      behaviors.writer.tool = WriteTool.Arrow
      menu.update()
      expect(behaviors.layerInfos.querySelector("#ms-menu-intention-write-edge")?.classList.contains("active")).toBe(true)
    })
    test("should set menu write doubleArrow activated", () =>
    {
      behaviors.intention = Intention.Select
      menu.update()
      expect(behaviors.layerInfos.querySelector("#ms-menu-intention-write-edge")?.classList.contains("active")).toBe(false)
      behaviors.intention = Intention.Write
      behaviors.writer.tool = WriteTool.DoubleArrow
      menu.update()
      expect(behaviors.layerInfos.querySelector("#ms-menu-intention-write-edge")?.classList.contains("active")).toBe(true)
    })
  })

  describe("show/hide", () =>
  {
    const behaviors = new OIBehaviorsMock()
    behaviors.init(behaviors.layerInfos)
    const menu = new OIMenuIntention(behaviors)
    menu.render(behaviors.layerInfos)
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
    behaviors.init(behaviors.layerInfos)
    const menu = new OIMenuIntention(behaviors)
    menu.render(behaviors.layerInfos)
    test("should remove elements", () =>
    {
      expect(menu.wrapper?.childElementCount).toEqual(6)
      menu.destroy()
      expect(menu.wrapper).toBeUndefined()
    })
  })
})
