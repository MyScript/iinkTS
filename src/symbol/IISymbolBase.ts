import { PartialDeep, createUUID, findIntersectionBetween2Segment } from "../utils"
import { TBox } from "./Box"
import { TPoint, TSegment } from "./Point"
import { SymbolType, TSymbol } from "./Symbol"
import { DefaultStyle, TStyle } from "../style"
import { MatrixTransform } from "../transform"

/**
 * @group Symbol
 */
export abstract class IISymbolBase<T extends string = SymbolType> implements TSymbol
{
  readonly type: T
  abstract readonly isClosed: boolean
  style: TStyle

  id: string
  creationTime: number
  modificationDate: number
  selected: boolean
  deleting: boolean
  transform: MatrixTransform

  constructor(type: T, style?: PartialDeep<TStyle>)
  {
    this.type = type
    this.id = `${ this.type }-${ createUUID() }`

    this.creationTime = Date.now()
    this.modificationDate = this.creationTime
    this.selected = false
    this.deleting = false

    this.transform = MatrixTransform.identity()

    this.style = Object.assign({}, DefaultStyle, style)
    if (this.style.opacity) {
      this.style.opacity = +this.style.opacity
    }
    this.style.width = +this.style.width
  }

  abstract get vertices(): TPoint[]

  abstract get snapPoints(): TPoint[]

  get edges(): TSegment[]
  {
    if (this.isClosed) {
      return this.vertices.map((p, i) =>
      {
        if (i === this.vertices.length - 1) {
          return { p1: p, p2: this.vertices[0] }
        }
        else {
          return { p1: p, p2: this.vertices[i + 1] }
        }
      })
    }
    else {
      return this.vertices.slice(0, -1).map((p, i) =>
      {
        return { p1: p, p2: this.vertices[i + 1] }
      })
    }
  }

  abstract overlaps(box: TBox): boolean

  abstract clone(): IISymbolBase

  abstract toJSON(): PartialDeep<IISymbolBase>

  isIntersected(seg: TSegment): boolean
  {
    return this.edges.some(edge =>
    {
      return findIntersectionBetween2Segment(edge, seg)
    })
  }
}
