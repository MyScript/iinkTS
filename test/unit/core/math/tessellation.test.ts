import { computeTessellationCount } from "@/iink"

describe("computeTessellationCount", () => {
  test("should floor to minPoints when the computed count is lower", () => {
    expect(computeTessellationCount(5, 10)).toEqual(8)
  })
  test("should round length/minSegmentLength when above minPoints", () => {
    expect(computeTessellationCount(314, 10)).toEqual(31)
  })
  test("should accept a custom minPoints floor", () => {
    expect(computeTessellationCount(5, 10, 2)).toEqual(2)
  })
})
