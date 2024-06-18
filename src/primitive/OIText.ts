import { LoggerClass, SELECTION_MARGIN } from "../Constants"
import { LoggerManager } from "../logger"
import { DefaultStyle, TStyle } from "../style"
import { PartialDeep, computeDistanceBetweenPointAndSegment, converDegreeToRadian, createUUID, findIntersectionBetween2Segment, isPointInsidePolygon, computeRotatedPoint } from "../utils"
import { TPoint, TSegment, isValidPoint } from "./Point"
import { SymbolType } from "./Symbol"
import { Box, TBoundingBox } from "./Box"
import { OIDecorator } from "./OIDecorator"
import { TOISymbol } from "./OISymbol"

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
export class OIText implements TOISymbol
{
  #logger = LoggerManager.getLogger(LoggerClass.TEXT)
  readonly type = SymbolType.Text
  id: string
  creationTime: number
  modificationDate: number
  selected: boolean
  deleting: boolean
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
    this.deleting = false
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
          return computeRotatedPoint(p, center, rad)
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
    const offsetY = this.boundingBox.yMax - this.point.y
    const points = [
      { x: this.boundingBox.x, y: this.boundingBox.yMin + offsetY },
      { x: this.boundingBox.xMax, y: this.boundingBox.yMin + offsetY },
      { x: this.boundingBox.xMax, y: this.boundingBox.yMax - offsetY },
      { x: this.boundingBox.x, y: this.boundingBox.yMax - offsetY },
    ]
    if (this.rotation) {
      const center = this.rotation.center
      const rad = converDegreeToRadian(-this.rotation.degree)
      return points
        .map(p =>
        {
          return computeRotatedPoint(p, center, rad)
        })
    }
    return points
  }

  isCloseToPoint(point: TPoint): boolean
  {
    return this.edges.some(seg =>
    {
      return computeDistanceBetweenPointAndSegment(point, seg) < SELECTION_MARGIN
    })
  }

  protected getCharCorners(char: TOISymbolChar): TPoint[]
  {
    const boxBox = new Box(char.boundingBox)
    if (this.rotation) {
      const center = this.rotation.center
      const rad = converDegreeToRadian(-this.rotation.degree)
      return boxBox.corners
        .map(p =>
        {
          return computeRotatedPoint(p, center, rad)
        })
    }
    return boxBox.corners
  }

  getCharsOverlaps(points: TPoint[]): TOISymbolChar[]
  {
    return this.chars.filter(c =>
    {
      const charCorners = this.getCharCorners(c)
      return points.some(p => isPointInsidePolygon(p, charCorners))
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
    clone.deleting = this.deleting
    clone.creationTime = this.creationTime
    clone.modificationDate = this.modificationDate
    clone.decorators = this.decorators.map(d => d.clone())
    clone.rotation = this.rotation ? structuredClone(this.rotation) : undefined
    return clone
  }

  toJSON(): PartialDeep<OIText>
  {
    return {
      id: this.id,
      type: this.type,
      point: this.point,
      chars: this.chars,
      style: this.style,
      rotation: this.rotation,
      decorators: this.decorators.length ? this.decorators : undefined
    }
  }

  static create(partial: PartialDeep<OIText>): OIText
  {
    if (!isValidPoint(partial?.point)) throw new Error(`Unable to create a OIText, point are invalid`)
    if (!partial.chars?.length) throw new Error(`Unable to create a OIText, no chars`)
    return new OIText(partial.style || DefaultStyle, partial.chars as TOISymbolChar[], partial.point as TPoint, partial.boundingBox as TBoundingBox)
  }
}
