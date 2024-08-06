import { PartialDeep, createUUID } from "../utils"
import { TBoundingBox } from "./Box"
import { TPoint } from "./Point"
import { SymbolType, TSymbol } from "./Symbol"
import { DefaultStyle, TStyle } from "../style"
import { MatrixTransform } from "../transform"

/**
 * @group Primitive
 */
export abstract class OISymbolBase<T extends string = SymbolType> implements TSymbol
{
  readonly type: T
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
    this.style.opacity = +this.style.opacity!
    this.style.width = +this.style.width!
  }

  abstract get vertices(): TPoint[]

  abstract get snapPoints(): TPoint[]

  abstract overlaps(box: TBoundingBox): boolean

  abstract isCloseToPoint(point: TPoint): boolean

  abstract clone(): OISymbolBase

  abstract toJSON(): PartialDeep<OISymbolBase>
}
