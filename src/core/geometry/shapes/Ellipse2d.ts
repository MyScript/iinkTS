import { computeEllipseRadiusAverage, computeTessellationCount, TWO_PI } from "../../math"
import { TESSELLATION_SEGMENT_LENGTH } from "../../math/tessellation"
import { applyMatrixToPoint, type TMatrixTransform } from "../Matrix"
import type { TOBB } from "../OBB"
import type { TPoint } from "../Point"
import { Geometry2d } from "./Geometry2d"

/**
 * @group Core/Geometry
 * @summary The two vectors the unit circle's axes are sent to.
 *
 * An ellipse is the image of the unit circle under a linear map, and this is that map: the point at
 * angle `t` is `center + (xx·cos t + xy·sin t, yx·cos t + yy·sin t)`. `(xx, yx)` is where (1, 0)
 * lands and `(xy, yy)` where (0, 1) does.
 *
 * Stored this way rather than as radii and an orientation because it is what makes
 * {@link Ellipse2d.transform} exact and cheap: carrying an ellipse through a matrix is composing the
 * two maps, where radii and an angle would have to be recovered from the product — a singular value
 * decomposition, per transform, to describe the same thing.
 */
export type TEllipseAxes = {
  xx: number
  xy: number
  yx: number
  yy: number
}

/**
 * @group Core/Geometry
 * @summary An ellipse, and so also a circle that a matrix has stretched out of shape.
 *
 * Two things are exact here and were approximations before: its box, and what it becomes under a
 * transform. Its overlap test is not — see {@link Ellipse2d.computeVertices}.
 */
export class Ellipse2d extends Geometry2d {
  readonly center: TPoint
  readonly axes: TEllipseAxes

  constructor(center: TPoint, axes: TEllipseAxes, isFilled = false, frameAngle = 0) {
    super({ isClosed: true, isFilled, frameAngle })
    this.center = center
    this.axes = axes
  }

  /**
   * The ellipse a symbol describes: half-widths along two perpendicular axes, turned by
   * `orientation`.
   */
  static fromRadii(
    center: TPoint,
    radiusX: number,
    radiusY: number,
    orientation = 0,
    isFilled = false,
    frameAngle = 0
  ): Ellipse2d {
    const cos = Math.cos(orientation)
    const sin = Math.sin(orientation)
    return new Ellipse2d(
      center,
      { xx: radiusX * cos, xy: -radiusY * sin, yx: radiusX * sin, yy: radiusY * cos },
      isFilled,
      frameAngle
    )
  }

  /** The point at angle `t` around the ellipse, measured in the frame its axes define. */
  pointAt(t: number): TPoint {
    const cos = Math.cos(t)
    const sin = Math.sin(t)
    return {
      x: this.center.x + this.axes.xx * cos + this.axes.xy * sin,
      y: this.center.y + this.axes.yx * cos + this.axes.yy * sin,
    }
  }

  /**
   * The curve, sampled into straight chords.
   *
   * This is the one approximation the class carries, and it is what {@link Geometry2d.overlapsBox}
   * and {@link Geometry2d.nearestPoint} fall back on. Each chord is a secant, so the sampled polygon
   * sits inside the true ellipse by at most that chord's sagitta — about `c²/(8r)` for a chord of
   * length `c` on a curve of local radius `r`. Spacing is `TESSELLATION_SEGMENT_LENGTH`, which puts the error
   * well under a pixel for anything drawn at a normal size.
   *
   * `bounds` does **not** go through here: an ellipse's box has a closed form, and using the sampled
   * points would make it a shade too small in every direction at once.
   */
  protected computeVertices(): TPoint[] {
    const count = computeTessellationCount(TWO_PI * this.#averageRadius(), TESSELLATION_SEGMENT_LENGTH)
    const vertices: TPoint[] = []
    for (let i = 0; i < count; i++) {
      vertices.push(this.pointAt(TWO_PI * (i / count)))
    }
    return vertices
  }

  /**
   * The radius a circle of the same perimeter would have, to the same approximation the rest of the
   * library uses — the quadratic mean of the two semi-axes, not the arithmetic one. Keeping the same
   * estimate keeps the same vertex count, and so the same sampled outline, as before.
   */
  #averageRadius(): number {
    const { xx, xy, yx, yy } = this.axes
    return computeEllipseRadiusAverage(Math.hypot(xx, yx), Math.hypot(xy, yy))
  }

  /**
   * The tightest box at {@link Geometry2d.frameAngle}, in closed form.
   *
   * The half-extent along a direction is the length of the ellipse's map projected onto it, so both
   * come straight out of the axes — no sampling, and exact however the ellipse is turned or
   * stretched. Overridden rather than inherited because the inherited one measures the sampled
   * polygon, which is always a little inside the curve.
   */
  override get bounds(): TOBB {
    const cos = Math.cos(this.frameAngle)
    const sin = Math.sin(this.frameAngle)
    const { xx, xy, yx, yy } = this.axes
    // The map seen from the frame, i.e. rotated by -frameAngle.
    const halfWidth = Math.hypot(cos * xx + sin * yx, cos * xy + sin * yy)
    const halfHeight = Math.hypot(-sin * xx + cos * yx, -sin * xy + cos * yy)
    return {
      center: { x: this.center.x, y: this.center.y },
      width: halfWidth * 2,
      height: halfHeight * 2,
      angle: this.frameAngle,
    }
  }

  /**
   * Exact: an affine map sends an ellipse to an ellipse, and composing the two maps is the whole of
   * it. Nothing is recovered, decomposed or resampled, so an ellipse stretched a hundred times in a
   * row is as exact as one stretched once.
   */
  override transform(matrix: TMatrixTransform): Ellipse2d {
    const { xx, xy, yx, yy } = this.axes
    return new Ellipse2d(
      applyMatrixToPoint(this.center, matrix),
      {
        xx: matrix.xx * xx + matrix.xy * yx,
        xy: matrix.xx * xy + matrix.xy * yy,
        yx: matrix.yx * xx + matrix.yy * yx,
        yy: matrix.yx * xy + matrix.yy * yy,
      },
      this.isFilled,
      this.rotatedFrameAngle(matrix)
    )
  }
}
