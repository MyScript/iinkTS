import { TStyle } from "../style"
import { PartialDeep, computePointOnEllipse, isValidNumber } from "../utils"
import { EdgeDecoration, EdgeKind, OIEdgeBase } from "./OIEdge"
import { TPoint, isValidPoint } from "./Point"

/**
 * @group Primitive
 */
export class OIEdgeArc extends OIEdgeBase<EdgeKind.Arc>
{
  center: TPoint
  startAngle: number
  sweepAngle: number
  radiusX: number
  radiusY: number
  phi: number
  protected _vertices: Map<string, TPoint[]>

  constructor(
    center: TPoint,
    startAngle: number,
    sweepAngle: number,
    radiusX: number,
    radiusY: number,
    phi: number,
    startDecoration?: EdgeDecoration,
    endDecoration?: EdgeDecoration,
    style?: PartialDeep<TStyle>,
  )
  {
    super(EdgeKind.Arc, startDecoration, endDecoration, style)
    this.center = center
    this.startAngle = startAngle
    this.sweepAngle = sweepAngle
    this.radiusX = radiusX
    this.radiusY = radiusY
    this.phi = phi
    this._vertices = new Map<string, TPoint[]>()
    this._vertices.set(this.verticesId, this.computedVertices())
  }

  protected get verticesId(): string
  {
    return `${ this.center.x }-${ this.center.y }-${ this.startAngle }-${ this.sweepAngle }-${ this.radiusX }-${ this.radiusY }-${ this.phi }`
  }

  protected computedVertices(): TPoint[]
  {
    const v: TPoint[] = []
    if (this.startAngle + this.sweepAngle > this.startAngle) {
      for (let angle = this.startAngle; angle <= this.startAngle + this.sweepAngle; angle += this.sweepAngle / 50) {
        v.push(computePointOnEllipse(this.center, this.radiusX, this.radiusY, this.phi, angle))
      }
    } else {
      for (let angle = this.startAngle; angle >= this.startAngle + this.sweepAngle; angle += this.sweepAngle / 50) {
        v.push(computePointOnEllipse(this.center, this.radiusX, this.radiusY, this.phi, angle))
      }
    }
    return v
  }

  get vertices(): TPoint[]
  {
    if (!this._vertices.has(this.verticesId)) {
      this._vertices.set(this.verticesId, this.computedVertices())
    }
    return this._vertices.get(this.verticesId)!
  }

  get snapPoints(): TPoint[]
  {
    return [
      this.vertices[0],
      this.vertices.at(-1)!
    ]
  }

  clone(): OIEdgeArc
  {
    const clone = new OIEdgeArc(
      structuredClone(this.center),
      this.startAngle,
      this.sweepAngle,
      this.radiusX,
      this.radiusY,
      this.phi,
      this.startDecoration,
      this.endDecoration,
      structuredClone(this.style)
    )
    clone.id = this.id
    clone.selected = this.selected
    clone.deleting = this.deleting
    clone.creationTime = this.creationTime
    clone.modificationDate = this.modificationDate
    return clone
  }

  toJSON(): PartialDeep<OIEdgeArc>
  {
    return {
      id: this.id,
      type: this.type,
      kind: this.kind,
      center: this.center,
      startAngle: this.startAngle,
      sweepAngle: this.sweepAngle,
      radiusX: this.radiusX,
      radiusY: this.radiusY,
      phi: this.phi,
      startDecoration: this.startDecoration,
      style: this.style,
      endDecoration: this.endDecoration,
    }
  }

  static create(partial: PartialDeep<OIEdgeArc>): OIEdgeArc
  {
    if (!isValidPoint(partial?.center)) throw new Error(`Unable to create a arc, center point is invalid`)
    if (!isValidNumber(partial?.startAngle)) throw new Error(`Unable to create a arc, startAngle is invalid`)
    if (!isValidNumber(partial?.sweepAngle)) throw new Error(`Unable to create a arc, sweepAngle is invalid`)
    if (!isValidNumber(partial?.radiusX)) throw new Error(`Unable to create a arc, radiusX is invalid`)
    if (!isValidNumber(partial?.radiusY)) throw new Error(`Unable to create a arc, radiusY is invalid`)
    return new OIEdgeArc(
      partial?.center as TPoint,
      partial.startAngle!,
      partial.sweepAngle!,
      partial.radiusX!,
      partial.radiusY!,
      partial.phi || 0,
      partial.startDecoration,
      partial.endDecoration,
      partial.style
    )
  }
}
