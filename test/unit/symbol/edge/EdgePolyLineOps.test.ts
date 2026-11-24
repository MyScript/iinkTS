import { edgeGeometry } from "../../helpers"
import { DefaultStyle, EdgeDecoration, EdgeUtil, MatrixTransform, OBBOps, Polyline2d, HIT_TOLERANCE, TBox, TPoint, TStyle } from "@/iink"

describe("EdgePolyLineOps", () => {
  describe("create", () => {
    const points: TPoint[] = [
      { x: 0, y: 0 },
      { x: 5, y: 0 },
      { x: 5, y: 5 },
    ]
    test("should initialise transform to identity", () => {
      expect(EdgeUtil.createPolyLine(points).transform).toEqual(MatrixTransform.identity())
    })
    test("should create with default style", () => {
      const line = EdgeUtil.createPolyLine(points)
      expect(line.style).toEqual(DefaultStyle)
      expect(line.points).toEqual(points)
    })
    test("should create with custom style", () => {
      const style: TStyle = { color: "blue", width: 3 }
      const line = EdgeUtil.createPolyLine(points, undefined, undefined, style)
      expect(line.style).toEqual(expect.objectContaining(style))
    })
    test("should create with decorations", () => {
      const line = EdgeUtil.createPolyLine(points, EdgeDecoration.Arrow, EdgeDecoration.Arrow)
      expect(line.startDecoration).toEqual(EdgeDecoration.Arrow)
      expect(line.endDecoration).toEqual(EdgeDecoration.Arrow)
    })
    test("should have vertices same ref as points", () => {
      const line = EdgeUtil.createPolyLine(points)
      expect(EdgeUtil.getPolyLineVertices(line)).toBe(line.points)
    })
    test("should compute vertices count matching points", () => {
      const line = EdgeUtil.createPolyLine(points)
      expect(EdgeUtil.getPolyLineVertices(line)).toHaveLength(3)
    })
    test("should compute bounds with margin", () => {
      const line = EdgeUtil.createPolyLine(points, undefined, undefined, { width: 20 })
      expect(OBBOps.toBox(new Polyline2d(line.points, HIT_TOLERANCE).bounds).x).toEqual(-5)
      expect(OBBOps.toBox(new Polyline2d(line.points, HIT_TOLERANCE).bounds).y).toEqual(-5)
      expect(new Polyline2d(line.points, HIT_TOLERANCE).bounds.width).toEqual(15)
      expect(new Polyline2d(line.points, HIT_TOLERANCE).bounds.height).toEqual(15)
    })
    test("should generate unique ids", () => {
      const l1 = EdgeUtil.createPolyLine(points)
      const l2 = EdgeUtil.createPolyLine(points)
      expect(l1.id).not.toEqual(l2.id)
    })
  })

  describe("createFromPartial", () => {
    test("should create from valid partial", () => {
      const pts: TPoint[] = [
        { x: 0, y: 0 },
        { x: 5, y: 5 },
      ]
      const line = EdgeUtil.createPolyLineFromPartial({ points: pts })
      expect(line.points).toEqual(pts)
    })
    test("should carry a given transform through, merged onto identity", () => {
      const pts: TPoint[] = [
        { x: 0, y: 0 },
        { x: 5, y: 5 },
      ]
      const line = EdgeUtil.createPolyLineFromPartial({ points: pts, transform: { tx: 5, ty: 6 } })
      expect(line.transform).toEqual({ xx: 1, yx: 0, xy: 0, yy: 1, tx: 5, ty: 6 })
    })
    test("should preserve id", () => {
      const pts: TPoint[] = [
        { x: 0, y: 0 },
        { x: 5, y: 5 },
      ]
      const line = EdgeUtil.createPolyLineFromPartial({ id: "pl-id", points: pts })
      expect(line.id).toEqual("pl-id")
    })
  })

  describe("getResizePoints", () => {
    test("should return one resize point per vertex", () => {
      const pts: TPoint[] = [
        { x: 0, y: 0 },
        { x: 5, y: 0 },
        { x: 5, y: 5 },
      ]
      const line = EdgeUtil.createPolyLine(pts)
      const rp = EdgeUtil.getPolyLineResizePoints(line)
      expect(rp).toHaveLength(3)
      expect(rp[0].vertexIndex).toEqual(0)
      expect(rp[2].vertexIndex).toEqual(2)
    })
  })

  describe("overlaps", () => {
    const middles: TPoint[] = [
      { x: 0, y: 0 },
      { x: 15, y: 15 },
      { x: 0, y: 25 },
    ]
    const line = EdgeUtil.createPolyLine(middles)
    test("should return true if partially intersects", () => {
      const box: TBox = { height: 10, width: 10, x: -5, y: -5 }
      expect(edgeGeometry(line.points, line).overlapsBox(box)).toEqual(true)
    })
    test("should return true if totally wraps", () => {
      const box: TBox = { height: 50, width: 50, x: -25, y: -25 }
      expect(edgeGeometry(line.points, line).overlapsBox(box)).toEqual(true)
    })
    test("should return false if box is outside", () => {
      const box: TBox = { height: 2, width: 2, x: 50, y: 50 }
      expect(edgeGeometry(line.points, line).overlapsBox(box)).toEqual(false)
    })
  })
})
