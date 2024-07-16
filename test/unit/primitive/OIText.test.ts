import { Box, OIText, SELECTION_MARGIN, TBoundingBox, TOISymbolChar, TPoint } from "../../../src/iink"

describe("OIText.ts", () =>
{
  const chars: TOISymbolChar[] = [
    {
      color: "blue",
      fontSize: 18,
      fontWeight: 400,
      id: 'id-1',
      label: "first",
      bounds: { height: 10, width: 5, x: 1, y: 2}
    },
    {
      color: "red",
      fontSize: 12,
      fontWeight: 200,
      id: 'id-2',
      label: "second",
      bounds: { height: 10, width: 5, x: 6, y: 2}
    },
  ]
  const point: TPoint = { x: 0, y: 0 }
  const boundingBox: TBoundingBox = { height: 100, width: 100, x: 0, y: 0 }
  const box = new Box(boundingBox)
  test("should instanciate", () =>
  {
    const text = new OIText(chars, point, box)
    expect(text).toBeDefined()
  })

  test("should get label", () =>
  {
    const text = new OIText(chars, point, box)
    expect(text.label).toEqual("firstsecond")
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
      const closePoint: TPoint = { x: 50, y: SELECTION_MARGIN / 2 }
      expect(text.isCloseToPoint(closePoint)).toEqual(true)
    })
    test(`should return false when the point is more than ${ SELECTION_MARGIN } pixel from an edge`, () =>
    {
      const closePoint: TPoint = { x: 50, y: SELECTION_MARGIN * 2 }
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
