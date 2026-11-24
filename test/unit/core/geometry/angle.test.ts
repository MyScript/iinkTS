import { round } from "../../helpers"

import { computeAngleAxeRadian, computeRotatedPoint } from "@/iink"

describe("computeAngleAxeRadian", () => {
  const testDatas = [
    {
      p1: { x: 0, y: 0 },
      p2: { x: 10, y: 0 },
      expect: 0,
    },
    {
      p1: { x: 10, y: 0 },
      p2: { x: 0, y: 0 },
      expect: 3.14,
    },
    {
      p1: { x: 0, y: 0 },
      p2: { x: 0, y: 1 },
      expect: 1.5708,
    },
    {
      p1: { x: 0, y: 1 },
      p2: { x: 0, y: 0 },
      expect: -1.5708,
    },
    {
      p1: { x: 0, y: 0 },
      p2: { x: 1, y: 1 },
      expect: 0.79,
    },
    {
      p1: { x: 1, y: 1 },
      p2: { x: 0, y: 0 },
      expect: -2.36,
    },
    {
      p1: { x: 0, y: 0 },
      p2: { x: 3, y: 1 },
      expect: 0.32,
    },
    {
      p1: { x: 3, y: 0 },
      p2: { x: 0, y: 1 },
      expect: 2.82,
    },
  ]
  testDatas.forEach((d) => {
    test(`should compute radian for P1[${JSON.stringify(d.p1)}] P2[${JSON.stringify(d.p2)}] to equal ${d.expect}`, () => {
      expect(round(computeAngleAxeRadian(d.p1, d.p2))).toEqual(round(d.expect))
    })
  })
})

describe("computeRotatedPoint", () => {
  const testDatas = [
    { point: { x: 2, y: 3 }, center: { x: 0, y: 0 }, radian: Math.PI / 4, expected: { x: -0.707, y: 3.536 } },
    { point: { x: 2, y: 3 }, center: { x: 4, y: 6 }, radian: Math.PI / 4, expected: { x: 4.707, y: 2.464 } },
    { point: { x: 2, y: 3 }, center: { x: 0, y: 0 }, radian: Math.PI / 3, expected: { x: -1.598, y: 3.232 } },
    { point: { x: 2, y: 3 }, center: { x: 4, y: 6 }, radian: Math.PI / 3, expected: { x: 5.598, y: 2.768 } },
    { point: { x: 2, y: 3 }, center: { x: 0, y: 0 }, radian: Math.PI / 2, expected: { x: -3, y: 2 } },
    { point: { x: 2, y: 3 }, center: { x: 4, y: 6 }, radian: Math.PI / 2, expected: { x: 7, y: 4 } },
    { point: { x: 2, y: 3 }, center: { x: 0, y: 0 }, radian: Math.PI, expected: { x: -2, y: -3 } },
    { point: { x: 2, y: 3 }, center: { x: 4, y: 6 }, radian: Math.PI, expected: { x: 6, y: 9 } },
  ]
  testDatas.forEach((d) => {
    test(`shoud rotate P[${JSON.stringify(d.point)}]° by ${d.radian} rad with center C[${JSON.stringify(d.center)}]`, () => {
      const result = computeRotatedPoint(d.point, d.center, d.radian)
      expect(result).toEqual(d.expected)
    })
  })
})
