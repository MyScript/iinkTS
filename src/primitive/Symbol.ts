import { TStyle } from "../style"
import { TBoundingBox } from "./Box"

export enum SymbolType
{
  Stroke = "stroke",
  Shape = "shape",
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


export interface TOISymbol extends TSymbol
{
  selected: boolean
  type: SymbolType
  get boundingBox(): TBoundingBox
  getClone(): TOISymbol
}
