import { LoggerClass } from "../Constants"
import { LoggerManager } from "../logger"
import { DefaultStyle, TStyle } from "../style"
import { PartialDeep } from "../utils"
import { EdgeDecoration, EdgeKind, OIEdge } from "./OIEdge"
import { TPoint, isValidPoint } from "./Point"

/**
 * @group Primitive
 */
export class OIEdgePolyLine extends OIEdge
{
  #logger = LoggerManager.getLogger(LoggerClass.EDGE)
  points: TPoint[]

  constructor(style: TStyle, points: TPoint[], startDecoration?: EdgeDecoration, endDecoration?: EdgeDecoration)
  {
    super(EdgeKind.PolyEdge, style, startDecoration, endDecoration)
    this.points = points
  }

  get vertices(): TPoint[]
  {
    return this.points
  }

  clone(): OIEdgePolyLine
  {
    this.#logger.info("clone", this)
    const clone = new OIEdgePolyLine(structuredClone(this.style), structuredClone(this.points),this.startDecoration, this.endDecoration)
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
    return new OIEdgePolyLine(partial.style || DefaultStyle, partial?.points as TPoint[], partial.startDecoration, partial.endDecoration)
  }
}
