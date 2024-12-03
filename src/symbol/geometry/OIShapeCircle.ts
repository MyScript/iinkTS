import { SELECTION_MARGIN } from "../../Constants"
import { TStyle } from "../../style"
import { PartialDeep, findIntersectBetweenSegmentAndCircle, isValidNumber, computeRotatedPoint } from "../../utils"
import { TPoint, isValidPoint } from "../Point"
import { OIShapeBase, ShapeKind } from "./OIShape"
import { Box, TBox } from "../Box"

/**
 * @group Symbol
 */
export class OIShapeCircle extends OIShapeBase<ShapeKind.Circle>
{
  center: TPoint
  radius: number
  protected _vertices: Map<string, TPoint[]>
  protected _bounds: Map<string, Box>

  constructor(
    center: TPoint,
    radius: number,
    style?: PartialDeep<TStyle>
  )
  {
    super(ShapeKind.Circle, style)
    this.center = center
    this.radius = radius
    this._vertices = new Map<string, TPoint[]>()
    this._vertices.set(this.verticesId, this.computedVertices())
    this._bounds = new Map<string, Box>()
    this._bounds.set(this.verticesId, this.computedBondingBox())
  }

  protected get verticesId(): string
  {
    return `${ this.center.x }-${ this.center.y }-${ this.radius }`
  }

  protected computedVertices(): TPoint[]
  {
    const firstPoint: TPoint = {
      x: this.center.x,
      y: this.radius + this.center.y
    }
    const perimeter = 2 * Math.PI * this.radius
    const nbPoint = Math.max(8, Math.round(perimeter / SELECTION_MARGIN))
    const points: TPoint[] = []
    for (let i = 0; i < nbPoint; i++) {
      const rad = 2 * Math.PI * (i / nbPoint)
      points.push(computeRotatedPoint(firstPoint, this.center, rad))
    }
    return points
  }

  protected computedBondingBox(): Box
  {
    const boundingBox: TBox = {
      x: this.center.x - this.radius,
      y: this.center.y - this.radius,
      height: this.radius * 2,
      width: this.radius * 2
    }
    return new Box(boundingBox)
  }

  get bounds(): Box
  {
    if (!this._bounds.has(this.verticesId)) {
      this._bounds.set(this.verticesId, this.computedBondingBox())
    }
    return this._bounds.get(this.verticesId)!
  }

  get vertices(): TPoint[]
  {
    if (!this._vertices.has(this.verticesId)) {
      this._vertices.set(this.verticesId, this.computedVertices())
    }
    return this._vertices.get(this.verticesId)!
  }

  overlaps(box: TBox): boolean
  {
    return this.bounds.isContained(box) ||
      Box.getSides(box).some(seg => findIntersectBetweenSegmentAndCircle(seg, this.center, this.radius).length)
  }

  clone(): OIShapeCircle
  {
    const clone = new OIShapeCircle(structuredClone(this.center), this.radius, structuredClone(this.style))
    clone.id = this.id
    clone.selected = this.selected
    clone.deleting = this.deleting
    clone.creationTime = this.creationTime
    clone.modificationDate = this.modificationDate
    return clone
  }

  toJSON(): PartialDeep<OIShapeCircle>
  {
    return {
      id: this.id,
      type: this.type,
      kind: this.kind,
      center: this.center,
      radius: this.radius,
      style: this.style,
    }
  }

  static createBetweenPoints(origin: TPoint, target: TPoint, style?: PartialDeep<TStyle>): OIShapeCircle
  {
    const center = {
      x: (origin.x + target.x) / 2,
      y: (origin.y + target.y) / 2
    }

    const width = Math.abs(origin.x - target.x)
    const height = Math.abs(origin.y - target.y)
    const radius = Math.min(width, height) / 2
    return new OIShapeCircle(center, radius, style)
  }

  static updateBetweenPoints(circle: OIShapeCircle, origin: TPoint, target: TPoint): OIShapeCircle
  {
    circle.center = {
      x: (origin.x + target.x) / 2,
      y: (origin.y + target.y) / 2
    }
    const width = Math.abs(origin.x - target.x)
    const height = Math.abs(origin.y - target.y)
    circle.radius = Math.min(width, height) / 2
    return circle
  }

  static create(partial: PartialDeep<OIShapeCircle>): OIShapeCircle
  {
    if (!isValidPoint(partial.center)) throw new Error(`Unable to create circle, center is invalid`)
    if (!isValidNumber(partial.radius)) throw new Error(`Unable to create circle, radius is undefined`)
    const circle = new OIShapeCircle(partial.center as TPoint, partial.radius!, partial.style)
    if (partial.id) {
      circle.id = partial.id
    }
    return circle
  }
}
