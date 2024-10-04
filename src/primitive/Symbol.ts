import { TStyle } from "../style"

/**
 * @group Primitive
 */
export enum SymbolType
{
  Stroke = "stroke",
  Group = "group",
  Shape = "shape",
  Edge = "edge",
  Text = "text",
  Eraser = "eraser",
  StrokeText = "stroke-text"
}

/**
 * @group Primitive
 */
export interface TSymbol {
  id: string
  creationTime: number
  modificationDate: number
  type: string
  style: TStyle
}
