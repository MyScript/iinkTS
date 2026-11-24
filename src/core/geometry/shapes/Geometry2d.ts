import type { TBox } from "../Box"
import { BoxOps } from "../Box"
import { isPointInsidePolygon } from "../containment"
import { computeDistance } from "../distance"
import { findIntersectionBetween2Segment } from "../intersection"
import { MatrixTransform, type TMatrixTransform } from "../Matrix"
import type { TOBB } from "../OBB"
import { OBBOps } from "../OBB"
import type { TPoint, TSegment } from "../Point"
import { computeNearestPointOnSegment } from "../segment"

/**
 * @group Core/Geometry
 * @summary What a geometry is, beyond the points it is made of.
 *
 * Two independent questions, and conflating them is what left a hole in the test this replaces.
 *
 * - `isClosed` — does the last vertex join back to the first? A polygon does, a polyline does not.
 *   It decides whether {@link Geometry2d.edges} emits a closing edge, and so what the perimeter is.
 * - `isFilled` — does the inside belong to the shape? A rectangle with a fill does, the same
 *   rectangle drawn as an outline does not. It decides whether a point strictly inside, touching no
 *   edge, counts as a hit.
 *
 * Options on the base rather than separate subclasses: a filled and an unfilled polygon differ in
 * one predicate, not in how either computes anything.
 */
export type TGeometry2dOptions = {
  isClosed: boolean
  isFilled: boolean
  /**
   * The angle, in radians, of the frame this shape's tight box is measured in. Zero — axis-aligned —
   * for a shape as it was built; whatever rotation it has been carried through afterwards.
   *
   * It exists so a turned shape keeps a *turned* box rather than the axis-aligned one that contains
   * it. The two differ by up to a factor of sqrt(2) on the diagonal, and {@link Geometry2d.bounds}
   * feeds containment and overlap, so the looser box does not merely look wrong — it selects symbols
   * a query never reached.
   */
  frameAngle?: number
  /**
   * How far beyond its own outline this shape asks to be found, in units.
   *
   * Not decoration: a hairline is a few tenths of a unit across, and a box drawn exactly around it
   * is a target nobody can hit. An edge pads its box by `HIT_TOLERANCE` on each side for
   * that reason, and by more again when it carries an arrow head, which is drawn outside the path it
   * belongs to and would otherwise fall outside the shape's own bounds.
   *
   * It widens {@link Geometry2d.bounds} only. Edges, vertices and length stay the shape as drawn, so
   * a crossing test is unchanged and only the "is it near enough" question moves — which is the one
   * the padding is about.
   */
  padding?: number
}

/**
 * @group Core/Geometry
 * @summary A shape that can answer questions about itself.
 *
 * Geometry used to be data — a `{ bounds, vertices, edges, length }` record each symbol type built
 * for itself — and every type then had to carry its own `overlaps`, because a record cannot be
 * asked anything. Six of the eight ended up as the same call, `polygonOverlapsBox`, and the two
 * that did not (a stroke tests its pointers, a circle tests its radius) had to be special-cased
 * elsewhere. Here the shape answers, so a symbol type only has to say what shape it is.
 *
 * **The hole this closes.** `polygonOverlapsBox` is "the shape's bounds sit inside the query, or
 * some edge crosses some side of it". Both halves are about the boundary, so a query landing
 * entirely *within* a shape without touching its outline was missed — a real miss for a filled
 * shape, and correct for an unfilled one. Nothing in a plain record could tell those apart;
 * {@link TGeometry2dOptions.isFilled} does.
 *
 * **Derived values are computed once per instance.** `vertices`, `edges`, `bounds` and `length` all
 * fall out of each other, and a caller that reads bounds usually reads vertices next. Instances are
 * themselves cached per symbol by `SymbolGeometry`, so "once per instance" is once per symbol
 * version — there is no invalidation to get wrong, because a changed symbol is a different object
 * and gets a different instance.
 */
export abstract class Geometry2d {
  readonly isClosed: boolean
  readonly isFilled: boolean
  readonly frameAngle: number
  readonly padding: number

  #vertices?: TPoint[]
  #edges?: TSegment[]
  #bounds?: TOBB
  #length?: number

  constructor({ isClosed, isFilled, frameAngle = 0, padding = 0 }: TGeometry2dOptions) {
    this.isClosed = isClosed
    this.isFilled = isFilled
    this.frameAngle = frameAngle
    this.padding = padding
  }

  /**
   * The points this shape is made of, in order.
   *
   * A curve tessellates here — there is no exact vertex list for a circle, and the subclass that
   * draws one decides how finely to approximate it. A shape whose test does not need an
   * approximation overrides the methods that would use it instead.
   *
   * Implemented rather than exposed directly so the result can be held: see the class note.
   */
  protected abstract computeVertices(): TPoint[]

  get vertices(): TPoint[] {
    this.#vertices ??= this.computeVertices()
    return this.#vertices
  }

  /**
   * This shape carried through `matrix`.
   *
   * Abstract because only the shape knows what it stays under a transform: a circle scaled by
   * different factors on each axis is an ellipse, not a circle, and not a tessellation of one
   * either. Returning the exact shape is what lets a moved symbol keep an exact test, where mapping
   * a fixed vertex list forward would bake in whatever approximation the vertices already carried.
   *
   * An implementation must carry {@link frameAngle} forward too, adding the matrix's own rotation to
   * it — {@link Geometry2d.rotatedFrameAngle} does that. Dropping it silently widens the shape's box
   * the first time anything turns it.
   */
  abstract transform(matrix: TMatrixTransform): Geometry2d

  /**
   * This shape's frame angle after `matrix` is applied — for an implementation of
   * {@link Geometry2d.transform} to hand to the shape it builds.
   */
  protected rotatedFrameAngle(matrix: TMatrixTransform): number {
    return this.frameAngle + MatrixTransform.rotation(matrix)
  }

  /**
   * The segments between consecutive vertices, plus the closing one when {@link isClosed}.
   *
   * That closing edge is the whole of what `isClosed` changes here, and it is not cosmetic: without
   * it a polygon's last side is missing from every edge-crossing test, so a query touching only
   * that side would report no overlap.
   */
  get edges(): TSegment[] {
    this.#edges ??= Geometry2d.#buildEdges(this.vertices, this.isClosed)
    return this.#edges
  }

  static #buildEdges(vertices: TPoint[], isClosed: boolean): TSegment[] {
    if (vertices.length < 2) {
      return []
    }
    const edges: TSegment[] = []
    for (let i = 0; i < vertices.length - 1; i++) {
      edges.push({ p1: vertices[i], p2: vertices[i + 1] })
    }
    if (isClosed) {
      edges.push({ p1: vertices[vertices.length - 1], p2: vertices[0] })
    }
    return edges
  }

  /**
   * The smallest box containing every vertex, measured in this shape's own frame.
   *
   * Axis-aligned while {@link frameAngle} is zero, and turned with the shape once it is not — which
   * is what keeps a rotated shape's box tight instead of letting it grow to the axis-aligned box
   * around the turned one.
   */
  get bounds(): TOBB {
    this.#bounds ??= this.#computeBounds()
    return this.#bounds
  }

  #computeBounds(): TOBB {
    const tight = OBBOps.createFromPointsAtAngle(this.vertices, this.frameAngle)
    if (!this.padding) {
      return tight
    }
    return { ...tight, width: tight.width + this.padding * 2, height: tight.height + this.padding * 2 }
  }

  /** Total length along the edges — a perimeter when {@link isClosed}, a path length otherwise. */
  get length(): number {
    this.#length ??= this.edges.reduce((total, edge) => total + computeDistance(edge.p1, edge.p2), 0)
    return this.#length
  }

  /**
   * Whether this shape and an axis-aligned query box share any area.
   *
   * Concrete, and the generic answer for anything made of straight edges: the shape sits inside the
   * query, or an edge crosses it, or — for a filled shape only — the query sits inside the shape.
   *
   * A subclass overrides this when it has an exact test of its own that a vertex list can only
   * approximate, which for a curve it always can.
   */
  overlapsBox(box: TBox): boolean {
    // A shape with no points has no extent, and must not be caught by anything. Without this its
    // box is a zero-sized one at the origin, which `isContained` reports as inside any query
    // covering the origin — so an unregistered kind would have selected itself near the page corner.
    if (this.vertices.length === 0) {
      return false
    }
    // Any vertex inside the query, rather than "the whole box fits inside it": the box carries
    // `padding`, so a shape lying wholly within a query no larger than that padding would report no
    // overlap — a hairline selected by a rectangle drawn snugly around it, missed for being too
    // generously padded. Vertices are the shape as drawn, and a shape inside the query has all of
    // them inside it.
    if (this.vertices.some((vertex) => BoxOps.containsPoint(box, vertex))) {
      return true
    }
    const sides = BoxOps.getSides(box)
    if (this.edges.some((edge) => sides.some((side) => !!findIntersectionBetween2Segment(edge, side)))) {
      return true
    }
    // One corner is enough, and only because the two tests above already ran: no edge crosses the
    // box, so the box lies wholly inside this shape or wholly outside it — there is no third case
    // for one corner to disagree with the others about.
    return this.containsPoint({ x: box.x, y: box.y })
  }

  /**
   * Whether `point` is inside this shape's outline.
   *
   * Always false for an unfilled shape: there is no inside to be in. Callers wanting "on or near the
   * outline" want {@link hitTestPoint}.
   */
  containsPoint(point: TPoint): boolean {
    return this.isFilled && this.isClosed && isPointInsidePolygon(point, this.vertices)
  }

  /** The point of this shape's outline closest to `point`. */
  nearestPoint(point: TPoint): TPoint {
    const { edges } = this
    if (edges.length === 0) {
      return this.vertices[0] ?? point
    }
    let best = computeNearestPointOnSegment(point, edges[0])
    let bestDistance = computeDistance(point, best)
    for (let i = 1; i < edges.length; i++) {
      const candidate = computeNearestPointOnSegment(point, edges[i])
      const distance = computeDistance(point, candidate)
      if (distance < bestDistance) {
        best = candidate
        bestDistance = distance
      }
    }
    return best
  }

  /** Distance from `point` to this shape's outline. Zero on the outline, positive on either side. */
  distanceToPoint(point: TPoint): number {
    return computeDistance(point, this.nearestPoint(point))
  }

  /**
   * Whether `point` hits this shape, allowing `margin` of slack around its outline.
   *
   * Inside a filled shape counts however far from the outline it is — that is what filled means.
   */
  hitTestPoint(point: TPoint, margin = 0): boolean {
    return this.containsPoint(point) || this.distanceToPoint(point) <= margin
  }
}
