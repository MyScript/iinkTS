import { TStyle } from "../style"
import { TMatrixTransform } from "../transform"
import { TBoundingBox } from "./Box"
import { TPoint } from "./Point"

/**
 * @group Primitive
 */
export enum SymbolType
{
  Stroke = "stroke",
  Shape = "shape",
  Decorator = "decorator",
  Edge = "edge",
  Text = "text"
}

/**
 * @group Primitive
 */
export interface TSymbol {
  id: string
  creationTime: number
  modificationDate: number
  type: SymbolType | string
  style: TStyle
}

/**
 * @group Primitive
 */
export interface TOISymbol extends TSymbol
{
  selected: boolean
  type: SymbolType
  get boundingBox(): TBoundingBox
  get vertices(): TPoint[]
  transform: TMatrixTransform
  isOverlapping(box: TBoundingBox): boolean
  isCloseToPoint(point: TPoint): boolean
  getClone(): TOISymbol
}
