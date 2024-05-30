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
  middles: TPoint[]

  constructor(style: TStyle, start: TPoint, middles: TPoint[], end: TPoint, startDecoration?: EdgeDecoration, endDecoration?: EdgeDecoration)
  {
    super(EdgeKind.PolyEdge, style, start, end, startDecoration, endDecoration)
    this.middles = middles
  }

  get vertices(): TPoint[]
  {
    return [
      this.start,
      ...this.middles,
      this.end
    ]
  }

  clone(): OIEdgePolyLine
  {
    this.#logger.info("clone", this)
    const clone = new OIEdgePolyLine(structuredClone(this.style), structuredClone(this.start), structuredClone(this.middles), structuredClone(this.end), this.startDecoration, this.endDecoration)
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
      start: this.start,
      middles: this.middles,
      end: this.end,
      style: this.style,
      startDecoration: this.startDecoration,
      endDecoration: this.endDecoration,
    }
  }

  static create(partial: PartialDeep<OIEdgePolyLine>): OIEdgePolyLine
  {
    if (!isValidPoint(partial?.start)) throw new Error(`Unable to create a PolyLine, start point is invalid`)
    if (!partial?.middles?.map(p => isValidPoint(p))) throw new Error(`Unable to create a PolyLine, end point is invalid`)
    return new OIEdgePolyLine(partial.style || DefaultStyle, partial?.start as TPoint, partial?.middles as TPoint[], partial?.end as TPoint, partial.startDecoration, partial.endDecoration)
  }
}
