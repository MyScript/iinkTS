import { DefaultStyle, OBBOps, PointSet2d, StrokeUtil, TPointer, TStyle } from "@/iink"

describe("TStroke / StrokeUtil statics", () => {
  describe("create", () => {
    test("should create with custom style", () => {
      const style: TStyle = {
        color: "blue",
        width: 20,
      }
      const stroke = StrokeUtil.createEmpty(style)
      expect(stroke).toBeDefined()
      expect(stroke.creationTime).toBeLessThanOrEqual(Date.now())
      expect(stroke.creationTime).toEqual(stroke.modificationDate)
      expect(stroke.style).toEqual(expect.objectContaining(style))
      expect(stroke.pointerType).toEqual("pen")
      expect(stroke.pointers).toHaveLength(0)
      expect(OBBOps.toBox(new PointSet2d(stroke.pointers).bounds).x).toEqual(0)
      expect(OBBOps.toBox(new PointSet2d(stroke.pointers).bounds).y).toEqual(0)
      expect(new PointSet2d(stroke.pointers).bounds.height).toEqual(0)
      expect(new PointSet2d(stroke.pointers).bounds.width).toEqual(0)
    })
    test("should create with default style", () => {
      const stroke = StrokeUtil.createEmpty()
      expect(stroke.style).toEqual(DefaultStyle)
    })
    test("should create and cast opacity and width to number", () => {
      //@ts-ignore
      const style = { opacity: "1", width: "1" }
      //@ts-ignore
      const stroke = StrokeUtil.createEmpty(style)
      expect(stroke.style.opacity).toEqual(+style.width)
      expect(stroke.style.width).toEqual(+style.width)
    })
  })

  describe("addPointer", () => {
    const stroke = StrokeUtil.createEmpty(DefaultStyle)

    test("should add first pointer and update modification date", () => {
      const pointer: TPointer = {
        p: 1,
        dt: 1,
        x: 0,
        y: 0,
      }
      StrokeUtil.addPointer(stroke, pointer)
      expect(stroke.pointers).toHaveLength(1)
      expect(stroke.pointers[0]).toEqual(pointer)
    })

    test("should not add the pointer if it is too close to the previous one", () => {
      const pointer: TPointer = {
        p: 1,
        dt: 1,
        x: 1.1,
        y: 1.1,
      }
      StrokeUtil.addPointer(stroke, pointer)
      expect(stroke.pointers).toHaveLength(1)
    })

    test("should update modification date if pointer added", () => {
      const pointer: TPointer = {
        p: 1,
        dt: 1,
        x: 5,
        y: 5,
      }
      StrokeUtil.addPointer(stroke, pointer)
      expect(stroke.modificationDate).toBeGreaterThan(stroke.creationTime)
    })

    test("should update length if pointer added", () => {
      const pointer: TPointer = {
        p: 1,
        dt: 1,
        x: 50,
        y: 50,
      }
      StrokeUtil.addPointer(stroke, pointer)
      expect(new PointSet2d(stroke.pointers).length).toEqual(Math.sqrt(2 * Math.pow(50, 2)))
    })
  })

  describe("boundingBox", () => {
    test("should get without pointers", () => {
      const stroke = StrokeUtil.createEmpty(DefaultStyle)
      expect(new PointSet2d(stroke.pointers).bounds.height).toEqual(0)
      expect(new PointSet2d(stroke.pointers).bounds.width).toEqual(0)
      expect(OBBOps.toBox(new PointSet2d(stroke.pointers).bounds).x).toEqual(0)
      expect(OBBOps.toBox(new PointSet2d(stroke.pointers).bounds).y).toEqual(0)
    })
    test("should get with pointers", () => {
      const stroke = StrokeUtil.createEmpty(DefaultStyle)
      StrokeUtil.addPointer(stroke, { p: 1, dt: 1, x: 1, y: 1 })
      StrokeUtil.addPointer(stroke, { p: 1, dt: 1, x: 11, y: 11 })
      expect(new PointSet2d(stroke.pointers).bounds.height).toEqual(10)
      expect(new PointSet2d(stroke.pointers).bounds.width).toEqual(10)
      expect(OBBOps.toBox(new PointSet2d(stroke.pointers).bounds).x).toEqual(1)
      expect(OBBOps.toBox(new PointSet2d(stroke.pointers).bounds).y).toEqual(1)
    })
  })

  describe("clone", () => {
    test("should return clone", () => {
      const style: TStyle = {
        color: "blue",
        width: 20,
      }
      const stroke = StrokeUtil.createEmpty(style)
      StrokeUtil.addPointer(stroke, { p: 1, dt: 1, x: 1, y: 1 })
      StrokeUtil.addPointer(stroke, { p: 1, dt: 1, x: 11, y: 11 })

      const clone = structuredClone(stroke)
      expect(clone).toEqual(stroke)
      expect(clone).not.toBe(stroke)
    })
    test("should not update origin pointers", () => {
      const style: TStyle = {
        color: "blue",
        width: 20,
      }
      const stroke = StrokeUtil.createEmpty(style)
      StrokeUtil.addPointer(stroke, { p: 1, dt: 1, x: 1, y: 1 })
      StrokeUtil.addPointer(stroke, { p: 1, dt: 1, x: 11, y: 11 })

      const clone = structuredClone(stroke)
      clone.pointers.forEach((p) => {
        p.x += 10
        p.y += 10
      })
      expect(stroke.pointers[0]).toEqual({ p: 1, dt: 1, x: 1, y: 1 })
      expect(clone.pointers[0]).toEqual({ p: 1, dt: 1, x: 11, y: 11 })
    })
  })

  describe("anchors", () => {
    test("stroke has no anchors by default, accepts optional startAnchor/endAnchor", () => {
      const stroke = StrokeUtil.createEmpty()
      expect(stroke.startAnchor).toBeUndefined()
      expect(stroke.endAnchor).toBeUndefined()
      stroke.startAnchor = { symbolId: "block-1", normalizedX: 0.5, normalizedY: 0.5 }
      expect(stroke.startAnchor.symbolId).toBe("block-1")
    })
  })
})
