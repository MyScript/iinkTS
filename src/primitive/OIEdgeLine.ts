import { LoggerClass } from "../Constants"
import { LoggerManager } from "../logger"
import { DefaultStyle, TStyle } from "../style"
import { PartialDeep } from "../utils"
import { EdgeDecoration, EdgeKind, OIEdge } from "./OIEdge"
import { TPoint, isValidPoint } from "./Point"

/**
 * @group Primitive
 */
export class OIEdgeLine extends OIEdge
{
  #logger = LoggerManager.getLogger(LoggerClass.EDGE)


  constructor(style: TStyle, start: TPoint, end: TPoint, startDecoration?: EdgeDecoration, endDecoration?: EdgeDecoration)
  {
    super(EdgeKind.Line, style, start, end, startDecoration, endDecoration)
  }

  get vertices(): TPoint[]
  {
    return [
      this.start,
      this.end
    ]
  }

  clone(): OIEdgeLine
  {
    this.#logger.info("clone", this)
    const clone = new OIEdgeLine(structuredClone(this.style), structuredClone(this.start), structuredClone(this.end), this.startDecoration, this.endDecoration)
    clone.id = this.id
    clone.selected = this.selected
    clone.deleting = this.deleting
    clone.creationTime = this.creationTime
    clone.modificationDate = this.modificationDate
    return clone
  }

  toJSON(): PartialDeep<OIEdgeLine>
  {
    return {
      id: this.id,
      type: this.type,
      kind: this.kind,
      start: this.start,
      end: this.end,
      style: this.style,
      startDecoration: this.startDecoration,
      endDecoration: this.endDecoration,
    }
  }

  static create(partial: PartialDeep<OIEdgeLine>): OIEdgeLine
  {
    if (!isValidPoint(partial?.start)) throw new Error(`Unable to create a arc, start point is invalid`)
    if (!isValidPoint(partial?.end)) throw new Error(`Unable to create a arc, end point is invalid`)
    return new OIEdgeLine(partial.style || DefaultStyle, partial?.start as TPoint, partial?.end as TPoint, partial.startDecoration, partial.endDecoration)
  }
}
