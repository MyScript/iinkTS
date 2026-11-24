import { typesetGeometry } from "../../helpers"
import { BoxOps, MatrixTransform, OBBOps, TBox, TPoint, TSymbolChar, TextUtil, computeClosedEdges, computeTypesetSnapPoints, computeTypesetVertices } from "@/iink"

const chars: TSymbolChar[] = [
  {
    color: "blue",
    fontSize: 18,
    fontWeight: "normal",
    id: "id-1",
    label: "H",
    bounds: { x: 0, y: 0, width: 10, height: 20 },
  },
  {
    color: "blue",
    fontSize: 18,
    fontWeight: "normal",
    id: "id-2",
    label: "i",
    bounds: { x: 10, y: 0, width: 6, height: 20 },
  },
]
const point: TPoint = { x: 0, y: 20 }
const bounds: TBox = BoxOps.createFromBoxes(chars.map((c) => c.bounds))

describe("TextOps", () => {
  describe("create", () => {
    test("should initialise transform to identity", () => {
      expect(TextUtil.createText(chars, point, bounds).transform).toEqual(MatrixTransform.identity())
    })
    test("should return a plain object with correct type", () => {
      const text = TextUtil.createText(chars, point, bounds)
      expect(text.type).toBe("text")
      expect(typeof text).toBe("object")
      expect(text.chars).toBe(chars)
      expect(text.point).toBe(point)
      expect(text.bounds).toEqual(OBBOps.fromBox(bounds))
    })

    test("should initialize with empty decorators", () => {
      const text = TextUtil.createText(chars, point, bounds)
      expect(text.decorators).toEqual([])
    })

    test("should initialize derived fields (vertices, snapPoints, edges)", () => {
      const text = TextUtil.createText(chars, point, bounds)
      expect(computeTypesetVertices(OBBOps.toUnrotatedBox(text.bounds))).toHaveLength(4)
      expect(computeTypesetSnapPoints(OBBOps.toUnrotatedBox(text.bounds), text.point)).toHaveLength(5)
      expect(computeClosedEdges(computeTypesetVertices(OBBOps.toUnrotatedBox(text.bounds)))).toHaveLength(4)
    })

  })

  describe("createFromPartial", () => {
    test("should create from valid partial", () => {
      const text = TextUtil.createFromPartial({ chars, point, bounds })
      expect(text.chars).toEqual(chars)
      expect(text.point).toEqual(point)
    })

    test("should carry a given transform through, merged onto identity", () => {
      const text = TextUtil.createFromPartial({ chars, point, bounds, transform: { tx: 5, ty: 6 } })
      expect(text.transform).toEqual({ xx: 1, yx: 0, xy: 0, yy: 1, tx: 5, ty: 6 })
    })

    test("should throw when chars is empty", () => {
      expect(() => TextUtil.createFromPartial({ chars: [], point, bounds })).toThrow()
    })

    test("should throw when point is missing", () => {
      expect(() => TextUtil.createFromPartial({ chars })).toThrow()
    })

    test("should throw when bounds is missing", () => {
      expect(() => TextUtil.createFromPartial({ chars, point })).toThrow()
    })

    test("should set custom id from partial", () => {
      const text = TextUtil.createFromPartial({ id: "my-id", chars, point, bounds })
      expect(text.id).toBe("my-id")
    })
  })

  describe("overlaps", () => {
    test("should return true when box contains a vertex", () => {
      const text = TextUtil.createText(chars, point, bounds)
      const box: TBox = { x: -1, y: -1, width: 5, height: 5 }
      expect(typesetGeometry(text).overlapsBox(box)).toBe(true)
    })

    test("should return false when box is completely outside", () => {
      const text = TextUtil.createText(chars, point, bounds)
      const box: TBox = { x: 1000, y: 1000, width: 5, height: 5 }
      expect(typesetGeometry(text).overlapsBox(box)).toBe(false)
    })

    test("should return true when box is large and wraps symbol", () => {
      const text = TextUtil.createText(chars, point, bounds)
      const box: TBox = { x: -50, y: -50, width: 500, height: 500 }
      expect(typesetGeometry(text).overlapsBox(box)).toBe(true)
    })
  })

  describe("getChildrenOverlaps", () => {
    test("should return chars that overlap with given points", () => {
      const text = TextUtil.createText(chars, point, bounds)
      // Point inside the first char bounds (x: 0-10, y: 0-20)
      const result = TextUtil.getChildrenOverlaps(text, [{ x: 5, y: 10 }])
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe("id-1")
    })

    test("should return empty array when no points overlap", () => {
      const text = TextUtil.createText(chars, point, bounds)
      const result = TextUtil.getChildrenOverlaps(text, [{ x: 1000, y: 1000 }])
      expect(result).toEqual([])
    })

    test("should return all chars when all overlap", () => {
      const text = TextUtil.createText(chars, point, bounds)
      // Points inside both chars
      const result = TextUtil.getChildrenOverlaps(text, [
        { x: 5, y: 10 },
        { x: 13, y: 10 },
      ])
      expect(result).toHaveLength(2)
    })
  })

  describe("updateChildrenStyle", () => {
    test("should propagate color to all chars", () => {
      const text = TextUtil.createText(structuredClone(chars), point, bounds)
      text.style.color = "#FF0000"
      TextUtil.updateChildrenStyle(text)
      text.chars.forEach((c) => expect(c.color).toBe("#FF0000"))
    })

    test("should update modificationDate", () => {
      const text = TextUtil.createText(chars, point, bounds)
      const before = text.modificationDate
      text.style.color = "#ABC"
      TextUtil.updateChildrenStyle(text)
      expect(text.modificationDate).toBeGreaterThanOrEqual(before)
    })
  })

  describe("updateChildrenFont", () => {
    test("should propagate fontSize to all chars", () => {
      const text = TextUtil.createText(structuredClone(chars), point, bounds)
      TextUtil.updateChildrenFont(text, { fontSize: 24 })
      text.chars.forEach((c) => expect(c.fontSize).toBe(24))
    })

    test("should propagate fontWeight to all chars", () => {
      const text = TextUtil.createText(structuredClone(chars), point, bounds)
      TextUtil.updateChildrenFont(text, { fontWeight: "bold" })
      text.chars.forEach((c) => expect(c.fontWeight).toBe("bold"))
    })

    test("should not change fontWeight when not provided", () => {
      const text = TextUtil.createText(structuredClone(chars), point, bounds)
      TextUtil.updateChildrenFont(text, { fontSize: 20 })
      text.chars.forEach((c) => expect(c.fontWeight).toBe("normal"))
    })
  })

  describe("getLabel", () => {
    test("should concatenate all char labels", () => {
      const text = TextUtil.createText(chars, point, bounds)
      expect(TextUtil.getLabel(text)).toBe("Hi")
    })

    test("should return empty string for empty chars", () => {
      const text = TextUtil.createText([], point, bounds)
      expect(TextUtil.getLabel(text)).toBe("")
    })
  })
})
