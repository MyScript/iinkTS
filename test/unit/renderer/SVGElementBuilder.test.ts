import {
  SVGBuilder,
  TPoint,
} from "../../../src/iink"

describe("SVGBuilder.ts", () =>
{
  test("should createLayer", () =>
  {
    const x = 1, y = 5, width = 42, height = 57, attrs = { attr1: "pouet"}
    const layer = SVGBuilder.createLayer({ x, y, width, height }, attrs)
    expect(layer).toBeDefined()
    expect(layer.getAttribute("width")).toEqual(`${width}px`)
    expect(layer.getAttribute("height")).toEqual(`${height}px`)
    expect(layer.getAttribute("viewBox")).toEqual(`${x}, ${y}, ${ width }, ${ height }`)
    expect(layer.getAttribute("attr1")).toEqual(attrs.attr1)
  })

  test("should createGroup", () =>
  {
    const attrs = { attr1: "pouet"}
    const g = SVGBuilder.createGroup(attrs)
    expect(g).toBeDefined()
    expect(g.getAttribute("attr1")).toEqual(attrs.attr1)
  })

  test("should createLine", () =>
  {
    const p1: TPoint = { x: 1, y: 1 }
    const p2: TPoint = { x: 5, y: 5 }
    const attrs = { attr1: "pouet"}
    const g = SVGBuilder.createLine(p1, p2, attrs)
    expect(g).toBeDefined()
    expect(g.getAttribute("x1")).toEqual(p1.x.toString())
    expect(g.getAttribute("y1")).toEqual(p1.y.toString())
    expect(g.getAttribute("x2")).toEqual(p2.x.toString())
    expect(g.getAttribute("x2")).toEqual(p2.y.toString())
    expect(g.getAttribute("attr1")).toEqual(attrs.attr1)
  })

  test("should createCircle", () =>
  {
    const p1: TPoint = { x: 1, y: 1 }
    const radius = 12
    const attrs = { attr1: "pouet"}
    const g = SVGBuilder.createCircle(p1, radius, attrs)
    expect(g).toBeDefined()
    expect(g.getAttribute("cx")).toEqual(p1.x.toString())
    expect(g.getAttribute("cy")).toEqual(p1.y.toString())
    expect(g.getAttribute("r")).toEqual(radius.toString())
    expect(g.getAttribute("attr1")).toEqual(attrs.attr1)
  })

})
