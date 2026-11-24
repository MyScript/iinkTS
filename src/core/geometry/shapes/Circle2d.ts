import { computeTessellationCount, TWO_PI } from "../../math"
import { TESSELLATION_SEGMENT_LENGTH } from "../../math/tessellation"
import { BoxOps, type TBox } from "../Box"
import { findIntersectBetweenSegmentAndCircle } from "../intersection"
import { applyMatrixToPoint, type TMatrixTransform } from "../Matrix"
import { OBBOps, type TOBB } from "../OBB"
import type { TPoint } from "../Point"
import { Ellipse2d } from "./Ellipse2d"
import { Geometry2d } from "./Geometry2d"

/**
 * How far the linear part of a matrix may stray from a similarity and still be treated as one.
 *
 * A similarity — a rotation, possibly with a uniform scale — sends a circle to a circle; anything
 * else sends it to an ellipse. The test is on the matrix's own coefficients, which are built by
 * composing transforms and so accumulate rounding, hence a tolerance rather than equality. It is
 * relative to the matrix's own scale, so it means the same thing for a symbol drawn at 10 units and
 * one drawn at 10 000.
 */
const SIMILARITY_TOLERANCE = 1e-9

/**
 * @group Core/Geometry
 * @summary A circle, tested by its radius rather than by a polygon standing in for it.
 *
 * Its overlap is exact, where every other curved shape here settles for a sampled outline: a circle
 * is the one curve with a cheap closed-form answer to "does this segment cross me", so it would be
 * perverse to approximate it. Its box is exact too, and free — a circle's box is its radius.
 */
export class Circle2d extends Geometry2d {
  readonly center: TPoint
  readonly radius: number

  constructor(center: TPoint, radius: number, isFilled = false) {
    // No frame angle: a circle is the same shape from every direction, so its tight box is the same
    // box whichever frame it is measured in. Nothing to carry, and nothing a rotation would change.
    super({ isClosed: true, isFilled })
    this.center = center
    this.radius = radius
  }

  /**
   * The curve sampled into chords — used by {@link Geometry2d.nearestPoint} and by anything reading
   * `edges`, never by {@link Circle2d.overlapsBox} or {@link Circle2d.bounds}, both of which have an
   * exact answer of their own.
   */
  protected computeVertices(): TPoint[] {
    const count = computeTessellationCount(TWO_PI * this.radius, TESSELLATION_SEGMENT_LENGTH)
    const vertices: TPoint[] = []
    for (let i = 0; i < count; i++) {
      // From the bottom of the circle, counter-clockwise — the convention the library already had,
      // kept because a closed ring is walked by connectors and anything reading these expects to
      // start where it always did.
      const angle = TWO_PI * (i / count)
      vertices.push({
        x: this.center.x - this.radius * Math.sin(angle),
        y: this.center.y + this.radius * Math.cos(angle),
      })
    }
    return vertices
  }

  /** The radius, doubled. Exact, and without touching a single vertex. */
  override get bounds(): TOBB {
    return OBBOps.create(this.center, this.radius * 2, this.radius * 2)
  }

  /**
   * Exact: the circle sits inside the query, or one of the query's four sides crosses it, or — when
   * filled — the query sits inside the circle.
   *
   * The sampled outline the base class would use is always a little inside the true curve, so a
   * query grazing the circle near a chord's middle would be missed.
   */
  override overlapsBox(box: TBox): boolean {
    if (OBBOps.isContained(this.bounds, box)) {
      return true
    }
    const crosses = BoxOps.getSides(box).some(
      (side) => findIntersectBetweenSegmentAndCircle(side, this.center, this.radius).length > 0
    )
    return crosses || this.containsPoint({ x: box.x, y: box.y })
  }

  /** Exact, by distance, where the base class would ask a polygon standing in for the circle. */
  override containsPoint(point: TPoint): boolean {
    return this.isFilled && Math.hypot(point.x - this.center.x, point.y - this.center.y) <= this.radius
  }

  /**
   * A circle only stays a circle under a similarity — a rotation with one scale for both axes.
   * Stretched unevenly it becomes an **exact** {@link Ellipse2d}, not a sampled approximation of one,
   * which is the whole reason that class exists.
   */
  override transform(matrix: TMatrixTransform): Circle2d | Ellipse2d {
    const { xx, xy, yx, yy } = matrix
    const scale = Math.hypot(xx, yx)
    const tolerance = SIMILARITY_TOLERANCE * Math.max(1, Math.abs(xx), Math.abs(xy), Math.abs(yx), Math.abs(yy))
    if (Math.abs(xx - yy) <= tolerance && Math.abs(xy + yx) <= tolerance) {
      return new Circle2d(applyMatrixToPoint(this.center, matrix), this.radius * scale, this.isFilled)
    }
    return Ellipse2d.fromRadii(this.center, this.radius, this.radius, 0, this.isFilled).transform(matrix)
  }
}
