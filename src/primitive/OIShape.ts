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
export enum ShapeKind
{
  Circle = "circle",
  Ellipse = "ellipse",
  Polygon = "polygon",
  Table = "table"
}

/**
 * @group Primitive
 */
export abstract class OIShapeBase<K = ShapeKind> extends OISymbolBase<SymbolType.Shape>
{
  readonly kind: K

  constructor(kind: K, style?: PartialDeep<TStyle>)
  {
    super(SymbolType.Shape, style)
    this.kind = kind
  }

  get edges(): TSegment[]
  {
    return this.vertices.map((p, i) =>
    {
      if (i === this.vertices.length - 1) {
        return { p1: p, p2: this.vertices[0] }
      }
      else {
        return { p1: p, p2: this.vertices[i + 1] }
      }
    })
  }

  get bounds(): Box
  {
    return Box.createFromPoints(this.vertices)
  }

  get snapPoints(): TPoint[]
  {
    return this.bounds.snapPoints
  }

  overlaps(box: TBoundingBox): boolean
  {
    return this.bounds.isContained(box) ||
      this.edges.some(e1 => Box.getSides(box).some(e2 => !!findIntersectionBetween2Segment(e1, e2)))
  }

  isCloseToPoint(point: TPoint): boolean
  {
    return this.edges.some(seg =>
    {
      return computeDistanceBetweenPointAndSegment(point, seg) < SELECTION_MARGIN
    })
  }

}
