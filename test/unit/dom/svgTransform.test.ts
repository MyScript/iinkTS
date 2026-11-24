import { bumpSvgTransformVersion, getSvgTransformVersion } from "@/iink"

describe("svgTransform.ts", () => {
  test("should start at version 0 for an svg never bumped", () => {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg") as SVGSVGElement
    expect(getSvgTransformVersion(svg)).toBe(0)
  })

  test("should increment version on each bump", () => {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg") as SVGSVGElement
    bumpSvgTransformVersion(svg)
    expect(getSvgTransformVersion(svg)).toBe(1)
    bumpSvgTransformVersion(svg)
    expect(getSvgTransformVersion(svg)).toBe(2)
  })

  test("should track versions independently per svg element", () => {
    const svgA = document.createElementNS("http://www.w3.org/2000/svg", "svg") as SVGSVGElement
    const svgB = document.createElementNS("http://www.w3.org/2000/svg", "svg") as SVGSVGElement
    bumpSvgTransformVersion(svgA)
    expect(getSvgTransformVersion(svgA)).toBe(1)
    expect(getSvgTransformVersion(svgB)).toBe(0)
  })
})
