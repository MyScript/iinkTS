import { maxRelativeDeviation, median, relativeMad } from "./stats"

describe("median", () => {
  test("returns the middle value for an odd count", () => {
    expect(median([3, 1, 2])).toBe(2)
  })

  test("averages the two middle values for an even count", () => {
    expect(median([1, 2, 3, 4])).toBe(2.5)
  })

  test("does not mutate its input", () => {
    const values = [3, 1, 2]
    median(values)
    expect(values).toEqual([3, 1, 2])
  })
})

describe("relativeMad", () => {
  test("is zero for a single sample, where there is no dispersion to measure", () => {
    expect(relativeMad([5])).toBe(0)
  })

  test("is zero for identical samples", () => {
    expect(relativeMad([4, 4, 4])).toBe(0)
  })

  test("is blind to a single outlier — the property that made it wrong for a threshold", () => {
    const tight = [10, 10, 10, 10, 10]
    const oneOutlier = [10, 10, 10, 10, 14]
    expect(relativeMad(oneOutlier)).toBe(relativeMad(tight))
  })
})

describe("maxRelativeDeviation", () => {
  test("is zero for a single sample", () => {
    expect(maxRelativeDeviation([5])).toBe(0)
  })

  test("catches the outlier the MAD hides", () => {
    const values = [10, 10, 10, 10, 14]
    expect(relativeMad(values)).toBe(0)
    expect(maxRelativeDeviation(values)).toBeCloseTo(0.4, 10)
  })

  test("widens as more of the distribution is seen, which is what a tolerance must do", () => {
    const few = [10, 10, 11]
    const more = [10, 10, 11, 10, 13]
    expect(maxRelativeDeviation(more)).toBeGreaterThan(maxRelativeDeviation(few))
  })

  test("is never below the MAD for the same samples", () => {
    const values = [8, 9, 10, 11, 30]
    expect(maxRelativeDeviation(values)).toBeGreaterThanOrEqual(relativeMad(values))
  })

  test("guards against a non-positive centre rather than dividing by it", () => {
    expect(maxRelativeDeviation([0, 0, 0])).toBe(0)
    expect(maxRelativeDeviation([-1, 0, 1])).toBe(0)
  })
})
