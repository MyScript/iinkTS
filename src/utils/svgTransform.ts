const transformVersions = new WeakMap<SVGSVGElement, number>()

/**
 * Marks `svg`'s screen transform (pan/zoom/resize) as changed, invalidating
 * any value cached against a previous {@link getSvgTransformVersion} read.
 * @group Utilities
 */
export function bumpSvgTransformVersion(svg: SVGSVGElement): void {
  transformVersions.set(svg, (transformVersions.get(svg) ?? 0) + 1)
}

/**
 * Current transform version for `svg`, incremented by {@link bumpSvgTransformVersion}.
 * @group Utilities
 */
export function getSvgTransformVersion(svg: SVGSVGElement): number {
  return transformVersions.get(svg) ?? 0
}
