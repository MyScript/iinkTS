import { SELECTION_MARGIN } from "../Constants"
import { TStyle } from "../style"
import { computeDistanceBetweenPointAndSegment, createUUID, findIntersectionBetween2Segment } from "../utils"
import { Box, TBoundingBox } from "./Box"
import { OISymbol, TOISymbol } from "./OISymbol"
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
export type TOIEdge = TOISymbol & {
  type: SymbolType
  kind: EdgeKind
  startDecoration?: EdgeDecoration
  endDecoration?: EdgeDecoration
}

/**
 * @group Primitive
 */
export abstract class OIEdge extends OISymbol implements TOIEdge
{
  readonly kind: EdgeKind
  startDecoration?: EdgeDecoration
  endDecoration?: EdgeDecoration

  constructor(kind: EdgeKind, style: TStyle, startDecoration?: EdgeDecoration, endDecoration?: EdgeDecoration)
  {
    super(SymbolType.Edge, style)
    this.id = `${ this.type }-${ kind }-${ createUUID() }`
    this.kind = kind

    this.startDecoration = startDecoration
    this.endDecoration = endDecoration
  }

  abstract get vertices(): TPoint[]

  override get boundingBox(): Box
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
    return this.boundingBox.isContained(box) ||
      this.edges.some(e1 => Box.getSides(box).some(e2 => !!findIntersectionBetween2Segment(e1, e2)))
  }

  abstract clone(): OIEdge
}
