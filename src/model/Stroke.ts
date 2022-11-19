import { TPenStyle } from '../@types/style/PenStyle'
import { TStroke } from '../@types/model/Stroke'

export class Stroke implements TStroke
{
  type: string
  pointerId: number
  pointerType: string
  elementType?: string
  x: number[]
  y: number[]
  t: number[]
  p: number[]
  l: number[]
  color: string
  width: number
  '-myscript-pen-width': number
  '-myscript-pen-fill-style': string
  '-myscript-pen-fill-color': string

  constructor(style: TPenStyle, pointerId: number, pointerType = 'pen')
  {
    this.type = 'stroke'
    this.pointerId = pointerId
    this.pointerType = pointerType
    this.x = []
    this.y = []
    this.t = []
    this.p = []
    this.l = []
    this.color = style.color as string
    this.width = style.width as number
    this['-myscript-pen-width'] = style['-myscript-pen-width'] as number
    this['-myscript-pen-fill-style'] = style['-myscript-pen-fill-style'] as string
    this['-myscript-pen-fill-color'] = style['-myscript-pen-fill-color'] as string
  }
}