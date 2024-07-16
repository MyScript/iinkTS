import { SELECTION_MARGIN } from "../Constants"
import { TStyle } from "../style"
import { computeDistanceBetweenPointAndSegment, findIntersectionBetween2Segment, PartialDeep } from "../utils"
import { Box, TBoundingBox } from "./Box"
import { OISymbolBase } from "./OISymbolBase"
import { TPoint, TSegment } from "./Point"
import { SymbolType } from "./Symbol"

/**
 * @group Primitive
 */
export enum EdgeKind
{
  Line = "line",
  PolyEdge = "polyedge",
  Arc = "arc",
}

/**
 * @group Primitive
 */
export enum EdgeDecoration
{
  Arrow = "arrow-head"
}

/**
 * @group Primitive
 */
export abstract class OIEdgeBase<K = EdgeKind> extends OISymbolBase<SymbolType.Edge>
{
  readonly kind: K
  startDecoration?: EdgeDecoration
  endDecoration?: EdgeDecoration

  constructor(
    kind: K,
    startDecoration?: EdgeDecoration,
    endDecoration?: EdgeDecoration,
    style?: PartialDeep<TStyle>
  )
  {
    super(SymbolType.Edge, style)
    this.kind = kind

    this.startDecoration = startDecoration
    this.endDecoration = endDecoration
  }

  abstract get vertices(): TPoint[]

  get bounds(): Box
  {
    const bb = Box.createFromPoints(this.vertices)
    bb.x -= SELECTION_MARGIN / 2
    bb.y -= SELECTION_MARGIN / 2
    bb.height += SELECTION_MARGIN
    bb.width += SELECTION_MARGIN
    if (this.startDecoration || this.endDecoration) {
      bb.x -= ((this.style.width || 1) * 2.5)
      bb.y -= ((this.style.width || 1) * 2.5)
      bb.height += ((this.style.width || 1) * 5)
      bb.width += ((this.style.width || 1) * 5)
    }
    return bb
  }


  get snapPoints(): TPoint[]
  {
    return this.vertices
  }

  get edges(): TSegment[]
  {
    return this.vertices.slice(0, -1).map((p, i) =>
    {
      return { p1: p, p2: this.vertices[i + 1] }
    })
  }

  isCloseToPoint(point: TPoint): boolean
  {
    return this.edges.some(seg =>
    {
      return computeDistanceBetweenPointAndSegment(point, seg) < SELECTION_MARGIN
    })
  }

  overlaps(box: TBoundingBox): boolean
  {
    return this.bounds.isContained(box) ||
      this.edges.some(e1 => Box.getSides(box).some(e2 => !!findIntersectionBetween2Segment(e1, e2)))
  }

  abstract clone(): OIEdgeBase
}
