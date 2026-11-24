import { computeChildrenOverlaps, computeTypesetSnapPoints, computeTypesetVertices, TBox, TPoint, TTypesetChild, typesetOverlapsBox } from "@/iink"

describe("Typeset.ts", () => {
  describe("typesetOverlapsBox", () => {
    const box: TBox = { x: 0, y: 0, width: 10, height: 10 }

    test("should return true when a vertex is inside the box", () => {
      expect(typesetOverlapsBox([{ x: 5, y: 5 }], [], box)).toBe(true)
    })

    test("should return true when an edge crosses a side of the box", () => {
      const edges = [{ p1: { x: -5, y: 5 }, p2: { x: 15, y: 5 } }]
      expect(typesetOverlapsBox([], edges, box)).toBe(true)
    })

    test("should return false when no vertex is inside and no edge crosses the box", () => {
      const edges = [{ p1: { x: 100, y: 100 }, p2: { x: 110, y: 110 } }]
      expect(typesetOverlapsBox([{ x: 100, y: 100 }], edges, box)).toBe(false)
    })
  })

  describe("computeChildrenOverlaps", () => {
    function buildChild(id: string, bounds: TBox): TTypesetChild {
      return { id, label: id, color: "#000000", bounds, fontSize: 10, fontWeight: "normal" }
    }

    test("should return children whose bounds contain a given point", () => {
      const inside = buildChild("inside", { x: 0, y: 0, width: 10, height: 10 })
      const outside = buildChild("outside", { x: 100, y: 100, width: 10, height: 10 })
      const result = computeChildrenOverlaps([inside, outside], [{ x: 5, y: 5 }])
      expect(result).toEqual([inside])
    })

    test("should return an empty array when no point falls inside any child", () => {
      const child = buildChild("child", { x: 0, y: 0, width: 10, height: 10 })
      expect(computeChildrenOverlaps([child], [{ x: 100, y: 100 }])).toEqual([])
    })
  })

  describe("computeTypesetVertices / computeTypesetSnapPoints", () => {
    // Turning a typeset symbol is composing its matrix now (`SymbolUtil.applyTransform`), applied
    // afterwards by `SymbolGeometry` — these two helpers only ever describe the raw, axis-aligned
    // box a typeset symbol was measured at, so there is no rotation left for them to apply.
    const box: TBox = { x: 10, y: 20, width: 40, height: 10 }

    test("should return the box's own corners, top-left first, clockwise", () => {
      expect(computeTypesetVertices(box)).toEqual([
        { x: 10, y: 20 },
        { x: 50, y: 20 },
        { x: 50, y: 30 },
        { x: 10, y: 30 },
      ])
    })

    test("should return snap points anchored on the given point", () => {
      // offsetY = (bounds.y + bounds.height) - point.y = 30 - 28 = 2, so the anchor sits 2px above
      // the box's bottom edge; the four side-midpoints below are offset by that same amount, plus
      // the box's own centre.
      const point: TPoint = { x: 10, y: 28 }
      expect(computeTypesetSnapPoints(box, point)).toEqual([
        { x: 10, y: 22 },
        { x: 50, y: 22 },
        { x: 50, y: 28 },
        { x: 10, y: 28 },
        { x: 30, y: 25 },
      ])
    })
  })
})
