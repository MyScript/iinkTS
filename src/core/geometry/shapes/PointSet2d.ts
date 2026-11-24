import type { TBox } from "../Box"
import type { TMatrixTransform } from "../Matrix"
import type { TPoint } from "../Point"
import { PointsGeometry2d } from "./PointsGeometry2d"

/**
 * @group Core/Geometry
 * @summary An ordered run of sampled points, caught by the samples themselves.
 *
 * The shape a stroke has. Its path, its length and its bounds all come from the same run of points,
 * so everything {@link Geometry2d} derives is already right here — only the overlap test differs,
 * and it differs on purpose.
 *
 * **Why the test is the points and not the path.** Everything else in this module answers "does the
 * query touch the shape I draw". A stroke answers a different question: "did the query catch a
 * sample". The two part company when a query slips between two consecutive samples — a box crossing
 * the segment without containing either end. Treating that as a hit is right for a drawn line and
 * wrong for a stroke, whose selection has always meant the points it captured. Preserving that is
 * not conservatism: a stroke samples sparsely where the pen moved fast, so an edge-crossing test
 * would make a quick flick selectable from far more places than a slow one drawn identically.
 *
 * `isClosed` is false — the last sample does not join back to the first, and inventing that edge
 * would add a phantom segment straight across the stroke, lengthening it and giving hit-testing
 * something to catch that was never drawn. `isFilled` is false for the same reason a line has no
 * inside.
 */
export class PointSet2d extends PointsGeometry2d {
  constructor(points: TPoint[], frameAngle = 0) {
    super(points, { isClosed: false, isFilled: false, frameAngle })
  }

  /**
   * Whether any sample falls inside the query, bounds included.
   *
   * Inclusive on every side, so a sample exactly on the query's edge counts — a selection dragged
   * to land precisely on a point is a selection of it.
   */
  override overlapsBox(box: TBox): boolean {
    // Compared in place rather than through `BoxOps.containsPoint`, which costs two `isBetween` calls
    // per point. This runs once per sample per hit-test — 500 symbols over 20 passes is 10 000 calls
    // before a single selection is resolved — and it is the one method here on that path.
    const maxX = box.x + box.width
    const maxY = box.y + box.height
    for (const point of this.points) {
      if (point.x >= box.x && point.x <= maxX && point.y >= box.y && point.y <= maxY) {
        return true
      }
    }
    return false
  }

  override transform(matrix: TMatrixTransform): PointSet2d {
    return new PointSet2d(this.mapPoints(matrix), this.rotatedFrameAngle(matrix))
  }
}
