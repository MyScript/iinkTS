import { DefaultStyle, TStyle } from "../style"
import { createUUID } from "../utils"
import { TBox, TBoundingBox, Box } from "./Box"
import { TOIDecorator } from "./OIDecorator"
import { TPoint } from "./Point"
import { SymbolType, TSymbol } from "./Symbol"

/**
 * @group Primitive
 */
export interface TOISymbol extends TSymbol
{
  selected: boolean
  toDelete: boolean
  get boundingBox(): TBox
  get vertices(): TPoint[]
  get snapPoints(): TPoint[]
  overlaps(box: TBoundingBox): boolean
  isCloseToPoint(point: TPoint): boolean
  clone(): TOISymbol
}

/**
 * @group Primitive
 */
export interface TOISymbolDecorable extends TOISymbol
{
  decorators: TOIDecorator[]
}

/**
 * @group Primitive
 */
export abstract class OISymbol implements TOISymbol
{
  readonly type: SymbolType

  id: string
  creationTime: number
  modificationDate: number
  selected: boolean
  toDelete: boolean
  style: TStyle

  constructor(type: SymbolType, style: TStyle)
  {
    this.type = type
    this.id = `${ this.type }-${ createUUID() }`

    this.creationTime = Date.now()
    this.modificationDate = this.creationTime
    this.selected = false
    this.toDelete = false

    this.style = Object.assign({}, DefaultStyle, style)
  }

  abstract get vertices(): TPoint[]

  get boundingBox(): Box
  {
    return Box.createFromPoints(this.vertices)
  }

  abstract get snapPoints(): TPoint[]

  abstract overlaps(box: TBoundingBox): boolean

  abstract isCloseToPoint(point: TPoint): boolean

  abstract clone(): OISymbol
}
