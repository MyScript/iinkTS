import {
  convertMillimeterToPixel,
  convertPixelToMillimeter,
} from "../../../src/iink"

const round = (n: number, digit = 2) => Math.round(n * Math.pow(10, digit)) / Math.pow(10, digit)

describe("units", () =>
{
  test("convertMillimeterToPixel", () =>
  {
    expect(round(convertMillimeterToPixel(10), 0)).toEqual(38)
  })
  test("convertPixelToMillimeter", () =>
  {
    expect(round(convertPixelToMillimeter(38), 0)).toEqual(10)
  })
})
