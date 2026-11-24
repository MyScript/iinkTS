import { TEraser, EraserOps } from "@/iink"

describe("TEraser", () => {
  test("is plain object", () => {
    const eraser = EraserOps.create()
    expect(eraser).toBeDefined()
    expect(Object.getPrototypeOf(eraser)).toBe(Object.prototype)
  })
})

describe("EraserOps", () => {
  describe("create", () => {
    test("default width = 5", () => {
      const eraser = EraserOps.create()
      expect(eraser.style.width).toBe(5)
    })

    test("custom width", () => {
      const eraser = EraserOps.create(10)
      expect(eraser.style.width).toBe(10)
    })

    test("default style values", () => {
      const eraser = EraserOps.create()
      expect(eraser.style.color).toBe("grey")
      expect(eraser.style.fill).toBe("none")
      expect(eraser.style.opacity).toBe(0.2)
    })

    test("starts with empty pointers", () => {
      const eraser = EraserOps.create()
      expect(eraser.pointers).toHaveLength(0)
    })

    test("unique ids", () => {
      const e1 = EraserOps.create()
      const e2 = EraserOps.create()
      expect(e1.id).not.toBe(e2.id)
    })

    test("type is eraser", () => {
      const eraser = EraserOps.create()
      expect(eraser.type).toBe("eraser")
    })
  })

  describe("getBounds", () => {
    test("empty pointers returns zero box", () => {
      const eraser = EraserOps.create()
      const bounds = EraserOps.getBounds(eraser)
      expect(bounds).toEqual({ x: 0, y: 0, width: 0, height: 0 })
    })

    test("with pointers returns bounding box", () => {
      const eraser = EraserOps.create()
      eraser.pointers.push({ p: 1, dt: 1, x: 1, y: 1 })
      eraser.pointers.push({ p: 1, dt: 1, x: 11, y: 11 })
      const bounds = EraserOps.getBounds(eraser)
      expect(bounds).toEqual({ x: 1, y: 1, width: 10, height: 10 })
    })
  })

  describe("clone via structuredClone", () => {
    test("deep copy, different reference", () => {
      const eraser = EraserOps.create()
      eraser.pointers.push({ p: 1, dt: 1, x: 1, y: 1 })
      const clone: TEraser = structuredClone(eraser)
      expect(clone).toEqual(eraser)
      expect(clone).not.toBe(eraser)
      expect(clone.pointers).not.toBe(eraser.pointers)
    })
  })
})
