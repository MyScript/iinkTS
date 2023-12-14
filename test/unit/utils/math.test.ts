import {
  isBetween,
} from "../../../src/iink"


describe("math.ts", () =>
{
  describe("isBetween", () =>
  {
    test("should return true", () =>
    {
      expect(isBetween(1, 0, 2)).toEqual(true)
    })
    test("should return false", () =>
    {
      expect(isBetween(3, 0, 2)).toEqual(false)
    })
  })
})
