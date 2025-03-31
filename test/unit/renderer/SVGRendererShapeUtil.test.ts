import { IIShapeCircle, IIShapeEllipse, IIShapePolygon, ShapeKind, SymbolType, TPoint } from "../../../src/symbol"
import { SVGRendererConst, SVGRendererShapeUtil } from "../../../src/renderer"
import { DefaultStyle, TStyle } from "../../../src/style"

describe("SVGRendererShapeUtil.ts", () =>
{
  test("should throw error if kind is unknow when getSVGPath", () =>
  {
    //@ts-ignore
    expect(() => SVGRendererShapeUtil.getSVGPath({ kind: "pouet" })).toThrow("Can't getSVGPath for shape cause kind is unknow: \"{\"kind\":\"pouet\"}\"")
  })

  test("should getSVGPath for circle", () =>
  {
    const circle = new IIShapeCircle({ x: 0, y: 5 }, 5)
    expect(SVGRendererShapeUtil.getSVGPath(circle)).toEqual("M -5 5 a 5 5 0 1 1 10 0 a 5 5 0 1 1 -10 0 Z")
  })
  test("should getSVGPath for ellipse", () =>
  {
    const ellipse = new IIShapeEllipse({ x: 0, y: 0 }, 5, 10, 0)
    expect(SVGRendererShapeUtil.getSVGPath(ellipse)).toEqual("M -5 0 a 5 10 0 1 1 10 0 a 5 10 0 1 1 -10 0 Z")
  })
  test("should getSVGPath for polygon", () =>
  {
    const points: TPoint[] = [
      { x: 0, y: 0 },
      { x: 10, y: 20 },
      { x: 20, y: 20 },
    ]
    const polygon = new IIShapePolygon(points)
    expect(SVGRendererShapeUtil.getSVGPath(polygon)).toEqual("M 0 0 L 10 20 L 20 20 Z")
  })


  describe("getSymbolElement", () =>
  {
    test("should get circle with default style", () =>
    {
      const circle = new IIShapeCircle({ x: 0, y: 0 }, 5)
      const el = SVGRendererShapeUtil.getSVGElement(circle)!
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
      const circle = new IIShapeCircle({ x: 0, y: 0 }, 5, style)
      const el = SVGRendererShapeUtil.getSVGElement(circle)!
      expect(el.getAttribute("id")).toEqual(circle.id)
      const path = el.querySelector("path")!
      expect(path.getAttribute("stroke")).toEqual(style.color)
      expect(path.getAttribute("stroke-width")).toEqual(style.width?.toString())
    })
    test("should get circle when selected", () =>
    {
      const circle = new IIShapeCircle({ x: 0, y: 0 }, 5)
      const elNotSelected = SVGRendererShapeUtil.getSVGElement(circle)!
      expect(elNotSelected.getAttribute("id")).toEqual(circle.id)
      expect(elNotSelected.getAttribute("type")).toEqual(SymbolType.Shape)
      expect(elNotSelected.getAttribute("kind")).toEqual(ShapeKind.Circle)
      expect(elNotSelected.getAttribute("filter")).toBeFalsy()
      circle.selected = true
      const elSelected = SVGRendererShapeUtil.getSVGElement(circle)!
      expect(elSelected.getAttribute("id")).toEqual(circle.id)
      expect(elSelected.getAttribute("type")).toEqual(SymbolType.Shape)
      expect(elSelected.getAttribute("kind")).toEqual(ShapeKind.Circle)
      expect(elSelected.getAttribute("filter")).toEqual(`url(#${ SVGRendererConst.selectionFilterId })`)
    })
    test("should get circle when deleting", () =>
    {
      const circle = new IIShapeCircle({ x: 0, y: 0 }, 5)
      const elNotSelected = SVGRendererShapeUtil.getSVGElement(circle)!
      expect(elNotSelected.getAttribute("id")).toEqual(circle.id)
      expect(elNotSelected.getAttribute("type")).toEqual(SymbolType.Shape)
      expect(elNotSelected.getAttribute("kind")).toEqual(ShapeKind.Circle)
      expect(elNotSelected.getAttribute("filter")).toBeFalsy()
      circle.deleting = true
      const elSelected = SVGRendererShapeUtil.getSVGElement(circle)!
      expect(elSelected.getAttribute("id")).toEqual(circle.id)
      expect(elSelected.getAttribute("type")).toEqual(SymbolType.Shape)
      expect(elSelected.getAttribute("kind")).toEqual(ShapeKind.Circle)
      expect(elSelected.getAttribute("filter")).toEqual(`url(#${ SVGRendererConst.removalFilterId })`)
    })

    test("should get polygon with default style", () =>
    {
      const polygon = new IIShapePolygon([{ x: 1, y: 1 }, { x: 11, y: 11 }])
      const el = SVGRendererShapeUtil.getSVGElement(polygon)!
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
      const polygon = new IIShapePolygon([{ x: 1, y: 1 }, { x: 11, y: 11 }], style)
      const el = SVGRendererShapeUtil.getSVGElement(polygon)!
      expect(el.getAttribute("id")).toEqual(polygon.id)
      const path = el.querySelector("path")!
      expect(path.getAttribute("stroke")).toEqual(style.color)
      expect(path.getAttribute("stroke-width")).toEqual(style.width?.toString())
    })
    test("should get polygon when selected", () =>
    {
      const polygon = new IIShapePolygon([{ x: 1, y: 1 }, { x: 11, y: 11 }])
      const elNotSelected = SVGRendererShapeUtil.getSVGElement(polygon)!
      expect(elNotSelected.getAttribute("id")).toEqual(polygon.id)
      expect(elNotSelected.getAttribute("filter")).toBeFalsy()
      polygon.selected = true
      const elSelected = SVGRendererShapeUtil.getSVGElement(polygon)!
      expect(elSelected.getAttribute("id")).toEqual(polygon.id)
      expect(elSelected.getAttribute("filter")).toEqual(`url(#${ SVGRendererConst.selectionFilterId })`)
    })
    test("should get polygon when deleting", () =>
    {
      const polygon = new IIShapePolygon([{ x: 1, y: 1 }, { x: 11, y: 11 }])
      const elNotSelected = SVGRendererShapeUtil.getSVGElement(polygon)!
      expect(elNotSelected.getAttribute("id")).toEqual(polygon.id)
      expect(elNotSelected.getAttribute("filter")).toBeFalsy()
      polygon.deleting = true
      const elSelected = SVGRendererShapeUtil.getSVGElement(polygon)!
      expect(elSelected.getAttribute("id")).toEqual(polygon.id)
      expect(elSelected.getAttribute("filter")).toEqual(`url(#${ SVGRendererConst.removalFilterId })`)
    })
  })

})
