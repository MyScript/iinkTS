import {
  computeAverage,
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

describe("Average", () =>
{
  const testDatas = [
    { values: [0, 1, 2, 3], expected: 1.5 },
    { values: [10, 1, 2, 3], expected: 4 },
    { values: [12, 12, 2, 2], expected: 7 },
    { values: [33, 11], expected: 22 },
    { values: [8], expected: 8 },
    { values: [], expected: NaN },
  ]
  testDatas.forEach(data =>
  {
    test(`should computeAverage of ${ JSON.stringify(data.values) } equal to ${ data.expected }`, () =>
    {
      expect(computeAverage(data.values)).toEqual(data.expected)
    })
  })
})
