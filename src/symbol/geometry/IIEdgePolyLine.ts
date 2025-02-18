import { TStyle } from "../../style"
import { PartialDeep } from "../../utils"
import { EdgeDecoration, EdgeKind, OIEdgeBase } from "./IIEdge"
import { TPoint, isValidPoint } from "../Point"

/**
 * @group Symbol
 */
export class IIEdgePolyLine extends OIEdgeBase<EdgeKind.PolyEdge>
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

  clone(): IIEdgePolyLine
  {
    const clone = new IIEdgePolyLine(structuredClone(this.points),this.startDecoration, this.endDecoration, structuredClone(this.style))
    clone.id = this.id
    clone.selected = this.selected
    clone.deleting = this.deleting
    clone.creationTime = this.creationTime
    clone.modificationDate = this.modificationDate
    return clone
  }

  toJSON(): PartialDeep<IIEdgePolyLine>
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

  static create(partial: PartialDeep<IIEdgePolyLine>): IIEdgePolyLine
  {
    if (!partial?.points?.map(p => isValidPoint(p))) throw new Error(`Unable to create a PolyLine, points are invalid`)
    const polyline = new IIEdgePolyLine(partial?.points as TPoint[], partial.startDecoration, partial.endDecoration, partial.style)
    if (partial.id) {
      polyline.id = partial.id
    }
    return polyline
  }
}
