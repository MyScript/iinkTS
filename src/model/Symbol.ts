import { TStyle } from "../style"
import { createUUID } from "../utils"

export const enum SymbolType
{
  Stroke = "stroke",
  Shape = "shape",
  Text = "text"
}

/**
 * @group Model
 */
export type TSymbol = {
  id: string
  creationTime: number
  modificationDate: number
  type: SymbolType | string
  style: TStyle
}

export abstract class AbstractSymbol
{
  id: string
  creationTime: number
  modificationDate: number
  type: SymbolType
  style: TStyle

  constructor(type: SymbolType, style: TStyle)
  {
    this.creationTime = Date.now()
    this.id = `${type}-${createUUID()}`
    this.modificationDate = this.creationTime
    this.type = type
    this.style = style
  }

  abstract getClone(): AbstractSymbol
}
