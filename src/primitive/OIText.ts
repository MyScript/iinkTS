import { TStyle } from "../style"
import { PartialDeep, convertDegreeToRadian, findIntersectionBetween2Segment, isPointInsidePolygon, computeRotatedPoint } from "../utils"
import { TPoint, isValidPoint } from "./Point"
import { SymbolType } from "./Symbol"
import { Box, TBoundingBox } from "./Box"
import { OIDecorator } from "./OIDecorator"
import { OISymbolBase } from "./OISymbolBase"

/**
 * @group Primitive
 */
export type TOISymbolChar = {
  id: string
  label: string
  fontSize: number
  fontWeight: "normal" | "bold"
  color: string
  bounds: TBoundingBox
}

/**
 * @group Primitive
 */
export class OIText extends OISymbolBase<SymbolType.Text>
{
  readonly isClosed = true

  point: TPoint
  chars: TOISymbolChar[]
  decorators: OIDecorator[]
  bounds: Box
  rotation?: {
    degree: number,
    center: TPoint
  }

  constructor(
    chars: TOISymbolChar[],
    point: TPoint,
    bounds: TBoundingBox,
    style?: PartialDeep<TStyle>
  )
  {
    super(SymbolType.Text, style)
    this.point = point
    this.bounds = new Box(bounds)
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
      const rad = convertDegreeToRadian(-this.rotation.degree)
      return this.bounds.corners
        .map(p =>
        {
          return computeRotatedPoint(p, center, rad)
        })
    }
    else {
      return this.bounds.corners
    }
  }

  get snapPoints(): TPoint[]
  {
    const offsetY = this.bounds.yMax - this.point.y
    const points = [
      { x: this.bounds.x, y: this.bounds.yMin + offsetY },
      { x: this.bounds.xMax, y: this.bounds.yMin + offsetY },
      { x: this.bounds.xMax, y: this.bounds.yMax - offsetY },
      { x: this.bounds.x, y: this.bounds.yMax - offsetY },
      this.bounds.center
    ]
    if (this.rotation) {
      const center = this.rotation.center
      const rad = convertDegreeToRadian(-this.rotation.degree)
      return points
        .map(p =>
        {
          return computeRotatedPoint(p, center, rad)
        })
    }
    return points
  }

  protected getCharCorners(char: TOISymbolChar): TPoint[]
  {
    const boxBox = new Box(char.bounds)
    if (this.rotation) {
      const center = this.rotation.center
      const rad = convertDegreeToRadian(-this.rotation.degree)
      return boxBox.corners
        .map(p =>
        {
          return computeRotatedPoint(p, center, rad)
        })
    }
    return boxBox.corners
  }

  updateChildrenStyle(): void
  {
    this.chars.forEach(c => {
      if (this.style.color) {
        c.color = this.style.color
      }
    })
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
    const clone = new OIText(structuredClone(this.chars), structuredClone(this.point), this.bounds, structuredClone(this.style))
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
      bounds: this.bounds,
      decorators: this.decorators.length ? this.decorators : undefined
    }
  }

  static create(partial: PartialDeep<OIText>): OIText
  {
    if (!isValidPoint(partial?.point)) throw new Error(`Unable to create a OIText, point are invalid`)
    if (!partial.chars?.length) throw new Error(`Unable to create a OIText, no chars`)
    if (!partial.bounds) throw new Error(`Unable to create a OIText, no boundingBox`)
    const text = new OIText(partial.chars as TOISymbolChar[], partial.point as TPoint, partial.bounds as TBoundingBox, partial.style)
    if (partial.id) text.id = partial.id
    if (partial.decorators?.length) {
      partial.decorators.forEach(d => {
        if(d?.kind) {
          text.decorators.push(new OIDecorator(d.kind, Object.assign({}, text.style, d.style)))
        }
      })
    }
    return text
  }
}
