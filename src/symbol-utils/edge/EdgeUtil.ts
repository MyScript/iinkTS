import { HIT_TOLERANCE } from "@/constants"
import type { TPartialDeep, TPoint } from "@/core"
import {
  computeDistance,
  computeEllipseRadiusAverage,
  computePointOnEllipse,
  computeTessellationCount,
  createUUID,
  type Geometry2d,
  isValidNumber,
  isValidPoint,
  MatrixTransform,
  mergeSymbolTransform,
  Polyline2d,
  TESSELLATION_SEGMENT_LENGTH,
} from "@/core"
import { DefaultStyle, mergeSymbolStyle, type TStyle } from "@/style"
import type { TEdge } from "@/symbol"
import {
  EdgeDecoration,
  EdgeKind,
  SymbolType,
  type TBaseSymbol,
  type TEdgeArc,
  type TEdgeLine,
  type TEdgePolyLine,
  type TResizePoint,
} from "@/symbol"

import { defineKind, resolveKind, type TKindDefinition } from "../KindDefinition"
import { PathSymbolUtil } from "../PathSymbolUtil"
import { arrowHeadEndMarkerId, arrowHeadStartMarkerId } from "./EdgeRenderOptions"

/**
 * The edge kinds this util can build, and how. Same contract as the shape table — adding a kind is
 * adding an entry, and no method can be left behind.
 */
/**
 * How far beyond its own path an edge asks to be found.
 *
 * {@link HIT_TOLERANCE} on each side, because a hairline drawn exactly is a target nobody can
 * hit — and more again when the edge carries an arrow head, which is drawn outside the path it
 * belongs to and would otherwise sit outside the shape's own bounds. Both figures are the ones
 * `computeEdgeBounds` applied before the geometry owned this.
 */
function edgePadding(edge: TEdge): number {
  const decorated = edge.startDecoration || edge.endDecoration
  return HIT_TOLERANCE + (decorated ? (edge.style.width || 1) * 2.5 : 0)
}

const EDGE_KINDS: Partial<Record<EdgeKind, TKindDefinition<TEdge>>> = {
  [EdgeKind.Arc]: defineKind<TEdge, TEdgeArc>({
    create: (partial) => EdgeUtil.createArcFromPartial(partial),
    // Sampled, not described: an arc is a piece of a curve, and the exact `Ellipse2d` cannot stand
    // in for it — that one is closed, so it would carry a chord across the gap and be caught there.
    getGeometry: (edge) => new Polyline2d(EdgeUtil.getArcVertices(edge), edgePadding(edge)),
    getSnapPoints: (edge) => EdgeUtil.getArcSnapPoints(EdgeUtil.getArcVertices(edge)),
    getSVGPath: (edge) => EdgeUtil.getArcPath(edge),
    getResizePoints: (edge) => EdgeUtil.getArcResizePoints(edge),
  }),
  [EdgeKind.Line]: defineKind<TEdge, TEdgeLine>({
    create: (partial) => EdgeUtil.createLineFromPartial(partial),
    getGeometry: (edge) => new Polyline2d(EdgeUtil.getLineVertices(edge), edgePadding(edge)),
    // A line snaps on its own ends, which is what a connector wants to reach for.
    getSnapPoints: (edge) => EdgeUtil.getLineVertices(edge),
    getSVGPath: (edge) => EdgeUtil.getLinePath(edge),
    getResizePoints: (edge) => EdgeUtil.getLineResizePoints(edge),
  }),
  [EdgeKind.PolyEdge]: defineKind<TEdge, TEdgePolyLine>({
    create: (partial) => EdgeUtil.createPolyLineFromPartial(partial),
    getGeometry: (edge) => new Polyline2d(edge.points, edgePadding(edge)),
    getSnapPoints: (edge) => edge.points,
    getSVGPath: (edge) => EdgeUtil.getPolyLinePath(edge),
    getResizePoints: (edge) => EdgeUtil.getPolyLineResizePoints(edge),
  }),
}

/**
 * @group SymbolUtils
 */
export class EdgeUtil extends PathSymbolUtil<TEdge> {
  readonly type = SymbolType.Edge

  create(partial: TPartialDeep<TEdge>): TEdge {
    return resolveKind(EDGE_KINDS, partial.kind, "edge", "create").create(partial)
  }

  /**
   * An unregistered kind gets an empty path: no vertices, no edges, an empty box at the origin, and
   * so no overlap with anything — the same answer the record fallback gave.
   */
  getGeometry(edge: TEdge): Geometry2d {
    return EDGE_KINDS[edge.kind]?.getGeometry(edge) ?? new Polyline2d([])
  }

  /**
   * Kind by kind, then carried through the matrix — an edge snaps on its own vertices, not on the
   * corners of a box it never drew.
   */
  getSnapPoints(edge: TEdge): TPoint[] {
    return this.mapPointsForward(edge, EDGE_KINDS[edge.kind]?.getSnapPoints?.(edge) ?? [])
  }

  /**
   * Computed raw, from the table, same as always — then carried through the matrix like any other
   * point a util hands back. A resize handle drawn straight from these has to land where the edge is
   * actually drawn, not where it was before its last translate/rotate/resize.
   */
  getResizePoints(edge: TEdge): TResizePoint[] {
    const raw = EDGE_KINDS[edge.kind]?.getResizePoints?.(edge) ?? []
    const points = this.mapPointsForward(
      edge,
      raw.map(({ point }) => point)
    )
    return raw.map(({ vertexIndex }, i) => ({ point: points[i], vertexIndex }))
  }

  static getSVGPath(edge: TEdge): string {
    return resolveKind(EDGE_KINDS, edge.kind, "edge", "getSVGPath for").getSVGPath(edge)
  }

  /** Which of the three kinds it is, on top of what every symbol's group carries. */
  protected override getGroupAttributes(edge: TEdge): Record<string, string> {
    return { ...super.getGroupAttributes(edge), kind: edge.kind }
  }

  protected getPathData(edge: TEdge): string {
    return resolveKind(EDGE_KINDS, edge.kind, "edge", "getSVGElement for").getSVGPath(edge)
  }

  /** Stroked on no fill — a line encloses nothing — plus whichever arrow heads it carries. */
  protected getPathAttributes(edge: TEdge): Record<string, string> {
    const definition = resolveKind(EDGE_KINDS, edge.kind, "edge", "getSVGElement for")
    const attributes: Record<string, string> = {
      fill: "transparent",
      stroke: edge.style.color || DefaultStyle.color!,
      "stroke-width": (edge.style.width || DefaultStyle.width).toString(),
      ...definition.extraPathAttributes?.(edge),
    }
    if (edge.style.opacity) {
      attributes.opacity = edge.style.opacity.toString()
    }
    // Decorations are not kind dispatch — every kind of edge can carry an arrow head — so they stay
    // here rather than moving into the table.
    if (edge.startDecoration === EdgeDecoration.Arrow) {
      attributes["marker-start"] = `url(#${arrowHeadStartMarkerId})`
    }
    if (edge.endDecoration === EdgeDecoration.Arrow) {
      attributes["marker-end"] = `url(#${arrowHeadEndMarkerId})`
    }
    return attributes
  }

  static createLine(
    start: TPoint,
    end: TPoint,
    startDecoration?: EdgeDecoration,
    endDecoration?: EdgeDecoration,
    style?: TPartialDeep<TStyle>
  ): TEdgeLine {
    const mergedStyle = mergeSymbolStyle(style)
    const now = Date.now()
    const line: TEdgeLine = {
      type: SymbolType.Edge,
      kind: EdgeKind.Line,
      id: `${SymbolType.Edge}-${createUUID()}`,
      style: mergedStyle,
      creationTime: now,
      modificationDate: now,
      startDecoration,
      endDecoration,
      start,
      end,
      transform: MatrixTransform.identity(),
    }
    return line
  }

  static createLineFromPartial(partial: TPartialDeep<TEdgeLine>): TEdgeLine {
    if (!isValidPoint(partial?.start)) {
      throw new Error(`Unable to create a line, start point is invalid`)
    }
    if (!isValidPoint(partial?.end)) {
      throw new Error(`Unable to create a line, end point is invalid`)
    }
    const line = EdgeUtil.createLine(
      partial.start as TPoint,
      partial.end as TPoint,
      partial.startDecoration,
      partial.endDecoration,
      partial.style
    )
    if (partial.id) {
      line.id = partial.id
    }
    line.transform = mergeSymbolTransform(partial.transform)
    return line
  }

  static getLineVertices(line: TEdgeLine): TPoint[] {
    return [line.start, line.end]
  }

  static getLineResizePoints(line: TEdgeLine): TResizePoint[] {
    return EdgeUtil.getLineVertices(line).map((point, vertexIndex) => ({
      point,
      vertexIndex,
    }))
  }

  /**
   * Moves the vertex a resize handle owns, by writing into the geometry the line actually stores.
   *
   * A line's vertices are its `start` and `end`, and `computeVertices` returns those very objects —
   * so the drag handler used to mutate `line.vertices[i]` and reach them by aliasing. That worked
   * only as long as the array was stored and shared; a computed one would take the write and throw
   * it away, silently. This says which field a handle owns instead of relying on that.
   */
  static moveLineVertex(line: TEdgeLine, vertexIndex: number, point: TPoint): void {
    const target = vertexIndex === 0 ? line.start : line.end
    target.x = point.x
    target.y = point.y
  }

  static getLinePath(line: TEdgeLine): string {
    const start = line.startAnchor?.entryPoint ?? line.start
    const end = line.endAnchor?.entryPoint ?? line.end
    return `M ${start.x} ${start.y} L ${end.x} ${end.y}`
  }

  static createArc(
    center: TPoint,
    startAngle: number,
    sweepAngle: number,
    radiusX: number,
    radiusY: number,
    phi: number,
    startDecoration?: EdgeDecoration,
    endDecoration?: EdgeDecoration,
    style?: TPartialDeep<TStyle>
  ): TEdgeArc {
    const mergedStyle = mergeSymbolStyle(style)
    const now = Date.now()
    const arc: TEdgeArc = {
      type: SymbolType.Edge,
      kind: EdgeKind.Arc,
      id: `${SymbolType.Edge}-${createUUID()}`,
      style: mergedStyle,
      creationTime: now,
      modificationDate: now,
      center,
      startAngle,
      sweepAngle,
      radiusX,
      radiusY,
      phi,
      startDecoration,
      endDecoration,
      transform: MatrixTransform.identity(),
    }
    return arc
  }

  static createArcFromPartial(partial: TPartialDeep<TEdgeArc>): TEdgeArc {
    if (!isValidPoint(partial?.center)) {
      throw new Error(`Unable to create a arc, center point is invalid`)
    }
    if (!isValidNumber(partial?.startAngle)) {
      throw new Error(`Unable to create a arc, startAngle is invalid`)
    }
    if (!isValidNumber(partial?.sweepAngle)) {
      throw new Error(`Unable to create a arc, sweepAngle is invalid`)
    }
    if (!isValidNumber(partial?.radiusX)) {
      throw new Error(`Unable to create a arc, radiusX is invalid`)
    }
    if (!isValidNumber(partial?.radiusY)) {
      throw new Error(`Unable to create a arc, radiusY is invalid`)
    }
    const arc = EdgeUtil.createArc(
      partial.center as TPoint,
      partial.startAngle!,
      partial.sweepAngle!,
      partial.radiusX!,
      partial.radiusY!,
      partial.phi || 0,
      partial.startDecoration,
      partial.endDecoration,
      partial.style
    )
    if (partial.id) {
      arc.id = partial.id
    }
    arc.transform = mergeSymbolTransform(partial.transform)
    return arc
  }

  static getArcVertices(arc: TEdgeArc): TPoint[] {
    const length = Math.abs(arc.sweepAngle) * computeEllipseRadiusAverage(arc.radiusX, arc.radiusY)
    const nbVertices = computeTessellationCount(length, TESSELLATION_SEGMENT_LENGTH)
    const angleStep = arc.sweepAngle / nbVertices
    const v: TPoint[] = []
    const endAngle = arc.startAngle + arc.sweepAngle
    if (arc.sweepAngle > 0) {
      for (let angle = arc.startAngle; angle < endAngle; angle += angleStep) {
        v.push(computePointOnEllipse(arc.center, arc.radiusX, arc.radiusY, arc.phi, angle))
      }
    } else {
      for (let angle = arc.startAngle; angle > endAngle; angle += angleStep) {
        v.push(computePointOnEllipse(arc.center, arc.radiusX, arc.radiusY, arc.phi, angle))
      }
    }
    v.push(computePointOnEllipse(arc.center, arc.radiusX, arc.radiusY, arc.phi, endAngle))
    return v
  }

  static getArcSnapPoints(vertices: TPoint[]): TPoint[] {
    return [vertices[0], vertices.at(-1)!]
  }

  static getArcResizePoints(arc: TEdgeArc): TResizePoint[] {
    const v = EdgeUtil.getArcVertices(arc)
    const mid = Math.floor(v.length / 2)
    return [
      { point: v[0], vertexIndex: 0 },
      { point: v[mid], vertexIndex: mid },
      {
        point: v[v.length - 1],
        vertexIndex: v.length - 1,
      },
    ]
  }

  static getArcPath(arc: TEdgeArc): string {
    // When anchored to a shape, the arc's real geometric endpoint sits at the shape's center
    // (inside it), and the tessellation is dense — several vertices right after the true start
    // are STILL near the center, not just the first one. Swapping only vertices[0] for
    // entryPoint (where the arc crosses the shape's border) would draw a spike from the border
    // back to those near-center vertices before the visible curve even begins. Instead, drop
    // every vertex that's closer to the true endpoint than entryPoint is (i.e. still "inside"
    // the shape along the curve) and start/end the path at entryPoint itself.
    const original = EdgeUtil.getArcVertices(arc)
    const trueStart = original[0]
    const trueEnd = original[original.length - 1]

    let kept = original
    if (arc.startAnchor?.entryPoint) {
      const cutDistance = computeDistance(trueStart, arc.startAnchor.entryPoint)
      kept = kept.filter((v) => computeDistance(v, trueStart) >= cutDistance)
    }
    if (arc.endAnchor?.entryPoint) {
      const cutDistance = computeDistance(trueEnd, arc.endAnchor.entryPoint)
      kept = kept.filter((v) => computeDistance(v, trueEnd) >= cutDistance)
    }

    const vertices = [
      ...(arc.startAnchor?.entryPoint ? [arc.startAnchor.entryPoint] : []),
      ...kept,
      ...(arc.endAnchor?.entryPoint ? [arc.endAnchor.entryPoint] : []),
    ]

    let path = `M ${vertices[0].x} ${vertices[0].y} Q`
    for (let i = 0; i < vertices.length; i++) {
      path += ` ${vertices[i].x} ${vertices[i].y}`
    }
    return path
  }

  static createPolyLine(
    points: TPoint[],
    startDecoration?: EdgeDecoration,
    endDecoration?: EdgeDecoration,
    style?: TPartialDeep<TStyle>
  ): TEdgePolyLine {
    const mergedStyle = mergeSymbolStyle(style)
    const now = Date.now()
    const polyline: TEdgePolyLine = {
      type: SymbolType.Edge,
      kind: EdgeKind.PolyEdge,
      id: `${SymbolType.Edge}-${createUUID()}`,
      style: mergedStyle,
      creationTime: now,
      modificationDate: now,
      startDecoration,
      endDecoration,
      points,
      transform: MatrixTransform.identity(),
    }
    return polyline
  }

  static createPolyLineFromPartial(partial: TPartialDeep<TEdgePolyLine>): TEdgePolyLine {
    if (partial?.points?.some((p) => !isValidPoint(p))) {
      throw new Error(`Unable to create a PolyLine, points are invalid`)
    }
    const polyline = EdgeUtil.createPolyLine(
      partial?.points as TPoint[],
      partial.startDecoration,
      partial.endDecoration,
      partial.style
    )
    if (partial.id) {
      polyline.id = partial.id
    }
    polyline.transform = mergeSymbolTransform(partial.transform)
    return polyline
  }

  /**
   * A polyline's vertices are the points it stores, returned as-is.
   *
   * Named rather than inlined so every caller goes through one place: `getGeometry`,
   * `getResizePoints` and the edge-kind table all used to reach for the stored `vertices` field.
   */
  static getPolyLineVertices(polyline: TEdgePolyLine): TPoint[] {
    return polyline.points
  }

  static getPolyLineResizePoints(polyline: TEdgePolyLine): TResizePoint[] {
    return EdgeUtil.getPolyLineVertices(polyline).map((point, vertexIndex) => ({
      point,
      vertexIndex,
    }))
  }

  /**
   * Moves the vertex a resize handle owns, by writing into the geometry the polyline stores.
   *
   * A polyline's vertices *are* its `points`, so the drag handler used to reach them by aliasing
   * through the stored array. See `EdgeUtil.moveLineVertex` for why that is no longer relied on.
   */
  static movePolyLineVertex(polyline: TEdgePolyLine, vertexIndex: number, point: TPoint): void {
    const target = polyline.points[vertexIndex]
    if (!target) {
      return
    }
    target.x = point.x
    target.y = point.y
  }

  static getPolyLinePath(polyline: TEdgePolyLine): string {
    const entry1 = polyline.startAnchor?.entryPoint
    const entry2 = polyline.endAnchor?.entryPoint
    const stored = EdgeUtil.getPolyLineVertices(polyline)
    const lastIdx = stored.length - 1
    const firstPt = entry1 ?? stored[0]
    let path = `M ${firstPt.x} ${firstPt.y}`
    for (let i = entry1 ? 1 : 0; i <= lastIdx; i++) {
      const pt = entry2 && i === lastIdx ? entry2 : stored[i]
      path += ` L ${pt.x} ${pt.y}`
    }
    return path
  }

  /**
   * @group Symbol
   * @summary Check if symbol is an edge (line, arc, polyline)
   * @param symbol - Symbol to check
   * @returns True if symbol is an edge
   */
  static isEdge(symbol: TBaseSymbol): symbol is TEdge {
    return symbol.type === SymbolType.Edge
  }

  /**
   * @group Symbol
   * @summary Type guard to check if an edge is a line
   * @param edge - The edge to check
   * @returns True if the edge is a line
   */
  static isLineEdge(edge: TBaseSymbol): edge is TEdgeLine {
    return EdgeUtil.isEdge(edge) && edge.kind === EdgeKind.Line
  }

  /**
   * @group Symbol
   * @summary Type guard to check if an edge is an arc
   * @param edge - The edge to check
   * @returns True if the edge is an arc
   */
  static isArcEdge(edge: TBaseSymbol): edge is TEdgeArc {
    return EdgeUtil.isEdge(edge) && edge.kind === EdgeKind.Arc
  }

  /**
   * @group Symbol
   * @summary Type guard to check if an edge is a polyline
   * @param edge - The edge to check
   * @returns True if the edge is a polyline
   */
  static isPolyEdge(edge: TBaseSymbol): edge is TEdgePolyLine {
    return EdgeUtil.isEdge(edge) && edge.kind === EdgeKind.PolyEdge
  }
}
