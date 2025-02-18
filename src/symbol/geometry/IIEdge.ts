import { SELECTION_MARGIN } from "../../Constants"
import { TStyle } from "../../style"
import { findIntersectionBetween2Segment, PartialDeep } from "../../utils"
import { Box, TBox } from "../Box"
import { IISymbolBase } from "../IISymbolBase"
import { TPoint } from "../Point"
import { SymbolType } from "../Symbol"

/**
 * @group Symbol
 */
export enum EdgeKind
{
  Line = "line",
  PolyEdge = "polyedge",
  Arc = "arc",
}

/**
 * @group Symbol
 */
export enum EdgeDecoration
{
  Arrow = "arrow-head"
}

/**
 * @group Symbol
 */
export abstract class OIEdgeBase<K = EdgeKind> extends IISymbolBase<SymbolType.Edge>
{
  readonly kind: K
  readonly isClosed = false

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

  overlaps(box: TBox): boolean
  {
    return this.bounds.isContained(box) ||
      this.edges.some(e1 => Box.getSides(box).some(e2 => !!findIntersectionBetween2Segment(e1, e2)))
  }

  abstract clone(): OIEdgeBase
}
