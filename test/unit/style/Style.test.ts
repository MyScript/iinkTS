import { mergeSymbolStyle, DefaultStyle } from "@/iink"

describe("Style.ts", () => {
  describe("mergeSymbolStyle", () => {
    test("should return DefaultStyle when called without a style", () => {
      expect(mergeSymbolStyle()).toEqual(DefaultStyle)
    })

    test("should merge a partial style onto DefaultStyle", () => {
      expect(mergeSymbolStyle({ color: "red" })).toEqual({ ...DefaultStyle, color: "red" })
    })

    test("should coerce a string width to a number", () => {
      const merged = mergeSymbolStyle({ width: "5" as unknown as number })
      expect(merged.width).toEqual(5)
    })

    test("should coerce a string opacity to a number", () => {
      const merged = mergeSymbolStyle({ opacity: "0.5" as unknown as number })
      expect(merged.opacity).toEqual(0.5)
    })

    test("should leave opacity undefined when not provided", () => {
      expect(mergeSymbolStyle().opacity).toBeUndefined()
    })
  })
})
