import { convertMillimeterToPixel, convertPixelToMillimeter, PX_TO_MM_RATIO } from "@/iink"

const round = (n: number, digit = 2) => Math.round(n * Math.pow(10, digit)) / Math.pow(10, digit)

describe("units", () => {
  test("convertMillimeterToPixel", () => {
    expect(round(convertMillimeterToPixel(10), 0)).toEqual(38)
  })
  test("convertPixelToMillimeter", () => {
    expect(round(convertPixelToMillimeter(38), 0)).toEqual(10)
  })
  test("PX_TO_MM_RATIO", () => {
    // 96 CSS pixels to the inch, 25.4 mm to the inch
    expect(PX_TO_MM_RATIO * 96).toBeCloseTo(25.4)
  })
})
