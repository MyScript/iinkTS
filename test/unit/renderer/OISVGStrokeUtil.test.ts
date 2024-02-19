import { DefaultStyle, OISVGStrokeUtil, OIStroke, TStyle } from "../../../src/iink"

describe("OISVGStrokeUtil.ts", () =>
{
  const selectionFilterId = "selectionFilterId"
  const removalFilterId = "removalFilterId"
  const renderer = new OISVGStrokeUtil(selectionFilterId, removalFilterId)

  test("should getSVGPath when no pointers", () =>
  {
    const stroke = new OIStroke(DefaultStyle, 1)
    expect(renderer.getSVGPath(stroke)).toEqual("")
  })

  test("should getSVGPath when 2 pointers", () =>
  {
    const stroke = new OIStroke(DefaultStyle, 1)
    stroke.pointers.push({ p: 1, t: 1, x: 1, y: 1 })
    stroke.pointers.push({ p: 1, t: 1, x: 10, y: 1 })
    expect(renderer.getSVGPath(stroke)).toEqual("M 1 1 m -2.4 0 a 2.4 2.4 0 1 0 4.8 0 a 2.4 2.4 0 1 0 -4.8 0")
  })

  test("should getSVGPath when mote than 2 pointers", () =>
  {
    const stroke = new OIStroke(DefaultStyle, 1)
    stroke.pointers.push({ p: 1, t: 1, x: 1, y: 1 })
    stroke.pointers.push({ p: 1, t: 1, x: 5, y: 5 })
    stroke.pointers.push({ p: 1, t: 1, x: 7, y: 5 })
    stroke.pointers.push({ p: 1, t: 1, x: 10, y: 1 })
    expect(renderer.getSVGPath(stroke)).toContain("M 1 1 m -4 0 a 4 4 0 1 0 8 0 a 4 4 0 1 0 -8 0")
  })

  test("should getSVGElement with default style", () =>
  {
    const stroke = new OIStroke({}, 1)
    stroke.pointers.push({ p: 1, t: 1, x: 1, y: 1 })
    stroke.pointers.push({ p: 1, t: 1, x: 10, y: 1 })
    const el = renderer.getSVGElement(stroke)
    expect(el.getAttribute("id")).toEqual(stroke.id)
    expect(el.getAttribute("type")).toEqual("stroke")
    expect(el.getAttribute("fill")).toEqual(DefaultStyle.color)
    expect(el.getAttribute("stroke-width")).toEqual(DefaultStyle.width?.toString())
  })

  test("should getSVGElement with custom style", () =>
  {
    const style: TStyle = {
      color: "blue",
      width: 20
    }
    const stroke = new OIStroke(style, 1)
    stroke.pointers.push({ p: 1, t: 1, x: 1, y: 1 })
    stroke.pointers.push({ p: 1, t: 1, x: 10, y: 1 })
    const el = renderer.getSVGElement(stroke)
    expect(el.getAttribute("id")).toEqual(stroke.id)
    expect(el.getAttribute("type")).toEqual("stroke")
    expect(el.getAttribute("fill")).toEqual(style.color)
    expect(el.getAttribute("stroke-width")).toEqual(style.width?.toString())
  })

  test("should getSVGElement when selected", () =>
  {
    const stroke = new OIStroke(DefaultStyle, 1)
    stroke.pointers.push({ p: 1, t: 1, x: 1, y: 1 })
    stroke.pointers.push({ p: 1, t: 1, x: 10, y: 1 })
    stroke.selected = true
    const el = renderer.getSVGElement(stroke)
    expect(el.getAttribute("id")).toEqual(stroke.id)
    expect(el.querySelector("path")?.getAttribute("filter")).toEqual(`url(#${ selectionFilterId })`)
  })
})
