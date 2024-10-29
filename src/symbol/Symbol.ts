import { TStyle } from "../style"

/**
 * @group Symbol
 */
export enum SymbolType
{
  Stroke = "stroke",
  Group = "group",
  Shape = "shape",
  Edge = "edge",
  Text = "text",
  Eraser = "eraser",
  Recognized = "recognized"
}

/**
 * @group Symbol
 */
export interface TSymbol {
  id: string
  creationTime: number
  modificationDate: number
  type: string
  style: TStyle
}
