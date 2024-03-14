import
{
  computeAngleAxeRadian,
  computeDistance,
  computeDistanceBetweenPointAndSegment,
  computeNearestPointOnSegment,
  createPointsOnSegment
} from "../../../src/iink"

const round = (n: number, digit = 2) => Math.round(n * Math.pow(10, digit)) / Math.pow(10, digit)

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
          { x: 0, y: 1},
          { x: 0, y: 2},
          { x: 0, y: 3},
          { x: 0, y: 4},
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
})
