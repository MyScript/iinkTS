import { ellipseGeometry } from "../../helpers"
import { DefaultStyle, MatrixTransform, OBBOps, ShapeUtil, TBox, TPoint, TStyle } from "@/iink"

describe("ShapeUtil ellipse statics", () => {
  describe("create", () => {
    test("should initialise transform to identity", () => {
      expect(ShapeUtil.createEllipse({ x: 0, y: 0 }, 5, 10, 0).transform).toEqual(MatrixTransform.identity())
    })
    test("should create with default style", () => {
      const ellipse = ShapeUtil.createEllipse({ x: 0, y: 0 }, 5, 10, 0)
      expect(ellipse.style).toEqual(DefaultStyle)
      expect(ellipse.creationTime).toBeLessThanOrEqual(Date.now())
    })
    test("should create with custom style", () => {
      const style: TStyle = { color: "red", width: 4 }
      const ellipse = ShapeUtil.createEllipse({ x: 0, y: 0 }, 5, 10, 0, style)
      expect(ellipse.style).toEqual(expect.objectContaining(style))
    })
    test("should compute bounds from vertices", () => {
      const ellipse = ShapeUtil.createEllipse({ x: 5, y: 0 }, 5, 10, 0)
      expect(OBBOps.toBox(OBBOps.createFromPoints(ellipseGeometry(ellipse).vertices)).x).toBeCloseTo(0, 0)
      expect(OBBOps.toBox(OBBOps.createFromPoints(ellipseGeometry(ellipse).vertices)).y).toBeCloseTo(-10, 0)
      expect(OBBOps.createFromPoints(ellipseGeometry(ellipse).vertices).width).toBeCloseTo(10, 0)
      expect(OBBOps.createFromPoints(ellipseGeometry(ellipse).vertices).height).toBeCloseTo(20, 0)
    })
    test("should compute minimum 8 vertices for small ellipse", () => {
      const ellipse = ShapeUtil.createEllipse({ x: 0, y: 0 }, 5, 10, 0)
      expect(ellipseGeometry(ellipse).vertices).toHaveLength(8)
    })
    test("should compute more vertices for large ellipse", () => {
      const ellipse = ShapeUtil.createEllipse({ x: 0, y: 0 }, 50, 100, 0)
      expect(ellipseGeometry(ellipse).vertices).toHaveLength(50)
    })
    // Same reason as the circle: a length assertion cannot see the tessellation drift. Oracle is
    // the un-rotated parametric ellipse `(cx + rx·cos θ, cy + ry·sin θ)`, written out here.
    test("should tessellate an un-rotated ellipse from its +x apex", () => {
      const ellipse = ShapeUtil.createEllipse({ x: 0, y: 0 }, 5, 10, 0)
      const vertices = ellipseGeometry(ellipse).vertices
      expect(vertices).toHaveLength(8)
      vertices.forEach((vertex, index) => {
        const theta = (2 * Math.PI * index) / 8
        expect(vertex.x).toBeCloseTo(5 * Math.cos(theta), 3)
        expect(vertex.y).toBeCloseTo(10 * Math.sin(theta), 3)
      })
    })
    test("should generate unique ids", () => {
      const e1 = ShapeUtil.createEllipse({ x: 0, y: 0 }, 5, 5, 0)
      const e2 = ShapeUtil.createEllipse({ x: 0, y: 0 }, 5, 5, 0)
      expect(e1.id).not.toEqual(e2.id)
    })
  })

  describe("createFromPartial", () => {
    test("should create from valid partial", () => {
      const partial = { center: { x: 0, y: 0 }, radiusX: 5, radiusY: 10, orientation: 0 }
      const ellipse = ShapeUtil.createEllipseFromPartial(partial)
      expect(ellipse.radiusX).toEqual(5)
      expect(ellipse.radiusY).toEqual(10)
    })
    test("should carry a given transform through, merged onto identity", () => {
      const partial = { center: { x: 0, y: 0 }, radiusX: 5, radiusY: 10, transform: { tx: 5, ty: 6 } }
      const ellipse = ShapeUtil.createEllipseFromPartial(partial)
      expect(ellipse.transform).toEqual({ xx: 1, yx: 0, xy: 0, yy: 1, tx: 5, ty: 6 })
    })
    test("should preserve id", () => {
      const partial = { id: "my-id", center: { x: 0, y: 0 }, radiusX: 5, radiusY: 5 }
      const ellipse = ShapeUtil.createEllipseFromPartial(partial)
      expect(ellipse.id).toEqual("my-id")
    })
    test("should throw if center missing", () => {
      expect(() => ShapeUtil.createEllipseFromPartial({ radiusX: 5, radiusY: 5 })).toThrow()
    })
    test("should throw if radiusX missing", () => {
      expect(() => ShapeUtil.createEllipseFromPartial({ center: { x: 0, y: 0 }, radiusY: 5 })).toThrow()
    })
    test("should throw if radiusY missing", () => {
      expect(() => ShapeUtil.createEllipseFromPartial({ center: { x: 0, y: 0 }, radiusX: 5 })).toThrow()
    })
  })

  describe("overlaps", () => {
    const ellipse = ShapeUtil.createEllipse({ x: 5, y: 0 }, 5, 10, 0)
    test("should return true if partially intersects", () => {
      const box: TBox = { height: 10, width: 10, x: -5, y: -5 }
      expect(ellipseGeometry(ellipse).overlapsBox(box)).toEqual(true)
    })
    test("should return true if totally wraps", () => {
      const box: TBox = { height: 50, width: 50, x: -25, y: -25 }
      expect(ellipseGeometry(ellipse).overlapsBox(box)).toEqual(true)
    })
    test("should return false if box is outside", () => {
      const box: TBox = { height: 2, width: 2, x: 50, y: 50 }
      expect(ellipseGeometry(ellipse).overlapsBox(box)).toEqual(false)
    })
    test("should return false if box is fully inside", () => {
      const box: TBox = { height: 2, width: 2, x: 9, y: 9 }
      expect(ellipseGeometry(ellipse).overlapsBox(box)).toEqual(false)
    })
  })

  describe("createBetweenPoints", () => {
    test("should set center as midpoint", () => {
      const origin: TPoint = { x: 0, y: 0 }
      const target: TPoint = { x: 10, y: 20 }
      const ellipse = ShapeUtil.createEllipseBetweenPoints(origin, target)
      expect(ellipse.center).toEqual({ x: 5, y: 10 })
      expect(ellipse.radiusX).toEqual(5)
      expect(ellipse.radiusY).toEqual(10)
    })
    test("should create with default style", () => {
      const ellipse = ShapeUtil.createEllipseBetweenPoints({ x: 0, y: 0 }, { x: 4, y: 6 })
      expect(ellipse.style).toEqual(DefaultStyle)
    })
    test("should create with zero radii when origin equals target", () => {
      const pt: TPoint = { x: 1, y: 2 }
      const ellipse = ShapeUtil.createEllipseBetweenPoints(pt, pt)
      expect(ellipse.radiusX).toEqual(0)
      expect(ellipse.radiusY).toEqual(0)
    })
  })

  describe("updateBetweenPoints", () => {
    test("should update center and radii", () => {
      const origin: TPoint = { x: 0, y: 0 }
      const ellipse = ShapeUtil.createEllipseBetweenPoints(origin, { x: 4, y: 6 })
      ShapeUtil.updateEllipseBetweenPoints(ellipse, origin, { x: 10, y: 20 })
      expect(ellipse.center).toEqual({ x: 5, y: 10 })
      expect(ellipse.radiusX).toEqual(5)
      expect(ellipse.radiusY).toEqual(10)
    })
  })
})
