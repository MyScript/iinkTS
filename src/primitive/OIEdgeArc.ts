import { LoggerClass } from "../Constants"
import { LoggerManager } from "../logger"
import { TStyle } from "../style"
import { EdgeDecoration, EdgeKind, OIEdge } from "./OIEdge"
import { TPoint } from "./Point"

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
}
