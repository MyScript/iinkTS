import { round } from "../helpers"

import
{
  TPoint,
  TSegment,
  computeAngleAxeRadian,
  computeDistance,
  computeDistanceBetweenPointAndSegment,
  computeNearestPointOnSegment,
  converDegreeToRadian,
  convertRadianToDegree,
  createPointsOnSegment,
  findIntersectBetweenSegmentAndCircle,
  findIntersectionBetween2Segment,
  rotatePoint
} from "../../../src/iink"

describe("geometry.ts", () =>
{

  describe("computeDistance", () =>
  {
    const testDatas = [
      {
        p1: { x: 0, y: 0 },
        p2: { x: 0, y: 3 },
        expected: 3
      },
      {
        p1: { x: 0, y: 0 },
        p2: { x: 3, y: 0 },
        expected: 3
      },
      {
        p1: { x: 0, y: 0 },
        p2: { x: 1, y: 1 },
        expected: Math.sqrt(2)
      },
    ]
    testDatas.forEach(d =>
    {
      test(`should computed distance of P1: [${ JSON.stringify(d.p1) }] & P2: [${ JSON.stringify(d.p2) }] to equal ${ d.expected }`, () =>
      {
        expect(computeDistance(d.p1, d.p2)).toEqual(d.expected)
      })
    })
  })

  describe("computeAngleAxeRadian", () =>
  {
    const testDatas = [
      {
        p1: { x: 0, y: 0 },
        p2: { x: 10, y: 0 },
        expect: 0
      },
      {
        p1: { x: 10, y: 0 },
        p2: { x: 0, y: 0 },
        expect: 3.14
      },
      {
        p1: { x: 0, y: 0 },
        p2: { x: 0, y: 1 },
        expect: 1.5708
      },
      {
        p1: { x: 0, y: 1 },
        p2: { x: 0, y: 0 },
        expect: -1.5708
      },
      {
        p1: { x: 0, y: 0 },
        p2: { x: 1, y: 1 },
        expect: 0.79
      },
      {
        p1: { x: 1, y: 1 },
        p2: { x: 0, y: 0 },
        expect: -2.36
      },
      {
        p1: { x: 0, y: 0 },
        p2: { x: 3, y: 1 },
        expect: 0.32
      },
      {
        p1: { x: 3, y: 0 },
        p2: { x: 0, y: 1 },
        expect: 2.82
      },
    ]
    testDatas.forEach(d =>
    {
      test(`should compute radian for P1[${ JSON.stringify(d.p1) }] P2[${ JSON.stringify(d.p2) }] to equal ${ d.expect }`, () =>
      {
        expect(round(computeAngleAxeRadian(d.p1, d.p2))).toEqual(round(d.expect))
      })
    })
  })

  describe("createPointsOnSegment", () =>
  {
    const testDatas = [
      {
        p1: { x: 0, y: 0 },
        p2: { x: 0, y: 5 },
        spaceBetweenPoint: 1,
        expected: [
          { x: 0, y: 1 },
          { x: 0, y: 2 },
          { x: 0, y: 3 },
          { x: 0, y: 4 },
        ]
      },
      {
        p1: { x: 0, y: 0 },
        p2: { x: 5, y: 0 },
        spaceBetweenPoint: 1,
        expected: [
          { x: 1, y: 0 },
          { x: 2, y: 0 },
          { x: 3, y: 0 },
          { x: 4, y: 0 },
        ]
      },
      {
        p1: { x: 0, y: 0 },
        p2: { x: 6, y: 0 },
        spaceBetweenPoint: 2,
        expected: [
          { x: 2, y: 0 },
          { x: 4, y: 0 },
        ]
      },
      {
        p1: { x: 0, y: 0 },
        p2: { x: 5, y: 5 },
        spaceBetweenPoint: Math.SQRT2,
        expected: [
          { x: 1, y: 1 },
          { x: 2, y: 2 },
          { x: 3, y: 3 },
          { x: 4, y: 4 },
        ]
      },
      {
        p1: { x: 0, y: 0 },
        p2: { x: -5, y: -5 },
        spaceBetweenPoint: Math.SQRT2,
        expected: [
          { x: -1, y: -1 },
          { x: -2, y: -2 },
          { x: -3, y: -3 },
          { x: -4, y: -4 },
        ]
      },
      {
        p1: { x: 0, y: 0 },
        p2: { x: 5, y: -5 },
        spaceBetweenPoint: Math.SQRT2,
        expected: [
          { x: 1, y: -1 },
          { x: 2, y: -2 },
          { x: 3, y: -3 },
          { x: 4, y: -4 },
        ]
      },
    ]
    testDatas.forEach(d =>
    {
      test(`should create points on segment A[${ JSON.stringify(d.p1) }] B[${ JSON.stringify(d.p2) }] to equal ${ JSON.stringify(d.expected) }`, () =>
      {
        expect(createPointsOnSegment(d.p1, d.p2, d.spaceBetweenPoint)).toEqual(d.expected)
      })
    })
  })

  describe("convert angle", () =>
  {
    const testDatas = [
      { degree: 0, radian: 0 },
      { degree: 10, radian: 0.1745 },
      { degree: 30, radian: 0.5236 },
      { degree: 45, radian: 0.7854 },
      { degree: 60, radian: 1.0472 },
      { degree: 90, radian: 1.5708 },
      { degree: 135, radian: 2.3562 },
      { degree: 180, radian: 3.1416 },
      { degree: 270, radian: 4.7124 },
      { degree: 360, radian: 6.2832 },
    ]
    testDatas.forEach(d =>
    {
      test(`shoud couvert ${ d.degree }° to ${ d.radian } rad`, () =>
      {
        expect(round(converDegreeToRadian(d.degree))).toEqual(round(d.radian))
      })
      test(`shoud couvert ${ d.radian } rad to ${ d.degree }°`, () =>
      {
        expect(round(convertRadianToDegree(d.radian), 0)).toEqual(d.degree)
      })
    })
  })

  describe("rotatePoint", () =>
  {
    const testDatas = [
      {
        center: { x: 0, y: 0 },
        point: { x: 1, y: 1 },
        radian: 0,
        expect: { x: 1, y: 1 }
      },
      {
        center: { x: 0, y: 0 },
        point: { x: 1, y: 1 },
        radian: 2 * Math.PI,
        expect: { x: 1, y: 1 }
      },
      {
        center: { x: 0, y: 0 },
        point: { x: 1, y: 1 },
        radian: Math.PI / 2,
        expect: { x: 1, y: -1 }
      },
      {
        center: { x: 0, y: 0 },
        point: { x: 1, y: 1 },
        radian: -Math.PI / 2,
        expect: { x: -1, y: 1 }
      },
      {
        center: { x: 0, y: 0 },
        point: { x: 1, y: 1 },
        radian: Math.PI,
        expect: { x: -1, y: -1 }
      },
      {
        center: { x: 0, y: 0 },
        point: { x: 1, y: 1 },
        radian: -Math.PI,
        expect: { x: -1, y: -1 }
      },
    ]
    testDatas.forEach(d =>
    {
      test(`shoud rotate P[${ JSON.stringify(d.point) }]° by ${ d.radian } rad with center C[${ JSON.stringify(d.center) }]`, () =>
      {
        const result = rotatePoint(d.center, d.point, d.radian)
        expect(Math.round(result.x)).toEqual(d.expect.x)
        expect(Math.round(result.y)).toEqual(d.expect.y)
      })

    })
  })

  describe("computeNearestPointOnSegment", () =>
  {
    const testDatas = [
      {
        p: { x: 0, y: 10 },
        seg: { p1: { x: 0, y: 0 }, p2: { x: 10, y: 10 } },
        expected: {
          x: 5,
          y: 5
        }
      },
      {
        p: { x: 0, y: 1 },
        seg: { p1: { x: 1, y: 1 }, p2: { x: 0, y: 0 } },
        expected: {
          x: 0.5,
          y: 0.5
        }
      },
      {
        p: { x: 0, y: 1 },
        seg: { p1: { x: 0, y: 0 }, p2: { x: 0, y: 1 } },
        expected: {
          x: 0,
          y: 1
        }
      },
      {
        p: { x: 0, y: 1 },
        seg: { p1: { x: 0, y: 1 }, p2: { x: 0, y: 0 } },
        expected: {
          x: 0,
          y: 1
        }
      },
      {
        p: { x: 0, y: 1 },
        seg: { p1: { x: 0, y: 0 }, p2: { x: 0, y: 5 } },
        expected: {
          x: 0,
          y: 1
        }
      },
      {
        p: { x: -1, y: 1 },
        seg: { p1: { x: 0, y: 0 }, p2: { x: 0, y: 5 } },
        expected: {
          x: 0,
          y: 1
        }
      },
      {
        p: { x: 5, y: 1 },
        seg: { p1: { x: 0, y: 0 }, p2: { x: 0, y: 5 } },
        expected: {
          x: 0,
          y: 1
        }
      },
      {
        p: { x: 2, y: 5 },
        seg: { p1: { x: -2, y: 2 }, p2: { x: 2, y: -2 } },
        expected: {
          x: -1.5,
          y: 1.5
        }
      },
    ]
    testDatas.forEach(d =>
    {
      test(`should computed the closest point to P1[${ JSON.stringify(d.p) }] on segment A[${ JSON.stringify(d.seg.p1) }] B[${ JSON.stringify(d.seg.p2) }] to equal ${ JSON.stringify(d.expected) }`, () =>
      {
        expect(computeNearestPointOnSegment(d.p, d.seg)).toEqual(d.expected)
      })
    })
  })

  describe("computeDistanceBetweenPointAndSegment", () =>
  {
    const testDatas = [
      {
        p: { x: 0, y: 5 },
        seg: { p1: { x: 0, y: 0 }, p2: { x: 5, y: 5 } },
        expected: 3.5
      },
      {
        p: { x: -5, y: 1 },
        seg: { p1: { x: 0, y: 0 }, p2: { x: 10, y: 10 } },
        expected: 5.1
      },
      {
        p: { x: 20, y: 20 },
        seg: { p1: { x: 0, y: 0 }, p2: { x: 10, y: 10 } },
        expected: 14.1
      },
      {
        p: { x: 2, y: 5 },
        seg: { p1: { x: -2, y: 2 }, p2: { x: 2, y: -2 } },
        expected: 4.9
      },
    ]
    testDatas.forEach(d =>
    {
      test(`should computed the distance from P1[${ JSON.stringify(d.p) }] to segment A[${ JSON.stringify(d.seg.p1) }] B[${ JSON.stringify(d.seg.p2) }] to equal ${ JSON.stringify(d.expected) }`, () =>
      {
        expect(round(computeDistanceBetweenPointAndSegment(d.p, d.seg), 1)).toEqual(d.expected)
      })
    })
  })

  describe("findIntersectionBetween2Segment", () =>
  {
    const testDatas: { seg1: TSegment, seg2: TSegment, expected?: TPoint }[] = [
      {
        seg1: { p1: { x: 0, y: 0 }, p2: { x: 3, y: 3 } },
        seg2: { p1: { x: 3, y: 0 }, p2: { x: 0, y: 3 } },
        expected: { x: 1.5, y: 1.5 }
      },
      {
        seg1: { p1: { x: 0, y: 0 }, p2: { x: 3, y: 3 } },
        seg2: { p1: { x: 3, y: 3 }, p2: { x: 0, y: 3 } },
        expected: { x: 3, y: 3 }
      },
      {
        seg1: { p1: { x: 0, y: 0 }, p2: { x: 1, y: 1 } },
        seg2: { p1: { x: 0, y: 1 }, p2: { x: 1, y: 0 } },
        expected: { x: 0.5, y: 0.5 }
      },
      {
        seg1: { p1: { x: 3, y: 3 }, p2: { x: 0, y: 0 } },
        seg2: { p1: { x: 3, y: 3 }, p2: { x: 0, y: 3 } },
        expected: { x: 3, y: 3 }
      },
      {
        seg1: { p1: { x: 30, y: 30 }, p2: { x: 20, y: 20 } },
        seg2: { p1: { x: 3, y: 3 }, p2: { x: 0, y: 3 } },
        expected: undefined
      },
      {
        seg1: { p1: { x: 3, y: 3 }, p2: { x: 0, y: 3 } },
        seg2: { p1: { x: 3, y: 3 }, p2: { x: 0, y: 3 } },
        expected: { x: 3, y: 3 }
      },
    ]
    testDatas.forEach(d =>
    {
      test(`should intersection of ${ JSON.stringify(d.seg1) } and ${ JSON.stringify(d.seg2) } to equal ${ JSON.stringify(d.expected) }`, () =>
      {
        const i = findIntersectionBetween2Segment(d.seg1, d.seg2)
        expect(i).toEqual(d.expected)
      })
    })
  })

  describe("findIntersectBetweenSegmentAndCircle", () =>
  {
    const testDatas: { seg: TSegment, center: TPoint, radius: number, expected: TPoint[] }[] = [
      {
        seg: { p1: { x: 0, y: 0 }, p2: { x: 10, y: 0 } },
        center: { x: 0, y: 0 },
        radius: 5,
        expected: [{ x: 5, y: 0 }]
      },
      {
        seg: { p1: { x: 0, y: 0 }, p2: { x: 0, y: 10 } },
        center: { x: 0, y: 0 },
        radius: 5,
        expected: [{ x: 0, y: 5 }]
      },
      {
        seg: { p1: { x: 0, y: 0 }, p2: { x: 10, y: 10 } },
        center: { x: 0, y: 0 },
        radius: 5,
        expected: [{ x: Math.cos(-Math.PI / 4) * 5, y: Math.sin(Math.PI / 4) * 5 }]
      },
      {
        seg: { p1: { x: -10, y: -10 }, p2: { x: 10, y: 10 } },
        center: { x: 0, y: 0 },
        radius: 5,
        expected: [{ x: Math.cos(-Math.PI / 4) * 5, y: Math.sin(Math.PI / 4) * 5 }, { x: -Math.cos(-Math.PI / 4) * 5, y: -Math.sin(Math.PI / 4) * 5 }]
      },
    ]

    testDatas.forEach(d =>
    {
      test(`should find interest between circle{center: ${ JSON.stringify(d.center) }, radius: ${ d.radius } to segment A[${ JSON.stringify(d.seg.p1) }] B[${ JSON.stringify(d.seg.p2) }] to equal ${ JSON.stringify(d.expected) }`, () =>
      {
        const interestPoints = findIntersectBetweenSegmentAndCircle(d.seg, d.center, d.radius)
        expect(interestPoints).toHaveLength(d.expected.length)
        interestPoints.forEach((ip, index) =>
        {

          expect(round(ip.x, 3)).toEqual(round(d.expected[index].x, 3))
          expect(round(ip.y, 3)).toEqual(round(d.expected[index].y, 3))
        })
      })
    })
  })
})

// All files                             |   90.57 |    82.18 |   86.79 |   90.57
