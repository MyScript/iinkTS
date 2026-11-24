import { computeDistance } from "@/iink"

describe("computeDistance", () => {
  const testDatas = [
    {
      p1: { x: 0, y: 0 },
      p2: { x: 0, y: 3 },
      expected: 3,
    },
    {
      p1: { x: 0, y: 0 },
      p2: { x: 3, y: 0 },
      expected: 3,
    },
    {
      p1: { x: 0, y: 0 },
      p2: { x: 1, y: 1 },
      expected: Math.sqrt(2),
    },
  ]
  testDatas.forEach((d) => {
    test(`should computed distance of P1: [${JSON.stringify(d.p1)}] & P2: [${JSON.stringify(d.p2)}] to equal ${d.expected}`, () => {
      expect(computeDistance(d.p1, d.p2)).toEqual(d.expected)
    })
  })
})
