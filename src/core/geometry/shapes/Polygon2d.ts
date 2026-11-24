import type { TMatrixTransform } from "../Matrix"
import type { TPoint } from "../Point"
import { PointsGeometry2d } from "./PointsGeometry2d"

/**
 * @group Core/Geometry
 * @summary A closed run of vertices: the last joins back to the first.
 *
 * The shape of a polygon, and of anything a straight-edged outline approximates — a tessellated
 * ellipse, the box a typeset symbol is measured at. Everything it answers comes from
 * {@link Geometry2d}: a closed ring of straight edges is exactly the case the base class computes
 * for, so there is nothing to override but the vertices and how they move.
 *
 * **`isFilled` is a real question, not a default.** It decides whether a point inside the outline,
 * touching no edge, counts as a hit — and with it, whether a selection box lying wholly within the
 * shape selects it. The test this replaces, `OBBOps.polygonOverlapsBox`, could not ask: it is "the
 * shape's bounds sit inside the query, or an edge crosses a side of it", both of which are about the
 * boundary, so a query strictly inside was always missed. That is right for an outline and wrong for
 * a filled shape, and only the caller knows which it has.
 */
export class Polygon2d extends PointsGeometry2d {
  constructor(points: TPoint[], isFilled = false, frameAngle = 0) {
    super(points, { isClosed: true, isFilled, frameAngle })
  }

  /**
   * A polygon's vertices are its exact shape, so moving them is exact however the matrix turns or
   * scales — no approximation to carry forward. The frame goes with them, because the tight box
   * around a turned polygon is only tight in a frame that turned too.
   */
  override transform(matrix: TMatrixTransform): Polygon2d {
    return new Polygon2d(this.mapPoints(matrix), this.isFilled, this.rotatedFrameAngle(matrix))
  }
}
