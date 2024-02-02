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
export enum ShapeKind
{
  Circle = "circle",
  Ellipse = "ellipse",
  Rectangle = "rectangle",
  Triangle = "triangle",
  Parallelogram = "parallelogram",
  Polygon = "polygon",
  Rhombus = "rhombus",
  Table = "table"
}

/**
 * @group Primitive
 */
export type TOIShape = TOISymbol & {
  kind: ShapeKind
}

/**
 * @group Primitive
 */
export abstract class OIShape extends OISymbol implements TOIShape
{
  readonly kind: ShapeKind
  constructor(kind: ShapeKind, style: TStyle)
  {
    super(SymbolType.Shape, style)
    this.id = `${ this.type }-${ kind }-${ createUUID() }`
    this.kind = kind
  }

  abstract get vertices(): TPoint[]

  get snapPoints(): TPoint[]
  {
    return this.boundingBox.snapPoints
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

  overlaps(box: TBoundingBox): boolean
  {
    return this.boundingBox.isContained(box) ||
      this.edges.some(e1 => Box.getSides(box).some(e2 => !!findIntersectionBetween2Segment(e1, e2)))
  }

  isCloseToPoint(point: TPoint): boolean
  {
    return this.edges.some(seg =>
    {
      return computeDistanceBetweenPointAndSegment(point, seg) < SELECTION_MARGIN
    })
  }

  abstract clone(): OIShape
}
