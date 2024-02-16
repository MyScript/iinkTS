import { isValidPoint } from "../../../src/iink"

describe("Point.ts", () =>
{
  const testDatas = [
    { p: undefined, expected: false },
    { p: { x: 0 }, expected: false },
    { p: { x: 0, y: 0 }, expected: true },
    { p: { x: -50, y: 0 }, expected: true },
    { p: { x: 0, y: 0 }, expected: true },
  ]
  testDatas.forEach(d => {
    test(`should return ${d.expected} `, () =>
    {
      expect(isValidPoint(d.p)).toEqual(d.expected)
    })
  })
})
