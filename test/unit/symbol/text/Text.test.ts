import { typesetGeometry } from "../../helpers"
import { BoxOps, OBBOps, TBox, TPoint, TSymbolChar, TextUtil, computeClosedEdges, computeTypesetSnapPoints, computeTypesetVertices } from "@/iink"

describe("Text.ts", () => {
  const chars: TSymbolChar[] = [
    {
      color: "blue",
      fontSize: 18,
      fontWeight: "normal",
      id: "id-1",
      label: "first",
      bounds: { height: 10, width: 5, x: 1, y: 2 },
    },
    {
      color: "red",
      fontSize: 12,
      fontWeight: "normal",
      id: "id-2",
      label: "second",
      bounds: { height: 10, width: 5, x: 6, y: 2 },
    },
  ]
  const point: TPoint = { x: 0, y: 0 }
  const box = BoxOps.createFromBoxes(chars.map((c) => c.bounds))
  test("should instanciate", () => {
    const text = TextUtil.createText(chars, point, box)
    expect(text).toBeDefined()
  })

  describe("properties", () => {
    test("should get label", () => {
      const text = TextUtil.createText(chars, point, box)
      expect(TextUtil.getLabel(text)).toEqual("firstsecond")
    })
    test(`should get vertices`, () => {
      const text = TextUtil.createText(chars, point, box)
      expect(computeTypesetVertices(OBBOps.toUnrotatedBox(text.bounds))).toEqual(BoxOps.getCorners(box))
    })
    test(`should get edges`, () => {
      const text = TextUtil.createText(chars, point, box)
      expect(computeClosedEdges(computeTypesetVertices(OBBOps.toUnrotatedBox(text.bounds)))).toEqual([
        { p1: { x: 1, y: 2 }, p2: { x: 11, y: 2 } },
        { p1: { x: 11, y: 2 }, p2: { x: 11, y: 12 } },
        { p1: { x: 11, y: 12 }, p2: { x: 1, y: 12 } },
        { p1: { x: 1, y: 12 }, p2: { x: 1, y: 2 } },
      ])
    })
    test(`should get snapPoints`, () => {
      const text = TextUtil.createText(chars, point, box)
      expect(computeTypesetSnapPoints(OBBOps.toUnrotatedBox(text.bounds), text.point)).toEqual([
        { x: 1, y: 14 },
        { x: 11, y: 14 },
        { x: 11, y: 0 },
        { x: 1, y: 0 },
        { x: 6, y: 7 },
      ])
    })
  })

  describe("overlaps", () => {
    const text = TextUtil.createText(chars, point, box)
    test(`should return true if partially wrap`, () => {
      const boundaries: TBox = { height: 10, width: 10, x: -5, y: -5 }
      expect(typesetGeometry(text).overlapsBox(boundaries)).toEqual(true)
    })
    test(`should return true if totally wrap`, () => {
      const boundaries: TBox = { height: 500, width: 500, x: -25, y: -25 }
      expect(typesetGeometry(text).overlapsBox(boundaries)).toEqual(true)
    })
    test(`should return false if box is outside`, () => {
      const boundaries: TBox = { height: 2, width: 2, x: -50, y: -50 }
      expect(typesetGeometry(text).overlapsBox(boundaries)).toEqual(false)
    })
  })

  describe("getChildrenOverlaps", () => {
    test(`should return only first char`, () => {
      const text = TextUtil.createText(chars, point, box)
      const points: TPoint[] = [
        { x: 3, y: 0 },
        { x: 2, y: 3 },
        { x: 4, y: 7 },
      ]
      expect(TextUtil.getChildrenOverlaps(text, points)).toEqual([chars[0]])
    })
    test(`should return all char`, () => {
      const text = TextUtil.createText(chars, point, box)
      const points: TPoint[] = [
        { x: 3, y: 0 },
        { x: 2, y: 3 },
        { x: 4, y: 7 },
        { x: 8, y: 7 },
        { x: 10, y: 6 },
      ]
      expect(TextUtil.getChildrenOverlaps(text, points)).toEqual(chars)
    })
    test(`should return false if box is outside`, () => {
      const text = TextUtil.createText(chars, point, box)
      const points: TPoint[] = [
        { x: 13, y: 0 },
        { x: 12, y: 3 },
        { x: 14, y: 7 },
      ]
      expect(TextUtil.getChildrenOverlaps(text, points)).toEqual([])
    })
  })

  describe("clone", () => {
    test("should return clone", () => {
      const text = TextUtil.createText(chars, point, box)
      const clone = structuredClone(text)
      expect(clone).toEqual(text)
      expect(clone).not.toBe(text)
    })
  })
})

describe("Text derived fields, with the angle recorded on the bounds", () => {
  const chars: TSymbolChar[] = [
    { id: "c1", label: "a", color: "#000", fontSize: 10, fontWeight: "normal", bounds: { x: 0, y: 0, width: 40, height: 10 } },
  ]

  test("should keep the recorded angle, which callers read as the on-screen extent", () => {
    // `bounds.angle` is deliberately still written: `OBBOps.toBox` uses it to report the area the
    // symbol covers, which the erase hit box, decorator bounds and annotation extents depend on.
    const text = TextUtil.createText(chars, { x: 0, y: 0 }, { x: 0, y: 0, width: 40, height: 10 })
    text.bounds.angle = 30
    // The envelope of a rotated box is not simply bigger: a long thin box projects *narrower* as it
    // turns (39.64 here) while growing taller (28.66). Height is the side that shows the growth.
    const envelope = OBBOps.toBox(text.bounds)
    expect(envelope.height).toBeGreaterThan(10)
    expect(OBBOps.toUnrotatedBox(text.bounds)).toEqual({ x: 0, y: 0, width: 40, height: 10 })
  })
})
