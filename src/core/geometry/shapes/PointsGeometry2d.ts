import { applyMatrixToPoint, type TMatrixTransform } from "../Matrix"
import type { TPoint } from "../Point"
import { Geometry2d, type TGeometry2dOptions } from "./Geometry2d"

/**
 * @group Core/Geometry
 * @summary A shape defined by a list of points it stores.
 *
 * What every straight-edged geometry here has in common: it holds its vertices rather than deriving
 * them, so `computeVertices` is the list, and moving it is mapping the list. Only the flags and, for
 * one of them, the overlap test differ — which is all a subclass is left to say.
 *
 * Curved shapes do not belong here. A circle is defined by a centre and a radius, and tessellating it
 * into a point list is what it does to *approximate* itself for a generic test, not what it is.
 */
export abstract class PointsGeometry2d extends Geometry2d {
  /**
   * Read directly rather than through {@link Geometry2d.vertices} by subclasses on a hot path: the
   * getter memoizes, so both give the same array, but hit-testing calls this once per sample.
   */
  protected readonly points: TPoint[]

  constructor(points: TPoint[], options: TGeometry2dOptions) {
    super(options)
    this.points = points
  }

  protected computeVertices(): TPoint[] {
    return this.points
  }

  /**
   * This shape's points carried through `matrix`, for a subclass to hand to the shape it builds.
   *
   * Exact however the matrix turns or scales — a point maps to a point, with nothing to approximate
   * and no accumulated tessellation error to carry.
   */
  protected mapPoints(matrix: TMatrixTransform): TPoint[] {
    return this.points.map((point) => applyMatrixToPoint(point, matrix))
  }
}
