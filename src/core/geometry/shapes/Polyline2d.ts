import type { TMatrixTransform } from "../Matrix"
import type { TPoint } from "../Point"
import { PointsGeometry2d } from "./PointsGeometry2d"

/**
 * @group Core/Geometry
 * @summary An open run of vertices: a drawn path that does not close.
 *
 * The shape of a line, a polyline, and of an arc once tessellated. It is a {@link Polygon2d} minus
 * the closing edge, and that edge is the whole difference: without it the last vertex joins nothing,
 * so the path has a length rather than a perimeter and no inside for anything to be in.
 *
 * Caught by a query its *path* crosses — the generic test {@link Geometry2d} provides, which is the
 * right one for a line someone drew. A stroke looks the same and is not tested this way; see
 * {@link PointSet2d} for why.
 */
export class Polyline2d extends PointsGeometry2d {
  constructor(points: TPoint[], padding = 0, frameAngle = 0) {
    // Never filled: an open path has no interior to fill. `isFilled` would be meaningless rather
    // than merely false — `containsPoint` needs a closed ring to test against.
    super(points, { isClosed: false, isFilled: false, frameAngle, padding })
  }

  override transform(matrix: TMatrixTransform): Polyline2d {
    return new Polyline2d(this.mapPoints(matrix), this.padding, this.rotatedFrameAngle(matrix))
  }
}
