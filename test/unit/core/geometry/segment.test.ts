import { round } from "../../helpers"

import { computeDistanceBetweenPointAndSegment, computeNearestPointOnSegment, createPointsOnSegment } from "@/iink"

describe("createPointsOnSegment", () => {
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
      ],
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
      ],
    },
    {
      p1: { x: 0, y: 0 },
      p2: { x: 6, y: 0 },
      spaceBetweenPoint: 2,
      expected: [
        { x: 2, y: 0 },
        { x: 4, y: 0 },
      ],
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
      ],
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
      ],
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
      ],
    },
  ]
  testDatas.forEach((d) => {
    test(`should create points on segment A[${JSON.stringify(d.p1)}] B[${JSON.stringify(d.p2)}] to equal ${JSON.stringify(d.expected)}`, () => {
      expect(createPointsOnSegment(d.p1, d.p2, d.spaceBetweenPoint)).toEqual(d.expected)
    })
  })
})

describe("computeNearestPointOnSegment", () => {
  const testDatas = [
    {
      p: { x: 0, y: 10 },
      seg: { p1: { x: 0, y: 0 }, p2: { x: 10, y: 10 } },
      expected: {
        x: 5,
        y: 5,
      },
    },
    {
      p: { x: 0, y: 1 },
      seg: { p1: { x: 1, y: 1 }, p2: { x: 0, y: 0 } },
      expected: {
        x: 0.5,
        y: 0.5,
      },
    },
    {
      p: { x: 0, y: 1 },
      seg: { p1: { x: 0, y: 0 }, p2: { x: 0, y: 1 } },
      expected: {
        x: 0,
        y: 1,
      },
    },
    {
      p: { x: 0, y: 1 },
      seg: { p1: { x: 0, y: 1 }, p2: { x: 0, y: 0 } },
      expected: {
        x: 0,
        y: 1,
      },
    },
    {
      p: { x: 0, y: 1 },
      seg: { p1: { x: 0, y: 0 }, p2: { x: 0, y: 5 } },
      expected: {
        x: 0,
        y: 1,
      },
    },
    {
      p: { x: -1, y: 1 },
      seg: { p1: { x: 0, y: 0 }, p2: { x: 0, y: 5 } },
      expected: {
        x: 0,
        y: 1,
      },
    },
    {
      p: { x: 5, y: 1 },
      seg: { p1: { x: 0, y: 0 }, p2: { x: 0, y: 5 } },
      expected: {
        x: 0,
        y: 1,
      },
    },
    {
      p: { x: 2, y: 5 },
      seg: { p1: { x: -2, y: 2 }, p2: { x: 2, y: -2 } },
      expected: {
        x: -1.5,
        y: 1.5,
      },
    },
    {
      p: { x: -50, y: 50 },
      seg: { p1: { x: 10, y: -0 }, p2: { x: 10, y: 0 } },
      expected: {
        x: 10,
        y: -0,
      },
    },
  ]
  testDatas.forEach((d) => {
    test(`should computed the closest point to P1[${JSON.stringify(d.p)}] on segment A[${JSON.stringify(d.seg.p1)}] B[${JSON.stringify(d.seg.p2)}] to equal ${JSON.stringify(d.expected)}`, () => {
      expect(computeNearestPointOnSegment(d.p, d.seg)).toEqual(d.expected)
    })
  })
})

describe("computeDistanceBetweenPointAndSegment", () => {
  const testDatas = [
    {
      p: { x: 0, y: 5 },
      seg: { p1: { x: 0, y: 0 }, p2: { x: 5, y: 5 } },
      expected: 3.5,
    },
    {
      p: { x: -5, y: 1 },
      seg: { p1: { x: 0, y: 0 }, p2: { x: 10, y: 10 } },
      expected: 5.1,
    },
    {
      p: { x: 20, y: 20 },
      seg: { p1: { x: 0, y: 0 }, p2: { x: 10, y: 10 } },
      expected: 14.1,
    },
    {
      p: { x: 2, y: 5 },
      seg: { p1: { x: -2, y: 2 }, p2: { x: 2, y: -2 } },
      expected: 4.9,
    },
    {
      p: { x: 25, y: 25 },
      seg: { p1: { x: 0, y: 0 }, p2: { x: 0, y: 50 } },
      expected: 25,
    },
  ]
  testDatas.forEach((d) => {
    test(`should computed the distance from P1[${JSON.stringify(d.p)}] to segment A[${JSON.stringify(d.seg.p1)}] B[${JSON.stringify(d.seg.p2)}] to equal ${JSON.stringify(d.expected)}`, () => {
      expect(round(computeDistanceBetweenPointAndSegment(d.p, d.seg), 1)).toEqual(d.expected)
    })
  })
})
