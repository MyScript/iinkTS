import { LoggerClass, SELECTION_MARGIN } from "../Constants"
import { LoggerManager } from "../logger"
import { DefaultStyle, TStyle } from "../style"
import { computeDistanceBetweenPointAndSegment, converDegreeToRadian, createUUID, findIntersectionBetween2Segment, rotatePoint } from "../utils"
import { TPoint, TSegment } from "./Point"
import { SymbolType } from "./Symbol"
import { Box, TBoundingBox } from "./Box"
import { OIDecorator } from "./OIDecorator"
import { TOISymbolDecorable } from "./OISymbol"

/**
 * @group Primitive
 */
export type TOISymbolChar = {
  id: string
  label: string
  fontSize: number
  fontWeight: number
  color: string
  boundingBox: TBoundingBox
}

/**
 * @group Primitive
 */
export class OIText implements TOISymbolDecorable
{
  #logger = LoggerManager.getLogger(LoggerClass.TEXT)
  readonly type = SymbolType.Text
  id: string
  creationTime: number
  modificationDate: number
  selected: boolean
  toDelete: boolean
  style: TStyle
  point: TPoint
  boundingBox: Box
  chars: TOISymbolChar[]
  decorators: OIDecorator[]
  rotation?: {
    degree: number,
    center: TPoint
  }

  constructor(style: TStyle, chars: TOISymbolChar[], point: TPoint, boundingBox: TBoundingBox)
  {
    this.#logger.debug("constructor", { style, chars, point })
    this.id = `${ this.type }-${ createUUID() }`
    this.creationTime = Date.now()
    this.modificationDate = this.creationTime
    this.style = Object.assign({}, DefaultStyle, style)
    this.selected = false
    this.toDelete = false
    this.point = point
    this.boundingBox = new Box(boundingBox)
    this.chars = chars
    this.decorators = []
  }

  get label(): string
  {
    return this.chars.map(c => c.label).join("")
  }

  get vertices(): TPoint[]
  {
    if (this.rotation) {
      const center = this.rotation.center
      const rad = converDegreeToRadian(-this.rotation.degree)
      return this.boundingBox.corners
        .map(p =>
        {
          return rotatePoint(p, center, rad)
        })
    }
    else {
      return this.boundingBox.corners
    }
  }

  get edges(): TSegment[]
  {
    return this.vertices.map((p, i) =>
    {
      if (i === this.vertices.length - 1) {
        return { p1: this.vertices[0], p2: p }
      }
      else {
        return { p1: p, p2: this.vertices[i + 1] }
      }
    })
  }

  get snapPoints(): TPoint[]
  {
    return this.vertices
  }

  isCloseToPoint(point: TPoint): boolean
  {
    return this.edges.some(seg =>
    {
      return computeDistanceBetweenPointAndSegment(point, seg) < SELECTION_MARGIN
    })
  }

  overlaps(box: TBoundingBox): boolean
  {
    return this.vertices.some(p => Box.containsPoint(box, p)) ||
      this.edges.some(e1 => Box.getSides(box).some(e2 => !!findIntersectionBetween2Segment(e1, e2)))
  }

  clone(): OIText
  {
    const clone = new OIText(structuredClone(this.style), structuredClone(this.chars), structuredClone(this.point), this.boundingBox)
    clone.id = this.id
    clone.selected = this.selected
    clone.toDelete = this.toDelete
    clone.creationTime = this.creationTime
    clone.modificationDate = this.modificationDate
    return clone
  }
}
