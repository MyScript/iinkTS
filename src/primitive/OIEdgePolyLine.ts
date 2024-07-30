import { TStyle } from "../style"
import { PartialDeep } from "../utils"
import { EdgeDecoration, EdgeKind, OIEdgeBase } from "./OIEdge"
import { TPoint, isValidPoint } from "./Point"

/**
 * @group Primitive
 */
export class OIEdgePolyLine extends OIEdgeBase<EdgeKind.PolyEdge>
{
  points: TPoint[]

  constructor(
    points: TPoint[],
    startDecoration?: EdgeDecoration,
    endDecoration?: EdgeDecoration,
    style?: PartialDeep<TStyle>
  )
  {
    super(EdgeKind.PolyEdge, startDecoration, endDecoration, style)
    this.points = points
  }

  get vertices(): TPoint[]
  {
    return this.points
  }

  clone(): OIEdgePolyLine
  {
    const clone = new OIEdgePolyLine(structuredClone(this.points),this.startDecoration, this.endDecoration, structuredClone(this.style))
    clone.id = this.id
    clone.selected = this.selected
    clone.deleting = this.deleting
    clone.creationTime = this.creationTime
    clone.modificationDate = this.modificationDate
    return clone
  }

  toJSON(): PartialDeep<OIEdgePolyLine>
  {
    return {
      id: this.id,
      type: this.type,
      kind: this.kind,
      points: this.points,
      style: this.style,
      startDecoration: this.startDecoration,
      endDecoration: this.endDecoration,
    }
  }

  static create(partial: PartialDeep<OIEdgePolyLine>): OIEdgePolyLine
  {
    if (!partial?.points?.map(p => isValidPoint(p))) throw new Error(`Unable to create a PolyLine, points are invalid`)
    const polyline = new OIEdgePolyLine(partial?.points as TPoint[], partial.startDecoration, partial.endDecoration, partial.style)
    if (partial.id) {
      polyline.id = partial.id
    }
    return polyline
  }
}
