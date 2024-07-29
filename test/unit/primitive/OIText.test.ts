import { Box, OIText, SELECTION_MARGIN, TBoundingBox, TOISymbolChar, TPoint } from "../../../src/iink"

describe("OIText.ts", () =>
{
  const chars: TOISymbolChar[] = [
    {
      color: "blue",
      fontSize: 18,
      fontWeight: "normal",
      id: 'id-1',
      label: "first",
      bounds: { height: 10, width: 5, x: 1, y: 2 }
    },
    {
      color: "red",
      fontSize: 12,
      fontWeight: "normal",
      id: 'id-2',
      label: "second",
      bounds: { height: 10, width: 5, x: 6, y: 2 }
    },
  ]
  const point: TPoint = { x: 0, y: 0 }
  const box = Box.createFromBoxes(chars.map(c => c.bounds))
  test("should instanciate", () =>
  {
    const text = new OIText(chars, point, box)
    expect(text).toBeDefined()
  })

  describe("properties", () =>
  {
    test("should get label", () =>
    {
      const text = new OIText(chars, point, box)
      expect(text.label).toEqual("firstsecond")
    })
    test(`should get vertices without rotation`, () =>
    {
      const text = new OIText(chars, point, box)
      expect(text.vertices).toEqual(box.corners)
    })
    test(`should get vertices with rotation 90°`, () =>
    {
      const text = new OIText(chars, point, box)
      text.rotation = {
        degree: 90,
        center: { x: 0, y: 0 }
      }
      expect(text.vertices).toEqual([
        { x: -2, y: 1 },
        { x: -2, y: 11 },
        { x: -12, y: 11 },
        { x: -12, y: 1 },
      ])
    })
    test(`should get edges without rotation`, () =>
    {
      const text = new OIText(chars, point, box)
      expect(text.edges).toEqual([
        { "p1": { "x": 1, "y": 2 }, "p2": { "x": 11, "y": 2 } },
        { "p1": { "x": 11, "y": 2 }, "p2": { "x": 11, "y": 12 } },
        { "p1": { "x": 11, "y": 12 }, "p2": { "x": 1, "y": 12 } },
        { "p1": { "x": 1, "y": 2 }, "p2": { "x": 1, "y": 12 } }
      ])
    })
    test(`should get edges with rotation 90°`, () =>
    {
      const text = new OIText(chars, point, box)
      text.rotation = {
        degree: 90,
        center: { x: 0, y: 0 }
      }
      expect(text.edges).toEqual([
        { "p1": { "x": -2, "y": 1 }, "p2": { "x": -2, "y": 11 } },
        { "p1": { "x": -2, "y": 11 }, "p2": { "x": -12, "y": 11 } },
        { "p1": { "x": -12, "y": 11 }, "p2": { "x": -12, "y": 1 } },
        { "p1": { "x": -2, "y": 1 }, "p2": { "x": -12, "y": 1 } }
      ])
    })
    test(`should get snapPoints without rotation`, () =>
    {
      const text = new OIText(chars, point, box)
      expect(text.snapPoints).toEqual([
        { "x": 1, "y": 14 },
        { "x": 11, "y": 14 },
        { "x": 11, "y": 0 },
        { "x": 1, "y": 0 },
        { "x": 6, "y": 7 }
    ])
    })
    test(`should get snapPoints with rotation 90°`, () =>
    {
      const text = new OIText(chars, point, box)
      text.rotation = {
        degree: 90,
        center: { x: 0, y: 0 }
      }
      expect(text.snapPoints).toEqual([
        { "x": -14, "y": 1 },
        { "x": -14, "y": 11 },
        { "x": -0, "y": 11 },
        { "x": -0, "y": 1 },
        { "x": -7, "y": 6 }
      ])
    })
  })

  describe("isCloseToPoint", () =>
  {
    const text = new OIText(chars, point, box)
    test(`should return true when the point is within ${ SELECTION_MARGIN } pixel vertice`, () =>
    {
      const closePoint: TPoint = { x: 0, y: 0 + SELECTION_MARGIN / 2 }
      expect(text.isCloseToPoint(closePoint)).toEqual(true)
    })
    test(`should return true when the point is within ${ SELECTION_MARGIN } pixel from edge`, () =>
    {
      const closePoint: TPoint = { x: 5, y: SELECTION_MARGIN / 2 }
      expect(text.isCloseToPoint(closePoint)).toEqual(true)
    })
    test(`should return false when the point is more than ${ SELECTION_MARGIN } pixel from an edge`, () =>
    {
      const closePoint: TPoint = { x: 5, y: 15 + SELECTION_MARGIN * 2 }
      expect(text.isCloseToPoint(closePoint)).toEqual(false)
    })
  })

  describe("overlaps", () =>
  {
    const text = new OIText(chars, point, box)
    test(`should return true if partially wrap`, () =>
    {
      const boundaries: TBoundingBox = { height: 10, width: 10, x: -5, y: -5 }
      expect(text.overlaps(boundaries)).toEqual(true)
    })
    test(`should return true if totally wrap`, () =>
    {
      const boundaries: TBoundingBox = { height: 500, width: 500, x: -25, y: -25 }
      expect(text.overlaps(boundaries)).toEqual(true)
    })
    test(`should return false if box is outside`, () =>
    {
      const boundaries: TBoundingBox = { height: 2, width: 2, x: -50, y: -50 }
      expect(text.overlaps(boundaries)).toEqual(false)
    })
  })

  describe("getCharsOverlaps", () =>
  {
    test(`should return only first char without rotation`, () =>
    {
      const text = new OIText(chars, point, box)
      const points: TPoint[] = [
        { x: 3, y: 0 },
        { x: 2, y: 3 },
        { x: 4, y: 7 },
      ]
      expect(text.getCharsOverlaps(points)).toEqual([chars[0]])
    })
    test(`should return all char without rotation`, () =>
    {
      const text = new OIText(chars, point, box)
      const points: TPoint[] = [
        { x: 3, y: 0 },
        { x: 2, y: 3 },
        { x: 4, y: 7 },
        { x: 8, y: 7 },
        { x: 10, y: 6 },
      ]
      expect(text.getCharsOverlaps(points)).toEqual(chars)
    })
    test(`should return false if box is outside without rotation`, () =>
    {
      const text = new OIText(chars, point, box)
      const points: TPoint[] = [
        { x: 13, y: 0 },
        { x: 12, y: 3 },
        { x: 14, y: 7 },
      ]
      expect(text.getCharsOverlaps(points)).toEqual([])
    })
    test(`should return only second char with rotation 180°`, () =>
    {
      const text = new OIText(chars, point, box)
      text.rotation = {
        center: text.bounds.center,
        degree: 180
      }
      const points: TPoint[] = [
        { x: 3, y: 0 },
        { x: 2, y: 3 },
        { x: 4, y: 7 },
      ]
      expect(text.getCharsOverlaps(points)).toEqual([chars[1]])
    })
    test(`should return all char with rotation 180°`, () =>
    {
      const text = new OIText(chars, point, box)
      text.rotation = {
        center: text.bounds.center,
        degree: 90
      }
      const points: TPoint[] = [
        { x: 3, y: 0 },
        { x: 2, y: 3 },
        { x: 4, y: 7 },
        { x: 8, y: 7 },
        { x: 10, y: 6 },
      ]
      expect(text.getCharsOverlaps(points)).toEqual(chars)
    })
    test(`should return false if box is outside with rotation 180°`, () =>
    {
      const text = new OIText(chars, point, box)
      text.rotation = {
        center: text.bounds.center,
        degree: 90
      }
      const points: TPoint[] = [
        { x: 13, y: 0 },
        { x: 12, y: 3 },
        { x: 14, y: 7 },
      ]
      expect(text.getCharsOverlaps(points)).toEqual([])
    })
  })

  describe("clone", () =>
  {
    test("should return clone", () =>
    {
      const text = new OIText(chars, point, box)
      const clone = text.clone()
      expect(clone).toEqual(text)
      expect(clone).not.toBe(text)
    })
  })
})
