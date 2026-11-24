import { round } from "../../helpers"

import { TPoint, TSegment, findIntersectBetweenSegmentAndCircle, findIntersectionBetween2Segment } from "@/iink"

describe("findIntersectionBetween2Segment", () => {
  const testDatas: { seg1: TSegment; seg2: TSegment; expected?: TPoint }[] = [
    {
      seg1: { p1: { x: 0, y: 0 }, p2: { x: 3, y: 3 } },
      seg2: { p1: { x: 3, y: 0 }, p2: { x: 0, y: 3 } },
      expected: { x: 1.5, y: 1.5 },
    },
    {
      seg1: { p1: { x: 0, y: 0 }, p2: { x: 3, y: 3 } },
      seg2: { p1: { x: 3, y: 3 }, p2: { x: 0, y: 3 } },
      expected: { x: 3, y: 3 },
    },
    {
      seg1: { p1: { x: 0, y: 0 }, p2: { x: 1, y: 1 } },
      seg2: { p1: { x: 0, y: 1 }, p2: { x: 1, y: 0 } },
      expected: { x: 0.5, y: 0.5 },
    },
    {
      seg1: { p1: { x: 3, y: 3 }, p2: { x: 0, y: 0 } },
      seg2: { p1: { x: 3, y: 3 }, p2: { x: 0, y: 3 } },
      expected: { x: 3, y: 3 },
    },
    {
      seg1: { p1: { x: 30, y: 30 }, p2: { x: 20, y: 20 } },
      seg2: { p1: { x: 3, y: 3 }, p2: { x: 0, y: 3 } },
      expected: undefined,
    },
    {
      seg1: { p1: { x: 3, y: 3 }, p2: { x: 0, y: 3 } },
      seg2: { p1: { x: 3, y: 3 }, p2: { x: 0, y: 3 } },
      expected: { x: 3, y: 3 },
    },
    {
      seg1: { p1: { x: -3, y: 4 }, p2: { x: 2, y: 3 } },
      seg2: { p1: { x: -3, y: -1 }, p2: { x: 2, y: 6 } },
      expected: { x: 0.125, y: 3.375 },
    },
    {
      seg1: { p1: { x: -30, y: 40 }, p2: { x: 20, y: 30 } },
      seg2: { p1: { x: -30, y: -10 }, p2: { x: 20, y: 60 } },
      expected: { x: 1.25, y: 33.75 },
    },
    {
      seg1: { p1: { x: 20, y: 30 }, p2: { x: 20, y: 60 } },
      seg2: { p1: { x: -30, y: 40 }, p2: { x: -30, y: 10 } },
      expected: undefined,
    },
    {
      seg1: { p1: { x: 191, y: 99 }, p2: { x: 3, y: 99 } },
      seg2: { p1: { x: 461, y: 512 }, p2: { x: 461, y: 512 } },
      expected: undefined,
    },
  ]

  testDatas.forEach((d) => {
    test(`should intersection of ${JSON.stringify(d.seg1)} and ${JSON.stringify(d.seg2)} to equal ${JSON.stringify(d.expected)}`, () => {
      const i = findIntersectionBetween2Segment(d.seg1, d.seg2)
      expect(i).toEqual(d.expected)
    })
  })
})

describe("findIntersectBetweenSegmentAndCircle", () => {
  const testDatas: { seg: TSegment; center: TPoint; radius: number; expected: TPoint[] }[] = [
    {
      seg: { p1: { x: 0, y: 0 }, p2: { x: 10, y: 0 } },
      center: { x: 0, y: 0 },
      radius: 5,
      expected: [{ x: 5, y: 0 }],
    },
    {
      seg: { p1: { x: 0, y: 0 }, p2: { x: 0, y: 10 } },
      center: { x: 0, y: 0 },
      radius: 5,
      expected: [{ x: 0, y: 5 }],
    },
    {
      seg: { p1: { x: 0, y: 0 }, p2: { x: 10, y: 10 } },
      center: { x: 0, y: 0 },
      radius: 5,
      expected: [{ x: Math.cos(-Math.PI / 4) * 5, y: Math.sin(Math.PI / 4) * 5 }],
    },
    {
      seg: { p1: { x: -10, y: -10 }, p2: { x: 10, y: 10 } },
      center: { x: 0, y: 0 },
      radius: 5,
      expected: [
        { x: Math.cos(-Math.PI / 4) * 5, y: Math.sin(Math.PI / 4) * 5 },
        { x: -Math.cos(-Math.PI / 4) * 5, y: -Math.sin(Math.PI / 4) * 5 },
      ],
    },
  ]

  testDatas.forEach((d) => {
    test(`should find interest between circle{center: ${JSON.stringify(d.center)}, radius: ${d.radius} to segment A[${JSON.stringify(d.seg.p1)}] B[${JSON.stringify(d.seg.p2)}] to equal ${JSON.stringify(d.expected)}`, () => {
      const interestPoints = findIntersectBetweenSegmentAndCircle(d.seg, d.center, d.radius)
      expect(interestPoints).toHaveLength(d.expected.length)
      interestPoints.forEach((ip, index) => {
        expect(round(ip.x, 3)).toEqual(round(d.expected[index].x, 3))
        expect(round(ip.y, 3)).toEqual(round(d.expected[index].y, 3))
      })
    })
  })
})
