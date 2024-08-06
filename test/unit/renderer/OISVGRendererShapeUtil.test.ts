import { OIShapeCircle, OIShapeEllipse, OIShapePolygon, ShapeKind, SymbolType, TPoint } from "../../../src/primitive"
import { OISVGRendererConst, OISVGRendererShapeUtil } from "../../../src/renderer"
import { DefaultStyle, TStyle } from "../../../src/style"

describe("OISVGRendererShapeUtil.ts", () =>
{
  test("should throw error if kind is unknow when getSVGPath", () =>
  {
    //@ts-ignore
    expect(() => OISVGRendererShapeUtil.getSVGPath({ kind: "pouet" })).toThrow("Can't getSVGPath for shape cause kind is unknow: \"{\"kind\":\"pouet\"}\"")
  })

  test("should getSVGPath for circle", () =>
  {
    const circle = new OIShapeCircle({ x: 0, y: 5 }, 5)
    expect(OISVGRendererShapeUtil.getSVGPath(circle)).toEqual("M -5 5 a 5 5 0 1 1 10 0 a 5 5 0 1 1 -10 0 Z")
  })
  test("should getSVGPath for ellipse", () =>
  {
    const ellipse = new OIShapeEllipse({ x: 0, y: 0 }, 5, 10, 0)
    expect(OISVGRendererShapeUtil.getSVGPath(ellipse)).toEqual("M -5 0 a 5 10 0 1 1 10 0 a 5 10 0 1 1 -10 0 Z")
  })
  test("should getSVGPath for parallelogram", () =>
  {
    const points: TPoint[] = [
      { x: 0, y: 0 },
      { x: 10, y: 20 },
      { x: 20, y: 20 },
    ]
    const polygon = new OIShapePolygon(points)
    expect(OISVGRendererShapeUtil.getSVGPath(polygon)).toEqual("M 0 0 L 10 20 L 20 20 Z")
  })


  describe("getSymbolElement", () =>
  {
    test("should get circle with default style", () =>
    {
      const circle = new OIShapeCircle({ x: 0, y: 0 }, 5)
      const el = OISVGRendererShapeUtil.getSVGElement(circle)!
      expect(el.getAttribute("id")).toEqual(circle.id)
      expect(el.getAttribute("type")).toEqual(SymbolType.Shape)
      expect(el.getAttribute("kind")).toEqual(ShapeKind.Circle)
      const path = el.querySelector("path")!
      expect(path.getAttribute("stroke")).toEqual(DefaultStyle.color)
      expect(path.getAttribute("stroke-width")).toEqual(DefaultStyle.width?.toString())
    })
    test("should get circle with custom style", () =>
    {
      const style: TStyle = {
        color: "blue",
        width: 20
      }
      const circle = new OIShapeCircle({ x: 0, y: 0 }, 5, style)
      const el = OISVGRendererShapeUtil.getSVGElement(circle)!
      expect(el.getAttribute("id")).toEqual(circle.id)
      const path = el.querySelector("path")!
      expect(path.getAttribute("stroke")).toEqual(style.color)
      expect(path.getAttribute("stroke-width")).toEqual(style.width?.toString())
    })
    test("should get circle when selected", () =>
    {
      const circle = new OIShapeCircle({ x: 0, y: 0 }, 5)
      const elNotSelected = OISVGRendererShapeUtil.getSVGElement(circle)!
      expect(elNotSelected.getAttribute("id")).toEqual(circle.id)
      expect(elNotSelected.getAttribute("type")).toEqual(SymbolType.Shape)
      expect(elNotSelected.getAttribute("kind")).toEqual(ShapeKind.Circle)
      expect(elNotSelected.getAttribute("filter")).toBeFalsy()
      circle.selected = true
      const elSelected = OISVGRendererShapeUtil.getSVGElement(circle)!
      expect(elSelected.getAttribute("id")).toEqual(circle.id)
      expect(elSelected.getAttribute("type")).toEqual(SymbolType.Shape)
      expect(elSelected.getAttribute("kind")).toEqual(ShapeKind.Circle)
      expect(elSelected.getAttribute("filter")).toEqual(`url(#${ OISVGRendererConst.selectionFilterId })`)
    })
    test("should get circle when deleting", () =>
    {
      const circle = new OIShapeCircle({ x: 0, y: 0 }, 5)
      const elNotSelected = OISVGRendererShapeUtil.getSVGElement(circle)!
      expect(elNotSelected.getAttribute("id")).toEqual(circle.id)
      expect(elNotSelected.getAttribute("type")).toEqual(SymbolType.Shape)
      expect(elNotSelected.getAttribute("kind")).toEqual(ShapeKind.Circle)
      expect(elNotSelected.getAttribute("filter")).toBeFalsy()
      circle.deleting = true
      const elSelected = OISVGRendererShapeUtil.getSVGElement(circle)!
      expect(elSelected.getAttribute("id")).toEqual(circle.id)
      expect(elSelected.getAttribute("type")).toEqual(SymbolType.Shape)
      expect(elSelected.getAttribute("kind")).toEqual(ShapeKind.Circle)
      expect(elSelected.getAttribute("filter")).toEqual(`url(#${ OISVGRendererConst.removalFilterId })`)
    })

    test("should get polygon with default style", () =>
    {
      const polygon = new OIShapePolygon([{ x: 1, y: 1 }, { x: 11, y: 11 }])
      const el = OISVGRendererShapeUtil.getSVGElement(polygon)!
      expect(el.getAttribute("id")).toEqual(polygon.id)
      expect(el.getAttribute("type")).toEqual(SymbolType.Shape)
      expect(el.getAttribute("kind")).toEqual(ShapeKind.Polygon)
      const path = el.querySelector("path")!
      expect(path.getAttribute("stroke")).toEqual(DefaultStyle.color)
      expect(path.getAttribute("stroke-width")).toEqual(DefaultStyle.width?.toString())
    })
    test("should get polygon with custom style", () =>
    {
      const style: TStyle = {
        color: "blue",
        width: 20
      }
      const polygon = new OIShapePolygon([{ x: 1, y: 1 }, { x: 11, y: 11 }], style)
      const el = OISVGRendererShapeUtil.getSVGElement(polygon)!
      expect(el.getAttribute("id")).toEqual(polygon.id)
      const path = el.querySelector("path")!
      expect(path.getAttribute("stroke")).toEqual(style.color)
      expect(path.getAttribute("stroke-width")).toEqual(style.width?.toString())
    })
    test("should get polygon when selected", () =>
    {
      const polygon = new OIShapePolygon([{ x: 1, y: 1 }, { x: 11, y: 11 }])
      const elNotSelected = OISVGRendererShapeUtil.getSVGElement(polygon)!
      expect(elNotSelected.getAttribute("id")).toEqual(polygon.id)
      expect(elNotSelected.getAttribute("filter")).toBeFalsy()
      polygon.selected = true
      const elSelected = OISVGRendererShapeUtil.getSVGElement(polygon)!
      expect(elSelected.getAttribute("id")).toEqual(polygon.id)
      expect(elSelected.getAttribute("filter")).toEqual(`url(#${ OISVGRendererConst.selectionFilterId })`)
    })
    test("should get polygon when deleting", () =>
    {
      const polygon = new OIShapePolygon([{ x: 1, y: 1 }, { x: 11, y: 11 }])
      const elNotSelected = OISVGRendererShapeUtil.getSVGElement(polygon)!
      expect(elNotSelected.getAttribute("id")).toEqual(polygon.id)
      expect(elNotSelected.getAttribute("filter")).toBeFalsy()
      polygon.deleting = true
      const elSelected = OISVGRendererShapeUtil.getSVGElement(polygon)!
      expect(elSelected.getAttribute("id")).toEqual(polygon.id)
      expect(elSelected.getAttribute("filter")).toEqual(`url(#${ OISVGRendererConst.removalFilterId })`)
    })
  })

})
