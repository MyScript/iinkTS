import { isValidPoint, resolvePointerDelta, resolveStrokeOrigin } from "@/iink"

describe("Point.ts", () => {
  describe("isValidPoint", () => {
    const testDatas = [
      { p: undefined, expected: false },
      { p: { x: 0 }, expected: false },
      { p: { x: 0, y: 0 }, expected: true },
      { p: { x: -50, y: 0 }, expected: true },
      { p: { x: 0, y: 0 }, expected: true },
    ]
    testDatas.forEach((d) => {
      test(`should return ${d.expected} `, () => {
        expect(isValidPoint(d.p)).toEqual(d.expected)
      })
    })
  })

  describe("resolvePointerDelta", () => {
    test("should take a pointer's own dt as is", () => {
      expect(resolvePointerDelta([{ dt: 0 }, { dt: 16.5 }], 1)).toEqual(16.5)
    })

    test("should keep a dt of 0, which is what the first pointer of every stroke has", () => {
      expect(resolvePointerDelta([{ dt: 0 }, { dt: 16 }], 0)).toEqual(0)
    })

    test("should rebase a document written before pointers stored a delta", () => {
      // Absolute epoch timestamps, the shape saved by earlier versions. Rebasing on the first one
      // reproduces the intervals the capture originally had.
      const legacy = [{ t: 1788950155826 }, { t: 1788950155881 }, { t: 1788950155916 }]
      expect(legacy.map((_, i) => resolvePointerDelta(legacy, i))).toEqual([0, 55, 90])
    })

    test("should prefer dt over a legacy t when a document carries both", () => {
      expect(resolvePointerDelta([{ t: 1788950155826 }, { dt: 7, t: 1788950155881 }], 1)).toEqual(7)
    })

    test("should fall back to the index when a stroke carries no timing at all", () => {
      expect(resolvePointerDelta([{}, {}, {}], 2)).toEqual(2)
    })
  })

  describe("resolveStrokeOrigin", () => {
    test("should use the stroke's own creationTime", () => {
      expect(resolveStrokeOrigin([{ dt: 0 }], 1700000000000)).toEqual(1700000000000)
    })

    test("should fall back to the first absolute t of a pre-delta document", () => {
      // Losing this would collapse the intervals between strokes, which is what tells the
      // recognizer the order they were written in.
      expect(resolveStrokeOrigin([{ t: 1788950155826 }, { t: 1788950155881 }])).toEqual(1788950155826)
    })

    test("should report no origin when the stroke has neither", () => {
      expect(resolveStrokeOrigin([{ dt: 0 }, { dt: 12 }])).toBeUndefined()
    })
  })
})
