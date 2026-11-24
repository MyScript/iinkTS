import type { TBox } from "./Box"
import { BoxOps } from "./Box"
import { findIntersectionBetween2Segment } from "./intersection"
import type { TPoint, TSegment } from "./Point"

/**
 * Oriented Bounding Box
 * @group Core/Geometry
 */
export type TOBB = {
  center: TPoint
  width: number
  height: number
  angle: number // radians, 0 = axis-aligned
}

function projectOntoAxis(corners: TPoint[], ax: number, ay: number): [number, number] {
  let min = Infinity,
    max = -Infinity
  for (const c of corners) {
    const p = c.x * ax + c.y * ay
    if (p < min) {
      min = p
    }
    if (p > max) {
      max = p
    }
  }
  return [min, max]
}

/**
 * Whether `point` lies inside (or on the boundary of) the convex polygon `polygon` describes by its
 * corners in order.
 *
 * The winding may run either way — `polygon` can be the image of a `TBox`'s corners under a matrix
 * with a negative determinant (a reflection), which reverses it — so every edge's cross product with
 * `point` must merely agree in sign with the others, rather than assume a particular direction.
 */
function pointInConvexPolygon(polygon: TPoint[], point: TPoint): boolean {
  let sign = 0
  for (let i = 0; i < polygon.length; i++) {
    const a = polygon[i]
    const b = polygon[(i + 1) % polygon.length]
    const cross = (b.x - a.x) * (point.y - a.y) - (b.y - a.y) * (point.x - a.x)
    if (cross === 0) {
      continue
    }
    const currentSign = cross > 0 ? 1 : -1
    if (sign === 0) {
      sign = currentSign
    } else if (currentSign !== sign) {
      return false
    }
  }
  return true
}

/**
 * @group Core/Geometry
 */
export const OBBOps = {
  create(center: TPoint, width: number, height: number, angle = 0): TOBB {
    return {
      center: { x: center.x, y: center.y },
      width,
      height,
      angle,
    }
  },

  fromBox(box: TBox): TOBB {
    return {
      center: {
        x: box.x + box.width / 2,
        y: box.y + box.height / 2,
      },
      width: box.width,
      height: box.height,
      angle: 0,
    }
  },

  toBox(obb: TOBB): TBox {
    const hw = obb.width / 2
    const hh = obb.height / 2
    if (obb.angle === 0) {
      return {
        x: obb.center.x - hw,
        y: obb.center.y - hh,
        width: obb.width,
        height: obb.height,
      }
    }
    const corners = OBBOps.getCorners(obb)
    return BoxOps.createFromPoints(corners)
  },

  /**
   * The box the OBB describes *before* its own rotation — centre, width and height, angle ignored.
   *
   * {@link toBox} cannot serve this: for a non-zero angle it returns the axis-aligned **envelope**
   * of the rotated box, which is strictly larger. Both are wanted, for different questions — the
   * envelope for "what area does this cover on screen", this one for "what box is being rotated".
   * Conflating them was IIC-1999's sibling: a typeset symbol's derived vertices were built from the
   * envelope and then rotated again, so the rotation was counted twice.
   */
  toUnrotatedBox(obb: TOBB): TBox {
    return {
      x: obb.center.x - obb.width / 2,
      y: obb.center.y - obb.height / 2,
      width: obb.width,
      height: obb.height,
    }
  },

  createFromPoints(points: TPoint[]): TOBB {
    return OBBOps.fromBox(BoxOps.createFromPoints(points))
  },

  /**
   * The tightest box at `angle` containing every point.
   *
   * {@link OBBOps.createFromPoints} is this with `angle` 0. The general form exists because a shape
   * carried through a rotation still has a tight box — the same box, turned — and describing it with
   * an axis-aligned one instead inflates it by up to a factor of sqrt(2) on the diagonal, which a
   * selection outline shows and a containment test then gets wrong.
   *
   * Not {@link OBBOps.fromCorners}: that takes the **centroid** of what it is given as the box's
   * centre, which is the centre only when the points are the four corners of a rectangle — the one
   * case it is ever called with. Fed a shape's vertices it would pull the box towards whichever side
   * carries more of them. Here the centre comes from the extents, so any point list works.
   */
  createFromPointsAtAngle(points: TPoint[], angle: number): TOBB {
    if (!points?.length) {
      return { center: { x: 0, y: 0 }, width: 0, height: 0, angle }
    }
    const cos = Math.cos(angle)
    const sin = Math.sin(angle)
    let minX = Infinity
    let maxX = -Infinity
    let minY = Infinity
    let maxY = -Infinity
    for (const point of points) {
      // Into the frame turned by -angle, where the box is axis-aligned and its extents are readable.
      const x = cos * point.x + sin * point.y
      const y = -sin * point.x + cos * point.y
      minX = Math.min(minX, x)
      maxX = Math.max(maxX, x)
      minY = Math.min(minY, y)
      maxY = Math.max(maxY, y)
    }
    const localCenterX = (minX + maxX) / 2
    const localCenterY = (minY + maxY) / 2
    return {
      // Back out of the frame, so the centre is expressed where every caller reads it.
      center: {
        x: cos * localCenterX - sin * localCenterY,
        y: sin * localCenterX + cos * localCenterY,
      },
      width: maxX - minX,
      height: maxY - minY,
      angle,
    }
  },

  createFromOBBs(obbs: TOBB[]): TOBB {
    if (!obbs.length) {
      return OBBOps.create({ x: 0, y: 0 }, 0, 0)
    }
    const boxes = obbs.map(OBBOps.toBox)
    return OBBOps.fromBox(BoxOps.createFromBoxes(boxes))
  },

  getCorners(obb: TOBB): TPoint[] {
    const hw = obb.width / 2
    const hh = obb.height / 2
    const { x: cx, y: cy } = obb.center
    if (obb.angle === 0) {
      return [
        { x: cx - hw, y: cy - hh },
        { x: cx + hw, y: cy - hh },
        { x: cx + hw, y: cy + hh },
        { x: cx - hw, y: cy + hh },
      ]
    }
    const cos = Math.cos(obb.angle)
    const sin = Math.sin(obb.angle)
    return [
      {
        x: cx + cos * -hw - sin * -hh,
        y: cy + sin * -hw + cos * -hh,
      },
      {
        x: cx + cos * hw - sin * -hh,
        y: cy + sin * hw + cos * -hh,
      },
      {
        x: cx + cos * hw - sin * hh,
        y: cy + sin * hw + cos * hh,
      },
      {
        x: cx + cos * -hw - sin * hh,
        y: cy + sin * -hw + cos * hh,
      },
    ]
  },

  /**
   * The four corners, named for the round trip with {@link fromCorners}.
   *
   * Same computation as {@link getCorners} — kept as its own name because a caller fitting a box
   * back from transformed corners thinks in "to/from corners" pairs, and `getCorners` predates that
   * pairing by naming itself after the shape instead.
   */
  toCorners(obb: TOBB): TPoint[] {
    return OBBOps.getCorners(obb)
  },

  /**
   * Fits an OBB to four corners at a known angle — the fitting counterpart to {@link toCorners}.
   *
   * Takes the angle rather than solving for it (which a PCA or minimal-bounding-rectangle search
   * would have to) because every caller already knows it: it is the original box's own angle, plus
   * whatever rotation a matrix carried. That keeps this O(1) per call instead of O(points).
   *
   * The four corners are expected to form a box or, after a non-uniform scale applied to a rotated
   * box, a parallelogram. Projecting onto the given angle's axes and taking the extent along each
   * fits the *enclosing* OBB in the parallelogram case — exact for any similarity, an accepted
   * over-approximation otherwise (see `SymbolGeometry`'s `applyMatrix`, the only caller that can
   * produce a parallelogram here).
   */
  fromCorners(corners: TPoint[], angle: number): TOBB {
    const center = {
      x: corners.reduce((sum, c) => sum + c.x, 0) / corners.length,
      y: corners.reduce((sum, c) => sum + c.y, 0) / corners.length,
    }
    const cos = Math.cos(angle)
    const sin = Math.sin(angle)
    const local = corners.map((c) => {
      const dx = c.x - center.x
      const dy = c.y - center.y
      return { x: cos * dx + sin * dy, y: -sin * dx + cos * dy }
    })
    const xs = local.map((p) => p.x)
    const ys = local.map((p) => p.y)
    return {
      center,
      width: Math.max(...xs) - Math.min(...xs),
      height: Math.max(...ys) - Math.min(...ys),
      angle,
    }
  },

  getSides(obb: TOBB): TSegment[] {
    const corners = OBBOps.getCorners(obb)
    return corners.map((p, i) => ({
      p1: p,
      p2: corners[(i + 1) % 4],
    }))
  },

  getSnapPoints(obb: TOBB): TPoint[] {
    const corners = OBBOps.getCorners(obb)
    const sides = [
      {
        x: (corners[0].x + corners[1].x) / 2,
        y: (corners[0].y + corners[1].y) / 2,
      },
      {
        x: (corners[1].x + corners[2].x) / 2,
        y: (corners[1].y + corners[2].y) / 2,
      },
      {
        x: (corners[2].x + corners[3].x) / 2,
        y: (corners[2].y + corners[3].y) / 2,
      },
      {
        x: (corners[3].x + corners[0].x) / 2,
        y: (corners[3].y + corners[0].y) / 2,
      },
    ]
    return [...corners, ...sides, { ...obb.center }]
  },

  containsPoint(obb: TOBB, point: TPoint): boolean {
    if (obb.angle === 0) {
      return BoxOps.containsPoint(OBBOps.toBox(obb), point)
    }
    const cos = Math.cos(-obb.angle)
    const sin = Math.sin(-obb.angle)
    const dx = point.x - obb.center.x
    const dy = point.y - obb.center.y
    const lx = cos * dx - sin * dy
    const ly = sin * dx + cos * dy
    return Math.abs(lx) <= obb.width / 2 && Math.abs(ly) <= obb.height / 2
  },

  overlaps(a: TOBB, b: TOBB): boolean {
    if (a.angle === 0 && b.angle === 0) {
      return BoxOps.overlaps(OBBOps.toBox(a), OBBOps.toBox(b))
    }
    const cornersA = OBBOps.getCorners(a)
    const cornersB = OBBOps.getCorners(b)
    // SAT: test 4 axes (2 per OBB)
    const axes: [number, number][] = [
      [Math.cos(a.angle), Math.sin(a.angle)],
      [-Math.sin(a.angle), Math.cos(a.angle)],
      [Math.cos(b.angle), Math.sin(b.angle)],
      [-Math.sin(b.angle), Math.cos(b.angle)],
    ]
    for (const [ax, ay] of axes) {
      const [minA, maxA] = projectOntoAxis(cornersA, ax, ay)
      const [minB, maxB] = projectOntoAxis(cornersB, ax, ay)
      if (maxA < minB || maxB < minA) {
        return false
      }
    }
    return true
  },

  overlapsBox(obb: TOBB, box: TBox): boolean {
    return OBBOps.overlaps(obb, OBBOps.fromBox(box))
  },

  isContained(obb: TOBB, box: TBox): boolean {
    if (obb.angle === 0) {
      return BoxOps.isContained(OBBOps.toBox(obb), box)
    }
    return OBBOps.getCorners(obb).every((p) => BoxOps.containsPoint(box, p))
  },

  /**
   * Whether a polygon-like symbol (its `bounds` OBB and own `edges`) overlaps `box` — contained
   * OBB is an early-out, otherwise any edge crossing any side of `box` counts as an overlap.
   */
  polygonOverlapsBox(bounds: TOBB, edges: TSegment[], box: TBox): boolean {
    return (
      OBBOps.isContained(bounds, box) ||
      edges.some((e1) => BoxOps.getSides(box).some((e2) => !!findIntersectionBetween2Segment(e1, e2)))
    )
  },

  /**
   * Whether a polygon-like symbol (its own `vertices` and `edges`) overlaps `query`, an arbitrary
   * convex quadrilateral given as its four corners in order.
   *
   * Generalizes {@link polygonOverlapsBox} to a query a `TBox` cannot express: the image of an
   * axis-aligned box under the inverse of a rotated (and possibly also sheared) matrix is a rotated
   * rectangle or a genuine parallelogram, neither of which fits a `TBox`, and the latter does not fit
   * a `TOBB` either (which assumes right angles).
   *
   * The containment early-out tests the symbol's own `vertices`, not an axis-aligned `bounds` box —
   * `bounds` is the *raw* frame's AABB, which for anything but a plain rectangle reaches further out
   * on the diagonal than the shape itself (a circle of radius r has corners at r·√2). Once `query` is
   * rotated relative to that raw frame, a `query` that fully encloses the true shape can still miss
   * those corners, which is a real regression this fixes rather than a hypothetical: a query built
   * from `bounds` reported a rotated circle or a rotated diagonal line as unselected while a selection
   * box plainly surrounded it. `vertices` is what every geometry already tessellates a curve
   * into (or, for a straight-edged type, already is the exact boundary) — a polygon is contained in a
   * convex region iff all its vertices are, whether or not the polygon itself is convex.
   *
   * Same as `polygonOverlapsBox` otherwise: any of the symbol's own edges crossing a side of `query`
   * counts as an overlap. Neither branch catches `query` sitting entirely inside the shape without
   * crossing its boundary — `polygonOverlapsBox` has never caught that case either; it is a
   * pre-existing gap, not one this generalization introduces.
   */
  polygonOverlapsQuad(vertices: TPoint[], edges: TSegment[], query: TPoint[]): boolean {
    if (vertices.length > 0 && vertices.every((p) => pointInConvexPolygon(query, p))) {
      return true
    }
    const querySides: TSegment[] = query.map((p, i) => ({ p1: p, p2: query[(i + 1) % query.length] }))
    return edges.some((e1) => querySides.some((e2) => !!findIntersectionBetween2Segment(e1, e2)))
  },

  /**
   * Whether `point` lies inside (or on the boundary of) the convex quadrilateral `query` describes
   * by its four corners in order — the same test {@link polygonOverlapsQuad} uses for its own
   * vertices, exposed here for a type whose true overlap test is itself point-based (a stroke: "is
   * any raw pointer inside the query") rather than a bounds/edges polygon test. Using the generic
   * edges-crossing test for such a type would over-approximate: a query side can cross the segment
   * *between* two consecutive pointers without any pointer itself being inside the query, which is a
   * true overlap for a polygon but not for a stroke, whose own definition of "overlaps" was never
   * "the drawn line crosses the box" to begin with.
   */
  quadContainsPoint(query: TPoint[], point: TPoint): boolean {
    return pointInConvexPolygon(query, point)
  },

  contains(a: TOBB, b: TOBB): boolean {
    return OBBOps.getCorners(b).every((p) => OBBOps.containsPoint(a, p))
  },
}
