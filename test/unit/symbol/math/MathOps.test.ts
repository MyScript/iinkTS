import { typesetGeometry } from "../../helpers"
import { BoxOps, MathUtil, MatrixTransform, OBBOps, TBox, TMathElement, TPoint, computeClosedEdges, computeTypesetSnapPoints, computeTypesetVertices } from "@/iink"

const elements: TMathElement[] = [
  {
    id: "e-1",
    label: "x",
    fontSize: 16,
    fontWeight: "normal",
    fontFamily: "Arial",
    color: "#000000",
    bounds: { x: 0, y: 0, width: 10, height: 16 },
  },
  {
    id: "e-2",
    label: "+",
    fontSize: 16,
    fontWeight: "normal",
    fontFamily: "Arial",
    color: "#000000",
    bounds: { x: 15, y: 0, width: 8, height: 16 },
  },
]
const point: TPoint = { x: 0, y: 16 }
const bounds: TBox = BoxOps.createFromBoxes(elements.map((e) => e.bounds))

describe("MathOps", () => {
  describe("create", () => {
    test("should initialise transform to identity", () => {
      expect(MathUtil.createMath(elements, point, bounds).transform).toEqual(MatrixTransform.identity())
    })
    test("should return a plain object with correct type", () => {
      const math = MathUtil.createMath(elements, point, bounds)
      expect(math.type).toBe("math")
      expect(typeof math).toBe("object")
      expect(math.elements).toBe(elements)
      expect(math.point).toBe(point)
      expect(math.bounds).toEqual(OBBOps.fromBox(bounds))
    })

    test("should initialize with empty decorators", () => {
      const math = MathUtil.createMath(elements, point, bounds)
      expect(math.decorators).toEqual([])
    })

    test("should initialize derived fields (vertices, snapPoints, edges)", () => {
      const math = MathUtil.createMath(elements, point, bounds)
      expect(computeTypesetVertices(OBBOps.toUnrotatedBox(math.bounds))).toHaveLength(4)
      expect(computeTypesetSnapPoints(OBBOps.toUnrotatedBox(math.bounds), math.point)).toHaveLength(5)
      expect(computeClosedEdges(computeTypesetVertices(OBBOps.toUnrotatedBox(math.bounds)))).toHaveLength(4)
    })

  })

  describe("createFromPartial", () => {
    test("should create from valid partial", () => {
      const math = MathUtil.createFromPartial({ elements, point, bounds })
      expect(math.elements).toHaveLength(2)
      expect(math.point).toEqual(point)
    })

    test("should carry a given transform through, merged onto identity", () => {
      const math = MathUtil.createFromPartial({ elements, point, bounds, transform: { tx: 5, ty: 6 } })
      expect(math.transform).toEqual({ xx: 1, yx: 0, xy: 0, yy: 1, tx: 5, ty: 6 })
    })

    test("should throw when elements is empty", () => {
      expect(() => MathUtil.createFromPartial({ elements: [], point, bounds })).toThrow()
    })

    test("should throw when point is missing", () => {
      expect(() => MathUtil.createFromPartial({ elements })).toThrow()
    })

    test("should throw when bounds is missing", () => {
      expect(() => MathUtil.createFromPartial({ elements, point })).toThrow()
    })

    test("should set custom id from partial", () => {
      const math = MathUtil.createFromPartial({ id: "my-math", elements, point, bounds })
      expect(math.id).toBe("my-math")
    })
  })

  describe("overlaps", () => {
    test("should return true when box contains a vertex", () => {
      const math = MathUtil.createMath(elements, point, bounds)
      const box: TBox = { x: -1, y: -1, width: 5, height: 5 }
      expect(typesetGeometry(math).overlapsBox(box)).toBe(true)
    })

    test("should return false when box is completely outside", () => {
      const math = MathUtil.createMath(elements, point, bounds)
      const box: TBox = { x: 1000, y: 1000, width: 5, height: 5 }
      expect(typesetGeometry(math).overlapsBox(box)).toBe(false)
    })

    test("should return true when large box wraps symbol", () => {
      const math = MathUtil.createMath(elements, point, bounds)
      const box: TBox = { x: -50, y: -50, width: 500, height: 500 }
      expect(typesetGeometry(math).overlapsBox(box)).toBe(true)
    })
  })

  describe("getChildrenOverlaps", () => {
    test("should return elements that overlap with given points", () => {
      const math = MathUtil.createMath(elements, point, bounds)
      // Point inside first element bounds (x: 0-10, y: 0-16)
      const result = MathUtil.getChildrenOverlaps(math, [{ x: 5, y: 8 }])
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe("e-1")
    })

    test("should return empty array when no points overlap", () => {
      const math = MathUtil.createMath(elements, point, bounds)
      const result = MathUtil.getChildrenOverlaps(math, [{ x: 1000, y: 1000 }])
      expect(result).toEqual([])
    })

    test("should return all elements when all overlap", () => {
      const math = MathUtil.createMath(elements, point, bounds)
      const result = MathUtil.getChildrenOverlaps(math, [
        { x: 5, y: 8 },
        { x: 18, y: 8 },
      ])
      expect(result).toHaveLength(2)
    })
  })

  describe("updateChildrenStyle", () => {
    test("should propagate color to all elements", () => {
      const math = MathUtil.createMath(structuredClone(elements), point, bounds)
      math.style.color = "#FF0000"
      MathUtil.updateChildrenStyle(math)
      math.elements.forEach((e) => expect(e.color).toBe("#FF0000"))
    })

    test("should update modificationDate", () => {
      const math = MathUtil.createMath(elements, point, bounds)
      const before = math.modificationDate
      math.style.color = "#ABC"
      MathUtil.updateChildrenStyle(math)
      expect(math.modificationDate).toBeGreaterThanOrEqual(before)
    })
  })

  describe("updateChildrenFont", () => {
    test("should propagate fontSize to all elements", () => {
      const math = MathUtil.createMath(structuredClone(elements), point, bounds)
      MathUtil.updateChildrenFont(math, { fontSize: 24 })
      math.elements.forEach((e) => expect(e.fontSize).toBe(24))
    })

    test("should propagate fontWeight to all elements", () => {
      const math = MathUtil.createMath(structuredClone(elements), point, bounds)
      MathUtil.updateChildrenFont(math, { fontWeight: "bold" })
      math.elements.forEach((e) => expect(e.fontWeight).toBe("bold"))
    })

    test("should propagate fontFamily to all elements", () => {
      const math = MathUtil.createMath(structuredClone(elements), point, bounds)
      MathUtil.updateChildrenFont(math, { fontFamily: "Times" })
      math.elements.forEach((e) => expect(e.fontFamily).toBe("Times"))
    })

    test("should not change fontWeight when not provided", () => {
      const math = MathUtil.createMath(structuredClone(elements), point, bounds)
      MathUtil.updateChildrenFont(math, { fontSize: 20 })
      math.elements.forEach((e) => expect(e.fontWeight).toBe("normal"))
    })
  })

  describe("getLabel", () => {
    test("should concatenate all element labels", () => {
      const math = MathUtil.createMath(elements, point, bounds)
      expect(MathUtil.getLabel(math)).toBe("x+")
    })

    test("should return empty string for empty elements", () => {
      const math = MathUtil.createMath([], point, bounds)
      expect(MathUtil.getLabel(math)).toBe("")
    })
  })
})
