import type { TBox, TPoint, TSegment } from "@/core"
import { BoxOps, findIntersectionBetween2Segment, isPointInsidePolygon } from "@/core"
/**
 * @group Symbol
 */
export type TTypesetChild = {
  id: string
  label: string
  color: string
  bounds: TBox
  fontSize: number
  fontWeight: "normal" | "bold"
}

/**
 * The quad a typeset symbol occupies on screen, **before** its matrix is applied —
 * `OBBOps.toUnrotatedBox`, not `OBBOps.toBox`, which would hand over an envelope already grown for
 * an angle and have `SymbolGeometry` grow it a second time. Turning a typeset symbol is composing
 * its matrix now, not recording an angle here, so this is always the axis-aligned box.
 *
 * @group Symbol
 */
export function computeTypesetVertices(bounds: TBox): TPoint[] {
  return BoxOps.getCorners(bounds)
}

/**
 * @group Symbol
 */
export function computeTypesetSnapPoints(bounds: TBox, point: TPoint): TPoint[] {
  const yMax = bounds.y + bounds.height
  const xMax = bounds.x + bounds.width
  const offsetY = yMax - point.y
  return [
    { x: bounds.x, y: bounds.y + offsetY },
    { x: xMax, y: bounds.y + offsetY },
    { x: xMax, y: yMax - offsetY },
    { x: bounds.x, y: yMax - offsetY },
    BoxOps.getCenter(bounds),
  ]
}

/**
 * @group Symbol
 */
export function computeClosedEdges(vertices: TPoint[]): TSegment[] {
  return vertices.map((p, i) => ({
    p1: p,
    p2: vertices[(i + 1) % vertices.length],
  }))
}

/**
 * Whether a typeset symbol (its own `vertices`/`edges`, from {@link computeTypesetVertices}/
 * {@link computeClosedEdges}) overlaps `box` — either a vertex lands inside `box`, or one of its
 * edges crosses one of `box`'s sides.
 * @group Symbol
 */
export function typesetOverlapsBox(vertices: TPoint[], edges: TSegment[], box: TBox): boolean {
  return (
    vertices.some((p) => BoxOps.containsPoint(box, p)) ||
    edges.some((e1) => BoxOps.getSides(box).some((e2) => !!findIntersectionBetween2Segment(e1, e2)))
  )
}

/**
 * Filters `children` (Text chars / Math elements — anything shaped like {@link TTypesetChild})
 * to those whose bounds contain at least one of `points`.
 * @group Symbol
 */
export function computeChildrenOverlaps<T extends TTypesetChild>(children: T[], points: TPoint[]): T[] {
  return children.filter((c) => {
    const corners = computeTypesetVertices(c.bounds)
    return points.some((p) => isPointInsidePolygon(p, corners))
  })
}
