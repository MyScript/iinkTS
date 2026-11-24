import { DefaultStyle, MatrixTransform, OBBOps, PointSet2d, StrokeUtil, TPointer, TStyle } from "@/iink"

describe("StrokeUtil statics", () => {
  describe("create", () => {
    test("should initialise transform to identity", () => {
      expect(StrokeUtil.createEmpty().transform).toEqual(MatrixTransform.identity())
    })
    test("should create with default style", () => {
      const stroke = StrokeUtil.createEmpty()
      expect(stroke.style).toEqual(DefaultStyle)
      expect(stroke.pointerType).toEqual("pen")
      expect(stroke.pointers).toHaveLength(0)
      expect(new PointSet2d(stroke.pointers).length).toEqual(0)
      expect(OBBOps.toBox(new PointSet2d(stroke.pointers).bounds)).toEqual({ x: 0, y: 0, width: 0, height: 0 })
    })
    test("should create with custom style", () => {
      const style: TStyle = { color: "blue", width: 20 }
      const stroke = StrokeUtil.createEmpty(style)
      expect(stroke.style).toEqual(expect.objectContaining(style))
    })
    test("should cast opacity and width to number", () => {
      //@ts-ignore
      const style = { opacity: "1", width: "1" }
      //@ts-ignore
      const stroke = StrokeUtil.createEmpty(style)
      expect(stroke.style.opacity).toEqual(1)
      expect(stroke.style.width).toEqual(1)
    })
    test("should create with custom pointerType", () => {
      const stroke = StrokeUtil.createEmpty(undefined, "touch")
      expect(stroke.pointerType).toEqual("touch")
    })
    test("should generate unique ids", () => {
      const s1 = StrokeUtil.createEmpty()
      const s2 = StrokeUtil.createEmpty()
      expect(s1.id).not.toEqual(s2.id)
    })
    test("vertices should be same reference as pointers", () => {
      const stroke = StrokeUtil.createEmpty()
      expect(new PointSet2d(stroke.pointers).vertices).toBe(stroke.pointers)
    })
  })

  describe("addPointer", () => {
    test("should add first pointer", () => {
      const stroke = StrokeUtil.createEmpty(DefaultStyle)
      const pointer: TPointer = { p: 1, dt: 1, x: 0, y: 0 }
      StrokeUtil.addPointer(stroke, pointer)
      expect(stroke.pointers).toHaveLength(1)
    })
    test("should not add pointer too close to previous", () => {
      const stroke = StrokeUtil.createEmpty(DefaultStyle)
      StrokeUtil.addPointer(stroke, { p: 1, dt: 1, x: 0, y: 0 })
      StrokeUtil.addPointer(stroke, { p: 1, dt: 1, x: 1.1, y: 1.1 })
      expect(stroke.pointers).toHaveLength(1)
    })
    test("should update modification date", () => {
      const stroke = StrokeUtil.createEmpty(DefaultStyle)
      const before = stroke.creationTime
      StrokeUtil.addPointer(stroke, { p: 1, dt: 1, x: 5, y: 5 })
      expect(stroke.modificationDate).toBeGreaterThanOrEqual(before)
    })
    test("should report a length derived from its pointers", () => {
      // Derived on read, not accumulated into the stroke: nothing consumed the stored field once
      // width stopped being computed from the gap between pointers.
      const stroke = StrokeUtil.createEmpty(DefaultStyle)
      StrokeUtil.addPointer(stroke, { p: 1, dt: 1, x: 0, y: 0 })
      StrokeUtil.addPointer(stroke, { p: 1, dt: 2, x: 50, y: 50 })
      expect(new PointSet2d(stroke.pointers).length).toBeCloseTo(Math.sqrt(2 * Math.pow(50, 2)))
    })
    test("should update bounds", () => {
      const stroke = StrokeUtil.createEmpty(DefaultStyle)
      StrokeUtil.addPointer(stroke, { p: 1, dt: 1, x: 1, y: 1 })
      StrokeUtil.addPointer(stroke, { p: 1, dt: 2, x: 11, y: 11 })
      expect(OBBOps.toBox(new PointSet2d(stroke.pointers).bounds).x).toEqual(1)
      expect(OBBOps.toBox(new PointSet2d(stroke.pointers).bounds).y).toEqual(1)
      expect(new PointSet2d(stroke.pointers).bounds.width).toEqual(10)
      expect(new PointSet2d(stroke.pointers).bounds.height).toEqual(10)
    })
  })

  describe("updateBounds", () => {
    test("should compute bounds from pointers", () => {
      const stroke = StrokeUtil.createEmpty()
      stroke.pointers.push({ p: 1, dt: 1, x: 5, y: 10 })
      stroke.pointers.push({ p: 1, dt: 2, x: 15, y: 20 })
      expect(OBBOps.toBox(new PointSet2d(stroke.pointers).bounds)).toEqual({ x: 5, y: 10, width: 10, height: 10 })
    })
    test("should compute edges from pointers", () => {
      const stroke = StrokeUtil.createEmpty()
      stroke.pointers.push({ p: 1, dt: 1, x: 0, y: 0 })
      stroke.pointers.push({ p: 1, dt: 2, x: 10, y: 10 })
      stroke.pointers.push({ p: 1, dt: 3, x: 20, y: 20 })
      expect(new PointSet2d(stroke.pointers).edges).toHaveLength(2)
    })
  })

  describe("split", () => {
    test("should split into before and after at index", () => {
      const stroke = StrokeUtil.createEmpty(DefaultStyle)
      StrokeUtil.addPointer(stroke, { p: 1, dt: 1, x: 0, y: 0 })
      StrokeUtil.addPointer(stroke, { p: 1, dt: 2, x: 10, y: 10 })
      StrokeUtil.addPointer(stroke, { p: 1, dt: 3, x: 20, y: 20 })
      StrokeUtil.addPointer(stroke, { p: 1, dt: 4, x: 30, y: 30 })
      const { before, after } = StrokeUtil.split(stroke, 2)
      expect(before.pointers).toHaveLength(2)
      expect(after.pointers).toHaveLength(2)
    })
    test("should preserve style", () => {
      const style: TStyle = { color: "red", width: 5 }
      const stroke = StrokeUtil.createEmpty(style)
      StrokeUtil.addPointer(stroke, { p: 1, dt: 1, x: 0, y: 0 })
      StrokeUtil.addPointer(stroke, { p: 1, dt: 2, x: 10, y: 10 })
      StrokeUtil.addPointer(stroke, { p: 1, dt: 3, x: 20, y: 20 })
      const { before, after } = StrokeUtil.split(stroke, 1)
      expect(before.style).toEqual(expect.objectContaining(style))
      expect(after.style).toEqual(expect.objectContaining(style))
    })
  })

  describe("substract", () => {
    test("should return before stroke when partStroke has no length", () => {
      const stroke = StrokeUtil.createEmpty(DefaultStyle)
      StrokeUtil.addPointer(stroke, { p: 1, dt: 1, x: 0, y: 0 })
      const partStroke = StrokeUtil.createEmpty(DefaultStyle)
      const result = StrokeUtil.substract(stroke, partStroke)
      expect(result.before).toBe(stroke)
      expect(result.after).toBeUndefined()
    })
    test("should return before and after strokes", () => {
      const stroke = StrokeUtil.createEmpty(DefaultStyle)
      for (let i = 0; i < 10; i++) {
        StrokeUtil.addPointer(stroke, { p: 1, dt: i, x: i * 10, y: i * 10 })
      }
      const partStroke = StrokeUtil.createEmpty(DefaultStyle)
      StrokeUtil.addPointer(partStroke, { p: 1, dt: 1, x: 30, y: 30 })
      StrokeUtil.addPointer(partStroke, { p: 1, dt: 2, x: 50, y: 50 })
      const result = StrokeUtil.substract(stroke, partStroke)
      expect(result.before !== undefined || result.after !== undefined).toBe(true)
    })
  })

  describe("overlaps", () => {
    test("should return true when pointer is inside box", () => {
      const stroke = StrokeUtil.createEmpty(DefaultStyle)
      StrokeUtil.addPointer(stroke, { p: 1, dt: 1, x: 5, y: 5 })
      expect(new PointSet2d(stroke.pointers).overlapsBox({ x: 0, y: 0, width: 10, height: 10 })).toBe(true)
    })
    test("should return false when no pointer is inside box", () => {
      const stroke = StrokeUtil.createEmpty(DefaultStyle)
      StrokeUtil.addPointer(stroke, { p: 1, dt: 1, x: 50, y: 50 })
      expect(new PointSet2d(stroke.pointers).overlapsBox({ x: 0, y: 0, width: 10, height: 10 })).toBe(false)
    })
  })

  describe("createFromPartial", () => {
    test("should create from partial data", () => {
      const partial = {
        pointers: [
          { x: 10, y: 20, t: 1, p: 0.5 },
          { x: 30, y: 40, t: 2, p: 0.8 },
        ],
      }
      const stroke = StrokeUtil.createFromPartial(partial)
      expect(stroke.pointers[0]).toEqual(expect.objectContaining({ x: 10, y: 20 }))
    })
    test("should carry a given transform through, merged onto identity", () => {
      const partial = {
        pointers: [{ x: 10, y: 20, t: 1, p: 0.5 }],
        transform: { tx: 5, ty: 6 },
      }
      const stroke = StrokeUtil.createFromPartial(partial)
      expect(stroke.transform).toEqual({ xx: 1, yx: 0, xy: 0, yy: 1, tx: 5, ty: 6 })
    })
    test("should preserve id if provided", () => {
      const partial = {
        id: "test-id-123",
        pointers: [
          { x: 10, y: 20, t: 1, p: 0.5 },
          { x: 30, y: 40, t: 2, p: 0.8 },
        ],
      }
      const stroke = StrokeUtil.createFromPartial(partial)
      expect(stroke.id).toEqual("test-id-123")
    })
    test("should throw if no pointers", () => {
      expect(() => StrokeUtil.createFromPartial({})).toThrow("not pointers")
    })
    test("should throw if pointer missing x", () => {
      expect(() =>
        StrokeUtil.createFromPartial({
          pointers: [
            { x: 1, y: 1, dt: 1, p: 1 },
            { y: 2, dt: 2, p: 1 },
          ],
        })
      ).toThrow("no x at pointer at 1")
    })
    test("should throw if pointer missing y", () => {
      expect(() =>
        StrokeUtil.createFromPartial({
          pointers: [
            { x: 1, y: 1, dt: 1, p: 1 },
            { x: 2, dt: 2, p: 1 },
          ],
        })
      ).toThrow("no y at pointer at 1")
    })
    test("should throw if pointer is undefined", () => {
      expect(() =>
        StrokeUtil.createFromPartial({
          pointers: [undefined],
        })
      ).toThrow("no pointer at 0")
    })
    test("should set isSolverOutput from partial", () => {
      const stroke = StrokeUtil.createFromPartial({
        isSolverOutput: true,
        pointers: [
          { x: 10, y: 20, dt: 1, p: 0.5 },
          { x: 30, y: 40, dt: 2, p: 0.8 },
        ],
      })
      expect(stroke.isSolverOutput).toBe(true)
    })
    test("should preserve jiixBlockId from partial", () => {
      const stroke = StrokeUtil.createFromPartial({
        jiixBlockId: "block-1",
        pointers: [
          { x: 10, y: 20, dt: 1, p: 0.5 },
          { x: 30, y: 40, dt: 2, p: 0.8 },
        ],
      })
      expect(stroke.jiixBlockId).toEqual("block-1")
    })
  })

  describe("origin of a stroke", () => {
    test("should keep the origin it was created with", () => {
      expect(StrokeUtil.createEmpty(undefined, "pen", 1700000000000).creationTime).toEqual(1700000000000)
    })

    test("should give both halves of a split the origin of the stroke they came from", () => {
      // Their pointers keep the dt they were captured with, and those count from that origin. A
      // fresh creationTime on a half would claim its points were drawn at the moment of the split.
      const stroke = StrokeUtil.createEmpty(undefined, "pen", 1700000000000)
      stroke.pointers.push({ x: 0, y: 0, dt: 0, p: 1 }, { x: 5, y: 5, dt: 10, p: 1 }, { x: 9, y: 9, dt: 20, p: 1 })

      const { before, after } = StrokeUtil.split(stroke, 2)

      expect(before.creationTime).toEqual(1700000000000)
      expect(after.creationTime).toEqual(1700000000000)
      expect(after.pointers[0].dt).toEqual(20)
    })

    test("should recover the origin of a stroke imported from a pre-delta document", () => {
      const imported = StrokeUtil.createFromPartial({
        pointers: [
          { x: 1, y: 2, t: 1788950155826, p: 1 },
          { x: 40, y: 50, t: 1788950155881, p: 1 },
        ],
      })
      expect(imported.creationTime).toEqual(1788950155826)
      expect(imported.pointers.map((p) => p.dt)).toEqual([0, 55])
    })
  })
})
