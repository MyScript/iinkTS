import { LoggerClass, SELECTION_MARGIN } from "../Constants"
import { LoggerManager } from "../logger"
import { DefaultStyle, TStyle } from "../style"
import { MatrixTransform } from "../transform"
import { computeDistanceBetweenPointAndSegment, createUUID, isBetween } from "../utils"
import { Box, TBoundingBox } from "./Box"
import { TPoint } from "./Point"
import { SymbolType, TOISymbol } from "./Symbol"

/**
 * @group Primitive
 */
export enum EdgeKind
{
  Line = "line",
  Arc = "arc",
}

export enum EdgeDecoration
{
  Arrow = "arrow"
}

/**
 * @group Primitive
 */
export type TOIEdge = TOISymbol & {
  type: SymbolType
  kind: EdgeKind
  start: TPoint
  end: TPoint
  startDecoration?: EdgeDecoration
  endDecoration?: EdgeDecoration
  boundingBox: Box
}

export class OILine implements TOIEdge
{
  #logger = LoggerManager.getLogger(LoggerClass.EDGE)

  readonly type = SymbolType.Edge
  readonly kind = EdgeKind.Line

  id: string
  creationTime: number
  modificationDate: number
  transform: MatrixTransform
  selected: boolean
  style: TStyle
  start: TPoint
  end: TPoint
  startDecoration?: EdgeDecoration
  endDecoration?: EdgeDecoration

  constructor(style: TStyle, start: TPoint, end: TPoint, startDecoration?: EdgeDecoration, endDecoration?: EdgeDecoration)
  {
    this.id = `${ this.type }-${ this.kind }-${ createUUID() }`
    this.#logger.debug("constructor", { style, start, end, startDecoration, endDecoration })
    this.creationTime = Date.now()
    this.modificationDate = this.creationTime
    this.style = Object.assign({}, DefaultStyle, style)
    this.selected = false
    this.transform = new MatrixTransform(1, 0, 0, 1, 0, 0)

    this.start = start
    this.end = end
    this.startDecoration = startDecoration
    this.endDecoration = endDecoration
  }

  get vertices(): TPoint[]
  {
    return [
      this.start,
      this.end
    ]
  }

  get boundingBox(): Box
  {
    const minBox = Box.createFromPoints([this.start, this.end])
    return new Box(minBox.xMin - SELECTION_MARGIN / 2, minBox.yMin - SELECTION_MARGIN / 2, minBox.width + SELECTION_MARGIN, minBox.height + SELECTION_MARGIN)
  }

  isCloseToPoint(point: TPoint): boolean
  {
    return computeDistanceBetweenPointAndSegment(point, { p1: this.start, p2: this.end}) < SELECTION_MARGIN
  }

  isPartiallyOrTotallyWrapped(box: TBoundingBox): boolean
  {
    return this.boundingBox.isWrap(box) ||
      this.vertices.some(v => isBetween(v.x, box.x, box.x + box.width) && isBetween(v.y, box.y, box.y + box.height))
  }

  getClone(): OILine
  {
    const clone = new OILine(structuredClone(this.style), structuredClone(this.start), structuredClone(this.end), this.startDecoration, this.endDecoration)
    clone.id = this.id
    clone.creationTime = this.creationTime
    clone.modificationDate = this.modificationDate
    return clone
  }
}
