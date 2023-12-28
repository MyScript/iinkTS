import { DefaultStyle, OISVGRendererShape, OIShapeCircle, OIShapeParallelogram, OIShapeRectangle, OIShapeTriangle, TPoint, TStyle } from "../../../src/iink"

describe("OISVGRendererShape.ts", () =>
{
  const selectionFilterId = "selectionFilterId"
  const renderer = new OISVGRendererShape(selectionFilterId)

  describe("rectangle", () =>
  {
    test("should getSVGPath when origin is equal to target", () =>
    {
      const origin: TPoint = { x: 1, y: 1 }
      const target: TPoint = { x: 1, y: 1 }
      const rect = OIShapeRectangle.createFromLine(DefaultStyle, origin, target)
      expect(renderer.getSVGPath(rect)).toEqual("M 1 1 h 0 v 0 h -0 Z")
    })
    test("should getSVGPath when origin is different to target", () =>
    {
      const origin: TPoint = { x: 1, y: 1 }
      const target: TPoint = { x: 11, y: 11 }
      const rect = OIShapeRectangle.createFromLine(DefaultStyle, origin, target)
      expect(renderer.getSVGPath(rect)).toEqual("M 1 1 h 10 v 10 h -10 Z")
    })
    test("should getSVGElement with default style", () =>
    {
      const origin: TPoint = { x: 1, y: 1 }
      const target: TPoint = { x: 11, y: 11 }
      const rect = OIShapeRectangle.createFromLine({}, origin, target)
      const el = renderer.getSVGElement(rect)
      expect(el.getAttribute("id")).toEqual(rect.id)
      expect(el.getAttribute("type")).toEqual("shape")
      expect(el.getAttribute("kind")).toEqual("rectangle")
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
      expect(el.getAttribute("type")).toEqual("shape")
      expect(el.getAttribute("kind")).toEqual("rectangle")
      expect(el.getAttribute("stroke")).toEqual(style.color)
      expect(el.getAttribute("stroke-width")).toEqual(style.width?.toString())
    })
    test("should getSVGElement when selected", () =>
    {
      const origin: TPoint = { x: 1, y: 1 }
      const target: TPoint = { x: 11, y: 11 }
      const rect = OIShapeRectangle.createFromLine(DefaultStyle, origin, target)
      rect.selected = true
      const el = renderer.getSVGElement(rect)
      expect(el.getAttribute("id")).toEqual(rect.id)
      expect(el.getAttribute("filter")).toEqual(`url(#${ selectionFilterId })`)
    })
  })

  describe("circle", () =>
  {
    test("should getSVGPath when origin is equal to target", () =>
    {
      const origin: TPoint = { x: 1, y: 1 }
      const target: TPoint = { x: 1, y: 1 }
      const circle = OIShapeCircle.createFromLine(DefaultStyle, origin, target)
      expect(renderer.getSVGPath(circle)).toEqual("M 1 1 m 0 0 a 0 0 0 1 0 -0 0 a 0 0 0 1 0 0 0 Z")
    })
    test("should getSVGPath when origin is different to target", () =>
    {
      const origin: TPoint = { x: 0, y: 0 }
      const target: TPoint = { x: 0, y: 10 }
      const circle = OIShapeCircle.createFromLine(DefaultStyle, origin, target)
      expect(renderer.getSVGPath(circle)).toEqual("M 0 5 m 5 0 a 5 5 0 1 0 -10 0 a 5 5 0 1 0 10 0 Z")
    })
    test("should getSVGElement with default style", () =>
    {
      const origin: TPoint = { x: 1, y: 1 }
      const target: TPoint = { x: 11, y: 11 }
      const circle = OIShapeCircle.createFromLine({}, origin, target)
      const el = renderer.getSVGElement(circle)
      expect(el.getAttribute("id")).toEqual(circle.id)
      expect(el.getAttribute("type")).toEqual("shape")
      expect(el.getAttribute("kind")).toEqual("circle")
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
      expect(el.getAttribute("type")).toEqual("shape")
      expect(el.getAttribute("kind")).toEqual("circle")
      expect(el.getAttribute("stroke")).toEqual(style.color)
      expect(el.getAttribute("stroke-width")).toEqual(style.width?.toString())
    })
    test("should getSVGElement when selected", () =>
    {
      const origin: TPoint = { x: 1, y: 1 }
      const target: TPoint = { x: 11, y: 11 }
      const circle = OIShapeCircle.createFromLine(DefaultStyle, origin, target)
      circle.selected = true
      const el = renderer.getSVGElement(circle)
      expect(el.getAttribute("id")).toEqual(circle.id)
      expect(el.getAttribute("filter")).toEqual(`url(#${ selectionFilterId })`)
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
      expect(el.getAttribute("type")).toEqual("shape")
      expect(el.getAttribute("kind")).toEqual("parallelogram")
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
      expect(el.getAttribute("type")).toEqual("shape")
      expect(el.getAttribute("kind")).toEqual("parallelogram")
      expect(el.getAttribute("stroke")).toEqual(style.color)
      expect(el.getAttribute("stroke-width")).toEqual(style.width?.toString())
    })
    test("should getSVGElement when selected", () =>
    {
      const origin: TPoint = { x: 1, y: 1 }
      const target: TPoint = { x: 11, y: 11 }
      const parallelogram = OIShapeParallelogram.createFromLine(DefaultStyle, origin, target)
      parallelogram.selected = true
      const el = renderer.getSVGElement(parallelogram)
      expect(el.getAttribute("id")).toEqual(parallelogram.id)
      expect(el.getAttribute("filter")).toEqual(`url(#${ selectionFilterId })`)
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
      expect(el.getAttribute("type")).toEqual("shape")
      expect(el.getAttribute("kind")).toEqual("triangle")
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
      expect(el.getAttribute("type")).toEqual("shape")
      expect(el.getAttribute("kind")).toEqual("triangle")
      expect(el.getAttribute("stroke")).toEqual(style.color)
      expect(el.getAttribute("stroke-width")).toEqual(style.width?.toString())
    })
    test("should getSVGElement when selected", () =>
    {
      const origin: TPoint = { x: 1, y: 1 }
      const target: TPoint = { x: 11, y: 11 }
      const triangle = OIShapeTriangle.createFromLine(DefaultStyle, origin, target)
      triangle.selected = true
      const el = renderer.getSVGElement(triangle)
      expect(el.getAttribute("id")).toEqual(triangle.id)
      expect(el.getAttribute("filter")).toEqual(`url(#${ selectionFilterId })`)
    })
  })
})
