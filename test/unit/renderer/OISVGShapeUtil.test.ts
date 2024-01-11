import { DefaultStyle, OISVGShapeUtil, OIShapeCircle, OIShapeParallelogram, OIShapeRectangle, OIShapeTriangle, ShapeKind, SymbolType, TPoint, TStyle } from "../../../src/iink"

describe("OISVGShapeUtil.ts", () =>
{
  const selectionFilterId = "selectionFilterId"
  const removalFilterId = "removalFilterId"
  const renderer = new OISVGShapeUtil(selectionFilterId, removalFilterId)

  describe("rectangle", () =>
  {
    test("should getSVGPath when origin is equal to target", () =>
    {
      const origin: TPoint = { x: 1, y: 1 }
      const target: TPoint = { x: 1, y: 1 }
      const rect = OIShapeRectangle.createFromLine(DefaultStyle, origin, target)
      expect(renderer.getSVGPath(rect)).toEqual("M 1 1 L 1 1 L 1 1 L 1 1 Z")
    })
    test("should getSVGPath when origin is different to target", () =>
    {
      const origin: TPoint = { x: 1, y: 1 }
      const target: TPoint = { x: 11, y: 11 }
      const rect = OIShapeRectangle.createFromLine(DefaultStyle, origin, target)
      expect(renderer.getSVGPath(rect)).toEqual("M 1 1 L 11 1 L 11 11 L 1 11 Z")
    })
    test("should getSVGElement with default style", () =>
    {
      const origin: TPoint = { x: 1, y: 1 }
      const target: TPoint = { x: 11, y: 11 }
      const rect = OIShapeRectangle.createFromLine({}, origin, target)
      const el = renderer.getSVGElement(rect)
      expect(el.getAttribute("id")).toEqual(rect.id)
      expect(el.getAttribute("type")).toEqual(SymbolType.Shape)
      expect(el.getAttribute("kind")).toEqual(ShapeKind.Rectangle)
      expect(el.getAttribute("stroke")).toEqual(DefaultStyle.color)
      expect(el.getAttribute("stroke-width")).toEqual(DefaultStyle.width?.toString())
    })
    test("should getSVGElement with custom style", () =>
    {
      const style: TStyle = {
        color: "blue",
        width: 20
      }
      const origin: TPoint = { x: 1, y: 1 }
      const target: TPoint = { x: 11, y: 11 }
      const rect = OIShapeRectangle.createFromLine(style, origin, target)
      const el = renderer.getSVGElement(rect)
      expect(el.getAttribute("id")).toEqual(rect.id)
      expect(el.getAttribute("type")).toEqual(SymbolType.Shape)
      expect(el.getAttribute("kind")).toEqual(ShapeKind.Rectangle)
      expect(el.getAttribute("stroke")).toEqual(style.color)
      expect(el.getAttribute("stroke-width")).toEqual(style.width?.toString())
    })
    test("should getSVGElement when selected", () =>
    {
      const origin: TPoint = { x: 1, y: 1 }
      const target: TPoint = { x: 11, y: 11 }
      const rect = OIShapeRectangle.createFromLine(DefaultStyle, origin, target)
      const elNotSelected = renderer.getSVGElement(rect)
      expect(elNotSelected.getAttribute("id")).toEqual(rect.id)
      expect(elNotSelected.getAttribute("type")).toEqual(SymbolType.Shape)
      expect(elNotSelected.getAttribute("kind")).toEqual(ShapeKind.Rectangle)
      expect(elNotSelected.getAttribute("filter")).toBeFalsy()
      rect.selected = true
      const elSelected = renderer.getSVGElement(rect)
      expect(elSelected.getAttribute("id")).toEqual(rect.id)
      expect(elSelected.getAttribute("type")).toEqual(SymbolType.Shape)
      expect(elSelected.getAttribute("kind")).toEqual(ShapeKind.Rectangle)
      expect(elSelected.getAttribute("filter")).toEqual(`url(#${ selectionFilterId })`)
    })
  })

  describe("circle", () =>
  {
    test("should getSVGPath when origin is equal to target", () =>
    {
      const origin: TPoint = { x: 1, y: 1 }
      const target: TPoint = { x: 1, y: 1 }
      const circle = OIShapeCircle.createFromLine(DefaultStyle, origin, target)
      expect(renderer.getSVGPath(circle)).toEqual("M 1 1 a 0 0 0 1 1 0 0 a 0 0 0 1 1 -0 0 Z")
    })
    test("should getSVGPath when origin is different to target", () =>
    {
      const origin: TPoint = { x: 0, y: 0 }
      const target: TPoint = { x: 0, y: 10 }
      const circle = OIShapeCircle.createFromLine(DefaultStyle, origin, target)
      expect(renderer.getSVGPath(circle)).toEqual("M -5 5 a 5 5 0 1 1 10 0 a 5 5 0 1 1 -10 0 Z")
    })
    test("should getSVGElement with default style", () =>
    {
      const origin: TPoint = { x: 1, y: 1 }
      const target: TPoint = { x: 11, y: 11 }
      const circle = OIShapeCircle.createFromLine({}, origin, target)
      const el = renderer.getSVGElement(circle)
      expect(el.getAttribute("id")).toEqual(circle.id)
      expect(el.getAttribute("type")).toEqual(SymbolType.Shape)
      expect(el.getAttribute("kind")).toEqual(ShapeKind.Circle)
      expect(el.getAttribute("stroke")).toEqual(DefaultStyle.color)
      expect(el.getAttribute("stroke-width")).toEqual(DefaultStyle.width?.toString())
    })
    test("should getSVGElement with custom style", () =>
    {
      const style: TStyle = {
        color: "blue",
        width: 20
      }
      const origin: TPoint = { x: 1, y: 1 }
      const target: TPoint = { x: 11, y: 11 }
      const circle = OIShapeCircle.createFromLine(style, origin, target)
      const el = renderer.getSVGElement(circle)
      expect(el.getAttribute("id")).toEqual(circle.id)
      expect(el.getAttribute("type")).toEqual(SymbolType.Shape)
      expect(el.getAttribute("kind")).toEqual(ShapeKind.Circle)
      expect(el.getAttribute("stroke")).toEqual(style.color)
      expect(el.getAttribute("stroke-width")).toEqual(style.width?.toString())
    })
    test("should getSVGElement when selected", () =>
    {
      const origin: TPoint = { x: 1, y: 1 }
      const target: TPoint = { x: 11, y: 11 }
      const circle = OIShapeCircle.createFromLine(DefaultStyle, origin, target)
      const elNotSelected = renderer.getSVGElement(circle)
      expect(elNotSelected.getAttribute("id")).toEqual(circle.id)
      expect(elNotSelected.getAttribute("type")).toEqual(SymbolType.Shape)
      expect(elNotSelected.getAttribute("kind")).toEqual(ShapeKind.Circle)
      expect(elNotSelected.getAttribute("filter")).toBeFalsy()
      circle.selected = true
      const elSelected = renderer.getSVGElement(circle)
      expect(elSelected.getAttribute("id")).toEqual(circle.id)
      expect(elSelected.getAttribute("type")).toEqual(SymbolType.Shape)
      expect(elSelected.getAttribute("kind")).toEqual(ShapeKind.Circle)
      expect(elSelected.getAttribute("filter")).toEqual(`url(#${ selectionFilterId })`)
    })
  })

  describe("parallelogram", () =>
  {
    test("should getSVGPath when origin is equal to target", () =>
    {
      const origin: TPoint = { x: 1, y: 1 }
      const target: TPoint = { x: 1, y: 1 }
      const parallelogram = OIShapeParallelogram.createFromLine(DefaultStyle, origin, target)
      expect(renderer.getSVGPath(parallelogram)).toEqual("M 1 1 L 1 1 L 1 1 L 1 1 Z")
    })
    test("should getSVGPath when origin is different to target", () =>
    {
      const origin: TPoint = { x: 0, y: 0 }
      const target: TPoint = { x: 10, y: 20 }
      const parallelogram = OIShapeParallelogram.createFromLine(DefaultStyle, origin, target)
      expect(renderer.getSVGPath(parallelogram)).toEqual("M 0 0 L 7.5 0 L 10 20 L 2.5 20 Z")
    })
    test("should getSVGElement with default style", () =>
    {
      const origin: TPoint = { x: 1, y: 1 }
      const target: TPoint = { x: 11, y: 11 }
      const parallelogram = OIShapeParallelogram.createFromLine({}, origin, target)
      const el = renderer.getSVGElement(parallelogram)
      expect(el.getAttribute("id")).toEqual(parallelogram.id)
      expect(el.getAttribute("type")).toEqual(SymbolType.Shape)
      expect(el.getAttribute("kind")).toEqual(ShapeKind.Parallelogram)
      expect(el.getAttribute("stroke")).toEqual(DefaultStyle.color)
      expect(el.getAttribute("stroke-width")).toEqual(DefaultStyle.width?.toString())
    })
    test("should getSVGElement with custom style", () =>
    {
      const style: TStyle = {
        color: "blue",
        width: 20
      }
      const origin: TPoint = { x: 0, y: 0 }
      const target: TPoint = { x: 10, y: 20 }
      const parallelogram = OIShapeParallelogram.createFromLine(style, origin, target)
      const el = renderer.getSVGElement(parallelogram)
      expect(el.getAttribute("id")).toEqual(parallelogram.id)
      expect(el.getAttribute("type")).toEqual(SymbolType.Shape)
      expect(el.getAttribute("kind")).toEqual(ShapeKind.Parallelogram)
      expect(el.getAttribute("stroke")).toEqual(style.color)
      expect(el.getAttribute("stroke-width")).toEqual(style.width?.toString())
    })
    test("should getSVGElement when selected", () =>
    {
      const origin: TPoint = { x: 1, y: 1 }
      const target: TPoint = { x: 11, y: 11 }
      const parallelogram = OIShapeParallelogram.createFromLine(DefaultStyle, origin, target)
      const elNotSelected = renderer.getSVGElement(parallelogram)
      expect(elNotSelected.getAttribute("id")).toEqual(parallelogram.id)
      expect(elNotSelected.getAttribute("type")).toEqual(SymbolType.Shape)
      expect(elNotSelected.getAttribute("kind")).toEqual(ShapeKind.Parallelogram)
      expect(elNotSelected.getAttribute("filter")).toBeFalsy()
      parallelogram.selected = true
      const elSelected = renderer.getSVGElement(parallelogram)
      expect(elSelected.getAttribute("id")).toEqual(parallelogram.id)
      expect(elSelected.getAttribute("type")).toEqual(SymbolType.Shape)
      expect(elSelected.getAttribute("kind")).toEqual(ShapeKind.Parallelogram)
      expect(elSelected.getAttribute("filter")).toEqual(`url(#${ selectionFilterId })`)
    })
  })

  describe("triangle", () =>
  {
    test("should getSVGPath when origin is equal to target", () =>
    {
      const origin: TPoint = { x: 1, y: 1 }
      const target: TPoint = { x: 1, y: 1 }
      const triangle = OIShapeTriangle.createFromLine(DefaultStyle, origin, target)
      expect(renderer.getSVGPath(triangle)).toEqual("M 1 1 L 1 1 L 1 1 Z")
    })
    test("should getSVGPath when origin is different to target", () =>
    {
      const origin: TPoint = { x: 0, y: 0 }
      const target: TPoint = { x: 10, y: 20 }
      const triangle = OIShapeTriangle.createFromLine(DefaultStyle, origin, target)
      expect(renderer.getSVGPath(triangle)).toEqual("M 0 0 L 10 0 L 5 20 Z")
    })
    test("should getSVGElement with default style", () =>
    {
      const origin: TPoint = { x: 1, y: 1 }
      const target: TPoint = { x: 11, y: 11 }
      const triangle = OIShapeTriangle.createFromLine({}, origin, target)
      const el = renderer.getSVGElement(triangle)
      expect(el.getAttribute("id")).toEqual(triangle.id)
      expect(el.getAttribute("type")).toEqual(SymbolType.Shape)
      expect(el.getAttribute("kind")).toEqual(ShapeKind.Triangle)
      expect(el.getAttribute("stroke")).toEqual(DefaultStyle.color)
      expect(el.getAttribute("stroke-width")).toEqual(DefaultStyle.width?.toString())
    })
    test("should getSVGElement with custom style", () =>
    {
      const style: TStyle = {
        color: "blue",
        width: 20
      }
      const origin: TPoint = { x: 1, y: 1 }
      const target: TPoint = { x: 11, y: 11 }
      const triangle = OIShapeTriangle.createFromLine(style, origin, target)
      const el = renderer.getSVGElement(triangle)
      expect(el.getAttribute("id")).toEqual(triangle.id)
      expect(el.getAttribute("type")).toEqual(SymbolType.Shape)
      expect(el.getAttribute("kind")).toEqual("triangle")
      expect(el.getAttribute("stroke")).toEqual(style.color)
      expect(el.getAttribute("stroke-width")).toEqual(style.width?.toString())
    })
    test("should getSVGElement when selected", () =>
    {
      const origin: TPoint = { x: 1, y: 1 }
      const target: TPoint = { x: 11, y: 11 }
      const triangle = OIShapeTriangle.createFromLine(DefaultStyle, origin, target)
      const elNotSelected = renderer.getSVGElement(triangle)
      expect(elNotSelected.getAttribute("id")).toEqual(triangle.id)
      expect(elNotSelected.getAttribute("type")).toEqual(SymbolType.Shape)
      expect(elNotSelected.getAttribute("kind")).toEqual(ShapeKind.Triangle)
      expect(elNotSelected.getAttribute("filter")).toBeFalsy()
      triangle.selected = true
      const elSelected = renderer.getSVGElement(triangle)
      expect(elSelected.getAttribute("id")).toEqual(triangle.id)
      expect(elSelected.getAttribute("type")).toEqual(SymbolType.Shape)
      expect(elSelected.getAttribute("kind")).toEqual(ShapeKind.Triangle)
      expect(elSelected.getAttribute("filter")).toEqual(`url(#${ selectionFilterId })`)
    })
  })
})
