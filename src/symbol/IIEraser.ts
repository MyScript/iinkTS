import { createUUID, PartialDeep } from "../utils"
import { TPoint, TPointer } from "./Point"
import { Box, TBox } from "./Box"
import { SymbolType } from "./Symbol"
import { IISymbolBase } from "./IISymbolBase"
import { TStyle } from "../style"

const style: TStyle = {
  color: "grey",
  fill: "none",
  width: 12,
  opacity: 0.2
}

/**
 * @group Symbol
 */
export class IIEraser extends IISymbolBase<SymbolType.Eraser>
{
  readonly isClosed = false
  pointers: TPointer[]

  constructor()
  {
    super(SymbolType.Eraser, style)
    this.id = `${ this.type }-${ createUUID() }`
    this.creationTime = Date.now()
    this.modificationDate = this.creationTime
    this.pointers = []
  }

  get bounds(): Box
  {
    return Box.createFromPoints(this.vertices)
  }

  get vertices(): TPoint[]
  {
    return this.pointers
  }

  get snapPoints(): TPoint[]
  {
    return []
  }

  clone(): IISymbolBase
  {
    const clone = new IIEraser()
    clone.id = this.id
    clone.creationTime = this.creationTime
    clone.modificationDate = this.modificationDate
    clone.pointers = structuredClone(this.pointers)
    return clone
  }

  overlaps(box: TBox): boolean
  {
    return this.pointers.some(p =>
    {
      return p.x >= box.x && p.x <= box.x + box.width
        && p.y >= box.y && p.y <= box.y + box.height
    })
  }

  toJSON(): PartialDeep<IIEraser>
  {
    return {
      id: this.id,
      pointers: this.pointers,
      style: this.style
    }
  }
}
