import { SELECTION_MARGIN } from "../Constants"
import { computeDistance, createUUID, PartialDeep } from "../utils"
import { TPoint, TPointer } from "./Point"
import { Box, TBoundingBox } from "./Box"
import { SymbolType } from "./Symbol"
import { OISymbolBase } from "./OISymbolBase"
import { TStyle } from "../style"

const style: TStyle = {
  color: "grey",
  fill: "none",
  width: 12,
  opacity: 0.2
}

/**
 * @group Primitive
 */
export class OIEraser extends OISymbolBase<SymbolType.Eraser>
{
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

  clone(): OISymbolBase
  {
    const clone = new OIEraser()
    clone.id = this.id
    clone.pointers = structuredClone(this.pointers)
    return clone
  }

  overlaps(box: TBoundingBox): boolean
  {
    return this.pointers.some(p =>
    {
      return p.x >= box.x && p.x <= box.x + box.width
        && p.y >= box.y && p.y <= box.y + box.height
    })
  }

  isCloseToPoint(point: TPoint): boolean
  {
    return this.pointers.some(pointer =>
    {
      return computeDistance(point, pointer) < SELECTION_MARGIN
    })
  }

  toJSON(): PartialDeep<OIEraser>
  {
    return {
      id: this.id,
      pointers: this.pointers,
      style: this.style
    }
  }
}
