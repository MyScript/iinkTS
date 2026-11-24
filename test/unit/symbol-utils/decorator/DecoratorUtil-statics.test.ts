import { decoratorGeometry } from "../../helpers"
import { describe, test, expect } from "@jest/globals"
import { OBBOps, SymbolType, DecoratorKind, MatrixTransform, DecoratorUtil } from "@/iink"

describe("DecoratorUtil", () => {
  describe("create", () => {
    test("should initialise transform to identity", () => {
      const d = DecoratorUtil.createDecorator(DecoratorKind.Underline, { color: "red", width: 2 })
      expect(d.transform).toEqual(MatrixTransform.identity())
    })
    test("should create a decorator with required fields", () => {
      const d = DecoratorUtil.createDecorator(DecoratorKind.Underline, { color: "red", width: 2 })
      expect(d.type).toBe(SymbolType.Decorator)
      expect(d.kind).toBe(DecoratorKind.Underline)
      expect(d.targetIds).toEqual([])
      expect(d.targetBounds).toBeUndefined()
      // Through the util, not `DecoratorUtil.computeVertices` directly: a decorator with no
      // `targetBounds` has no vertices, and that emptiness comes from `getGeometry`'s guard.
      // Calling the raw computation on a zero-size box would return two coincident points instead.
      expect(new DecoratorUtil().getGeometry(d).vertices).toEqual([])
    })

    test("should merge style with DefaultStyle", () => {
      const d = DecoratorUtil.createDecorator(DecoratorKind.Highlight, { color: "blue" })
      expect(d.style.color).toBe("blue")
      expect(typeof d.style.width).toBe("number")
    })

    test("should include targetIds when provided", () => {
      const ids = ["id1", "id2"]
      const d = DecoratorUtil.createDecorator(DecoratorKind.Surround, {}, ids)
      expect(d.targetIds).toEqual(ids)
    })

    test("should set targetBounds when provided", () => {
      const bounds = { x: 10, y: 20, width: 100, height: 30 }
      const d = DecoratorUtil.createDecorator(DecoratorKind.Strikethrough, {}, [], bounds)
      expect(d.targetBounds).toBeDefined()
      expect(OBBOps.toBox(d.targetBounds!)).toEqual(bounds)
      expect(DecoratorUtil.computeVertices(d.targetBounds!)).toHaveLength(2)
    })

    test("should generate a unique id prefixed with kind", () => {
      const d = DecoratorUtil.createDecorator(DecoratorKind.Underline, {})
      expect(d.id).toMatch(new RegExp(`^${DecoratorKind.Underline}-`))
    })

    test("should set numeric creationTime and modificationDate", () => {
      const before = Date.now()
      const d = DecoratorUtil.createDecorator(DecoratorKind.Highlight, {})
      const after = Date.now()
      expect(d.creationTime).toBeGreaterThanOrEqual(before)
      expect(d.creationTime).toBeLessThanOrEqual(after)
      expect(d.modificationDate).toBeGreaterThanOrEqual(before)
    })

    test("should coerce style.opacity to number", () => {
      const d = DecoratorUtil.createDecorator(DecoratorKind.Highlight, { opacity: 0.5 })
      expect(typeof d.style.opacity).toBe("number")
      expect(d.style.opacity).toBe(0.5)
    })
  })

  describe("setTargetBounds", () => {
    test("should set targetBounds", () => {
      const d = DecoratorUtil.createDecorator(DecoratorKind.Underline, {})
      const bounds = { x: 5, y: 10, width: 80, height: 20 }
      DecoratorUtil.setTargetBounds(d, OBBOps.fromBox(bounds))
      expect(OBBOps.toBox(d.targetBounds!)).toEqual(bounds)
    })

    test("should compute vertices at y midpoint", () => {
      const d = DecoratorUtil.createDecorator(DecoratorKind.Underline, {})
      const bounds = { x: 0, y: 10, width: 100, height: 20 }
      DecoratorUtil.setTargetBounds(d, OBBOps.fromBox(bounds))
      const yMid = 10 + 20 / 2 // = 20
      expect(DecoratorUtil.computeVertices(d.targetBounds!)).toEqual([
        { x: 0, y: yMid },
        { x: 100, y: yMid },
      ])
    })

    test("should set edges from first to second vertex", () => {
      const d = DecoratorUtil.createDecorator(DecoratorKind.Underline, {})
      DecoratorUtil.setTargetBounds(d, OBBOps.fromBox({ x: 0, y: 0, width: 50, height: 10 }))
      // The geometry is the target's box — a closed ring of four sides — while the line the
      // decorator draws is what `DecoratorUtil.computeVertices` gives and what it snaps on. The two
      // are different answers to different questions: where it is found, and what it renders.
      expect(new DecoratorUtil().getGeometry(d).edges).toHaveLength(4)
      expect(new DecoratorUtil().getSnapPoints(d)).toEqual(DecoratorUtil.computeVertices(d.targetBounds!))
    })

    test("should overwrite previous targetBounds when called again", () => {
      const d = DecoratorUtil.createDecorator(DecoratorKind.Underline, {})
      DecoratorUtil.setTargetBounds(d, OBBOps.fromBox({ x: 0, y: 0, width: 50, height: 10 }))
      const newBounds = { x: 100, y: 200, width: 300, height: 40 }
      DecoratorUtil.setTargetBounds(d, OBBOps.fromBox(newBounds))
      expect(OBBOps.toBox(d.targetBounds!)).toEqual(newBounds)
    })
  })

  describe("overlaps", () => {
    test("should return false when targetBounds is unset", () => {
      const d = DecoratorUtil.createDecorator(DecoratorKind.Highlight, {})
      expect(d.targetBounds).toBeUndefined()
      expect(decoratorGeometry(d).overlapsBox({ x: 0, y: 0, width: 200, height: 200 })).toBe(false)
    })

    test("should return true when targetBounds overlap the query box", () => {
      const d = DecoratorUtil.createDecorator(DecoratorKind.Highlight, {})
      DecoratorUtil.setTargetBounds(d, OBBOps.fromBox({ x: 10, y: 10, width: 50, height: 20 }))
      expect(decoratorGeometry(d).overlapsBox({ x: 0, y: 0, width: 30, height: 30 })).toBe(true)
    })

    test("should return false when targetBounds do not overlap the query box", () => {
      const d = DecoratorUtil.createDecorator(DecoratorKind.Highlight, {})
      DecoratorUtil.setTargetBounds(d, OBBOps.fromBox({ x: 200, y: 200, width: 50, height: 20 }))
      expect(decoratorGeometry(d).overlapsBox({ x: 0, y: 0, width: 100, height: 100 })).toBe(false)
    })
  })

  describe("refitTargetBounds", () => {
    test("fits the box in the decorator's own frame, so its matrix still places it", () => {
      const d = DecoratorUtil.createDecorator(DecoratorKind.Underline, {})
      d.transform = MatrixTransform.identity().rotate(Math.PI / 2, { x: 0, y: 0 })
      // In document coordinates, a 10x40 box: the 40x10 local box turned by 90 degrees.
      DecoratorUtil.refitTargetBounds(d, [OBBOps.fromBox({ x: -10, y: 0, width: 10, height: 40 })])
      expect(d.targetBounds!.center.x).toBeCloseTo(20)
      expect(d.targetBounds!.center.y).toBeCloseTo(5)
      expect(d.targetBounds!.width).toBeCloseTo(40)
      expect(d.targetBounds!.height).toBeCloseTo(10)
    })

    test("with an identity matrix, is the union of the targets' boxes", () => {
      const d = DecoratorUtil.createDecorator(DecoratorKind.Highlight, {})
      DecoratorUtil.refitTargetBounds(d, [
        OBBOps.fromBox({ x: 0, y: 0, width: 10, height: 10 }),
        OBBOps.fromBox({ x: 20, y: 5, width: 10, height: 10 }),
      ])
      expect(d.targetBounds).toEqual(OBBOps.fromBox({ x: 0, y: 0, width: 30, height: 15 }))
    })
  })
})
