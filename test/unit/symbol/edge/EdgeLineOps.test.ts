import { edgeGeometry } from "../../helpers"
import { DefaultStyle, EdgeDecoration, EdgeUtil, MatrixTransform, OBBOps, TBox, TPoint, TStyle } from "@/iink"

describe("EdgeLineOps", () => {
  describe("create", () => {
    test("should initialise transform to identity", () => {
      expect(EdgeUtil.createLine({ x: 0, y: 0 }, { x: 10, y: 10 }).transform).toEqual(MatrixTransform.identity())
    })
    test("should create with default style", () => {
      const start: TPoint = { x: 0, y: 0 }
      const end: TPoint = { x: 10, y: 10 }
      const line = EdgeUtil.createLine(start, end)
      expect(line.style).toEqual(DefaultStyle)
      expect(line.start).toEqual(start)
      expect(line.end).toEqual(end)
    })
    test("should create with custom style", () => {
      const style: TStyle = { color: "blue", width: 5 }
      const line = EdgeUtil.createLine({ x: 0, y: 0 }, { x: 5, y: 5 }, undefined, undefined, style)
      expect(line.style).toEqual(expect.objectContaining(style))
    })
    test("should create with decorations", () => {
      const line = EdgeUtil.createLine({ x: 0, y: 0 }, { x: 5, y: 5 }, EdgeDecoration.Arrow, EdgeDecoration.Arrow)
      expect(line.startDecoration).toEqual(EdgeDecoration.Arrow)
      expect(line.endDecoration).toEqual(EdgeDecoration.Arrow)
    })
    test("should compute 2 vertices", () => {
      const line = EdgeUtil.createLine({ x: 0, y: 0 }, { x: 5, y: 5 })
      expect(EdgeUtil.getLineVertices(line)).toHaveLength(2)
    })
    test("vertices[0] same ref as start", () => {
      const start: TPoint = { x: 0, y: 0 }
      const end: TPoint = { x: 5, y: 5 }
      const line = EdgeUtil.createLine(start, end)
      expect(EdgeUtil.getLineVertices(line)[0]).toBe(line.start)
      expect(EdgeUtil.getLineVertices(line)[1]).toBe(line.end)
    })
    test("should compute bounds with margin", () => {
      const line = EdgeUtil.createLine({ x: 0, y: 0 }, { x: 5, y: 5 }, undefined, undefined, { width: 20 })
      expect(OBBOps.toBox(edgeGeometry(EdgeUtil.getLineVertices(line), line).bounds).x).toEqual(-5)
      expect(OBBOps.toBox(edgeGeometry(EdgeUtil.getLineVertices(line), line).bounds).y).toEqual(-5)
      expect(edgeGeometry(EdgeUtil.getLineVertices(line), line).bounds.width).toEqual(15)
      expect(edgeGeometry(EdgeUtil.getLineVertices(line), line).bounds.height).toEqual(15)
    })
    test("should generate unique ids", () => {
      const l1 = EdgeUtil.createLine({ x: 0, y: 0 }, { x: 1, y: 1 })
      const l2 = EdgeUtil.createLine({ x: 0, y: 0 }, { x: 1, y: 1 })
      expect(l1.id).not.toEqual(l2.id)
    })
  })

  describe("createFromPartial", () => {
    test("should create from valid partial", () => {
      const partial = { start: { x: 0, y: 0 }, end: { x: 5, y: 5 } }
      const line = EdgeUtil.createLineFromPartial(partial)
      expect(line.start).toEqual(partial.start)
      expect(line.end).toEqual(partial.end)
    })
    test("should carry a given transform through, merged onto identity", () => {
      const partial = { start: { x: 0, y: 0 }, end: { x: 5, y: 5 }, transform: { tx: 5, ty: 6 } }
      const line = EdgeUtil.createLineFromPartial(partial)
      expect(line.transform).toEqual({ xx: 1, yx: 0, xy: 0, yy: 1, tx: 5, ty: 6 })
    })
    test("should preserve id", () => {
      const partial = { id: "line-id", start: { x: 0, y: 0 }, end: { x: 5, y: 5 } }
      const line = EdgeUtil.createLineFromPartial(partial)
      expect(line.id).toEqual("line-id")
    })
    test("should throw if start missing", () => {
      expect(() => EdgeUtil.createLineFromPartial({ end: { x: 5, y: 5 } })).toThrow()
    })
    test("should throw if end missing", () => {
      expect(() => EdgeUtil.createLineFromPartial({ start: { x: 0, y: 0 } })).toThrow()
    })
  })

  describe("getResizePoints", () => {
    test("should return 2 resize points", () => {
      const line = EdgeUtil.createLine({ x: 0, y: 0 }, { x: 10, y: 10 })
      const pts = EdgeUtil.getLineResizePoints(line)
      expect(pts).toHaveLength(2)
      expect(pts[0].vertexIndex).toEqual(0)
      expect(pts[1].vertexIndex).toEqual(1)
    })
  })

  describe("overlaps", () => {
    const line = EdgeUtil.createLine({ x: 0, y: 0 }, { x: 0, y: 25 })
    test("should return true if partially intersects", () => {
      const box: TBox = { height: 10, width: 10, x: -5, y: -5 }
      expect(edgeGeometry(EdgeUtil.getLineVertices(line), line).overlapsBox(box)).toEqual(true)
    })
    test("should return true if totally wraps", () => {
      const box: TBox = { height: 50, width: 50, x: -25, y: -25 }
      expect(edgeGeometry(EdgeUtil.getLineVertices(line), line).overlapsBox(box)).toEqual(true)
    })
    test("should return false if box is outside", () => {
      const box: TBox = { height: 2, width: 2, x: 50, y: 50 }
      expect(edgeGeometry(EdgeUtil.getLineVertices(line), line).overlapsBox(box)).toEqual(false)
    })
  })
})
