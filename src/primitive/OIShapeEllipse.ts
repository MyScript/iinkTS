import { SELECTION_MARGIN } from "../Constants"
import { TStyle } from "../style"
import { PartialDeep, computeDistanceBetweenPointAndSegment, computePointOnEllipse, findIntersectionBetween2Segment, isValidNumber, } from "../utils"
import { TPoint, isValidPoint } from "./Point"
import { OIShapeBase, ShapeKind } from "./OIShape"
import { Box, TBoundingBox } from "./Box"

/**
 * @group Primitive
 */
export class OIShapeEllipse extends OIShapeBase<ShapeKind.Ellipse>
{
  center: TPoint
  radiusX: number
  radiusY: number
  orientation: number
  protected _vertices: Map<string, TPoint[]>

  constructor(
    center: TPoint,
    radiusX: number,
    radiusY: number,
    orientation: number,
    style?: PartialDeep<TStyle>
  )
  {
    super(ShapeKind.Ellipse, style)
    this.center = center
    this.radiusX = radiusX
    this.radiusY = radiusY
    this.orientation = orientation
    this._vertices = new Map<string, TPoint[]>()
  }

  protected get verticesId(): string
  {
    return `${ this.center.x }-${ this.center.y }-${ this.radiusX }-${ this.radiusY }-${ this.orientation }`
  }

  protected computedVertices(): TPoint[]
  {
    const points: TPoint[] = []
    const perimeter = 2 * Math.PI * Math.sqrt((Math.pow(this.radiusX, 2) + Math.pow(this.radiusY, 2)) / 2)
    const nbPoint = Math.max(8, Math.round(perimeter / SELECTION_MARGIN))
    for (let i = 0; i < nbPoint; i++) {
      const theta = 2 * Math.PI * (i / nbPoint)
      points.push(computePointOnEllipse(this.center, this.radiusX, this.radiusY, this.orientation, theta))
    }

    return points
  }

  get vertices(): TPoint[]
  {
    if (!this._vertices.has(this.verticesId)) {
      this._vertices.set(this.verticesId, this.computedVertices())
    }
    return this._vertices.get(this.verticesId)!
  }

  isCloseToPoint(point: TPoint): boolean
  {
    return this.edges.some(e => computeDistanceBetweenPointAndSegment(point, e) < SELECTION_MARGIN)
  }

  overlaps(box: TBoundingBox): boolean
  {

    return this.bounds.isContained(box) ||
      this.edges.some(e1 => Box.getSides(box).some(e2 => !!findIntersectionBetween2Segment(e1, e2)))
  }

  clone(): OIShapeEllipse
  {
    const clone = new OIShapeEllipse(structuredClone(this.center), this.radiusX, this.radiusY, this.orientation, structuredClone(this.style))
    clone.id = this.id
    clone.selected = this.selected
    clone.deleting = this.deleting
    clone.creationTime = this.creationTime
    clone.modificationDate = this.modificationDate
    return clone
  }

  toJSON(): PartialDeep<OIShapeEllipse>
  {
    return {
      id: this.id,
      type: this.type,
      kind: this.kind,
      center: this.center,
      orientation: this.orientation,
      radiusX: this.radiusX,
      radiusY: this.radiusY,
      style: this.style,
    }
  }

  static createBetweenPoints(origin: TPoint, target: TPoint, style?: PartialDeep<TStyle>): OIShapeEllipse
  {
    const center = {
      x: (origin.x + target.x) / 2,
      y: (origin.y + target.y) / 2
    }
    const radiusX = Math.abs(origin.x - target.x) / 2
    const radiusY = Math.abs(origin.y - target.y) / 2
    return new OIShapeEllipse(center, radiusX, radiusY, 0, style)
  }

  static updateBetweenPoints(ellipse: OIShapeEllipse, origin: TPoint, target: TPoint): OIShapeEllipse
  {
    ellipse.center = {
      x: (origin.x + target.x) / 2,
      y: (origin.y + target.y) / 2
    }
    ellipse.radiusX = Math.abs(origin.x - target.x) / 2
    ellipse.radiusY = Math.abs(origin.y - target.y) / 2
    return ellipse
  }

  static create(partial: PartialDeep<OIShapeEllipse>): OIShapeEllipse
  {
    if (!isValidPoint(partial.center)) throw new Error(`Unable to create ellipse, center is undefined`)
    if (!isValidNumber(partial.radiusX)) throw new Error(`Unable to create ellipse, radiusX is undefined`)
    if (!isValidNumber(partial.radiusY)) throw new Error(`Unable to create ellipse, radiusY is undefined`)
    const ellipse = new OIShapeEllipse(partial.center as TPoint, partial.radiusX!, partial.radiusY!, partial.orientation || 0, partial.style)
    if (partial.id) {
      ellipse.id = partial.id
    }
    return ellipse
  }
}
