import { DefaultStyle, TStyle } from "../style"
import { MatrixTransform } from "../transform"
import { createUUID } from "../utils"
import { Box, TBoundingBox } from "./Box"
import { TPoint } from "./Point"
import { SymbolType, TOISymbol } from "./Symbol"

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
  type: SymbolType
  kind: ShapeKind
  vertices: TPoint[]
  boundingBox: Box
}

/**
 * @group Primitive
 */
export abstract class AbstracOIShape implements TOIShape
{
  readonly type = SymbolType.Shape
  readonly kind: ShapeKind

  id: string
  creationTime: number
  modificationDate: number
  transform: MatrixTransform
  selected: boolean
  style: TStyle

  constructor(kind: ShapeKind, style: TStyle)
  {
    this.id = `${ this.type }-${ kind }-${ createUUID() }`
    this.creationTime = Date.now()
    this.modificationDate = this.creationTime
    this.kind = kind
    this.style = Object.assign({}, DefaultStyle, style)
    this.selected = false
    this.transform = new MatrixTransform(1, 0, 0, 1, 0, 0)
  }

  abstract get vertices(): TPoint[]
  abstract get boundingBox(): Box

  abstract isPartiallyOrTotallyWrapped(box: TBoundingBox): boolean
  abstract isCloseToPoint(point: TPoint): boolean
  abstract getClone(): TOISymbol
}
