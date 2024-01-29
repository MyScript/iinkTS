import { LoggerClass, SELECTION_MARGIN } from "../Constants"
import { LoggerManager } from "../logger"
import { computeDistance, createUUID } from "../utils"
import { TPoint, TPointer } from "./Point"
import { Box, TBoundingBox } from "./Box"
import { SymbolType } from "./Symbol"

import { TOISymbol } from "./OISymbol"
import { TStyle } from "../style"

/**
 * @group Primitive
 */
export class OIEraser implements TOISymbol
{
  #logger = LoggerManager.getLogger(LoggerClass.STROKE)
  readonly type = SymbolType.Eraser
  id: string
  creationTime: number
  modificationDate: number
  pointers: TPointer[]
  selected = false
  toDelete = false

  constructor()
  {
    this.#logger.info("constructor")
    this.id = `${ this.type }-${ createUUID() }`
    this.creationTime = Date.now()
    this.modificationDate = this.creationTime
    this.pointers = []
  }

  get vertices(): TPoint[]
  {
    return this.pointers
  }
  get boundingBox(): Box {
    return Box.createFromPoints(this.vertices)
  }
  get snapPoints(): TPoint[] {
    return []
  }
  get style(): TStyle
  {
    return { }
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

  clone(): OIEraser
  {
    const clone = new OIEraser()
    clone.id = this.id
    clone.pointers = structuredClone(this.pointers)
    return clone
  }

}
