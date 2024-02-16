import { LoggerClass } from "../Constants"
import { LoggerManager } from "../logger"
import { DefaultStyle, TStyle } from "../style"
import { PartialDeep } from "../utils"
import { EdgeDecoration, EdgeKind, OIEdge } from "./OIEdge"
import { TPoint, isValidPoint } from "./Point"

/**
 * @group Primitive
 */
export class OIEdgeArc extends OIEdge
{
  #logger = LoggerManager.getLogger(LoggerClass.EDGE)

  middle: TPoint

  constructor(style: TStyle, start: TPoint, middle: TPoint, end: TPoint, startDecoration?: EdgeDecoration, endDecoration?: EdgeDecoration)
  {
    super(EdgeKind.Arc, style, start, end, startDecoration, endDecoration)
    this.middle = middle
  }

  get vertices(): TPoint[]
  {
    return [
      this.start,
      this.middle,
      this.end
    ]
  }

  clone(): OIEdgeArc
  {
    this.#logger.info("clone", this)
    const clone = new OIEdgeArc(structuredClone(this.style), structuredClone(this.start), structuredClone(this.middle), structuredClone(this.end), this.startDecoration, this.endDecoration)
    clone.id = this.id
    clone.selected = this.selected
    clone.deleting = this.deleting
    clone.creationTime = this.creationTime
    clone.modificationDate = this.modificationDate
    return clone
  }

  static create(partial: PartialDeep<OIEdgeArc>): OIEdgeArc
  {
    if (!isValidPoint(partial?.start)) throw new Error(`Unable to create a arc, start point is invalid`)
    if (!isValidPoint(partial?.middle)) throw new Error(`Unable to create a arc, middle point is invalid`)
    if (!isValidPoint(partial?.end)) throw new Error(`Unable to create a arc, end point is invalid`)
    return new OIEdgeArc(partial.style || DefaultStyle, partial?.start as TPoint, partial?.middle as TPoint, partial?.end as TPoint, partial.startDecoration, partial.endDecoration)
  }
}
