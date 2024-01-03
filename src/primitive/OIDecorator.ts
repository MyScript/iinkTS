import { LoggerClass, SELECTION_MARGIN } from "../Constants"
import { LoggerManager } from "../logger"
import { DefaultStyle, TStyle } from "../style"

import { SymbolType, TOISymbol } from "./Symbol"

import { Box, TBoundingBox } from "./Box"
import { TPoint, TSegment } from "./Point"
import { computeDistanceBetweenPointAndSegment, createUUID, findIntersectionBetween2Segment } from "../utils"
import { MatrixTransform } from "../transform"

/**
 * @group Primitive
 */
export enum DecoratorKind
{
  Highlight = "highlight",
  Surround = "surround",
  Underline = "underline",
  Strikethrough = "strikethrough",
}

/**
 * @group Primitive
 */
export type TOIDecorator = TOISymbol & {
  type: SymbolType
  kind: DecoratorKind
  boundingBox: Box
  parents: TOISymbol[]
}

/**
 * @group Primitive
 */
export abstract class OIDecorator implements TOIDecorator
{
  #logger = LoggerManager.getLogger(LoggerClass.SHAPE)
  type = SymbolType.Decorator
  kind: DecoratorKind
  id: string
  creationTime: number
  modificationDate: number
  transform: MatrixTransform
  selected: boolean
  style: TStyle
  parents: TOISymbol[]

  constructor(kind: DecoratorKind, style: TStyle, symbols: TOISymbol[])
  {
    this.#logger.debug("constructor", { kind, style, symbols })
    this.id = `${ this.type }-${ kind }-${ createUUID() }`
    this.creationTime = Date.now()
    this.modificationDate = this.creationTime
    this.kind = kind
    this.style = Object.assign({}, DefaultStyle, style)
    this.selected = false
    this.transform = new MatrixTransform(1, 0, 0, 1, 0, 0)
    this.parents = symbols
  }

  abstract get boundingBox(): Box

  abstract get vertices(): TPoint[]

  get edges(): TSegment[]
  {
    return this.vertices.map((p, i) => {
      if (i === this.vertices.length - 1) {
        return { p1: this.vertices[0], p2: p }
      }
      else {
        return { p1: p, p2: this.vertices[i + 1] }
      }
    })
  }

  isCloseToPoint(point: TPoint): boolean
  {
    const segments: TSegment[] = []

    for (let i = 0; i < this.vertices.length - 1; i++) {
      segments.push({
        p1: this.vertices[i],
        p2: this.vertices[ i + 1]
      })
    }
    segments.push({
      p1: this.vertices.at(-1)!,
      p2: this.vertices.at(0)!
    })

    return segments.some(seg =>
    {
      return computeDistanceBetweenPointAndSegment(point, seg) < SELECTION_MARGIN
    })
  }

  isOverlapping(box: TBoundingBox): boolean
  {
    const boxEdges: TSegment[] = [
      { p1: { x: box.x, y: box.y }, p2: { x: box.x + box.width, y: box.y }},
      { p1: { x: box.x + box.width, y: box.y }, p2: { x: box.x + box.width, y: box.y + box.height }},
      { p1: { x: box.x + box.width, y: box.y + box.height }, p2: { x: box.x, y: box.y + box.height }},
      { p1: { x: box.x, y: box.y + box.height }, p2: { x: box.x, y: box.y }},
    ]
    return this.boundingBox.isWrap(box) ||
      this.edges.some(e1 => boxEdges.some(e2 => !!findIntersectionBetween2Segment(e1, e2)))
  }

  abstract getClone(): OIDecorator
}
