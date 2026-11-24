import { TPoint, isPointInsidePolygon } from "@/iink"

describe("isPointInsidePolygon", () => {
  const testDatas: { point: TPoint; points: TPoint[]; expected: boolean }[] = [
    {
      point: { x: 0, y: 0 },
      points: [
        { x: 2, y: 2 },
        { x: 2, y: 4 },
        { x: 4, y: 2 },
      ],
      expected: false,
    },
    {
      point: { x: 3, y: 3 },
      points: [
        { x: 2, y: 2 },
        { x: 2, y: 4 },
        { x: 4, y: 2 },
      ],
      expected: false,
    },
    {
      point: { x: 3, y: 3 },
      points: [
        { x: 2, y: 2 },
        { x: 2, y: 5 },
        { x: 5, y: 2 },
      ],
      expected: true,
    },
    {
      point: { x: 3, y: 3 },
      points: [
        { x: 2, y: 2 },
        { x: 2, y: 10 },
        { x: 10, y: 10 },
        { x: 10, y: 2 },
      ],
      expected: true,
    },
    {
      point: { x: 3, y: 3 },
      points: [
        { x: 2, y: 2 },
        { x: 2, y: 10 },
        { x: 10, y: 10 },
        { x: 10, y: 2 },
        { x: 0, y: 0 },
      ],
      expected: true,
    },
    {
      point: { x: -3, y: 0 },
      points: [
        { x: 2, y: 2 },
        { x: 2, y: 10 },
        { x: 10, y: 10 },
        { x: 10, y: 2 },
        { x: 0, y: 0 },
      ],
      expected: false,
    },
  ]
  testDatas.forEach((d) => {
    test(`should answer ${d.expected} for point: ${JSON.stringify(d.point)} with points ${JSON.stringify(d.points)}`, () => {
      expect(isPointInsidePolygon(d.point, d.points)).toEqual(d.expected)
    })
  })
})
