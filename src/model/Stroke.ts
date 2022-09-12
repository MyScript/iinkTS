import { TPenStyle } from '../@types/style/PenStyle'
import { TStroke } from '../@types/stroker/Stroker'

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
    this.color = style.color
    this.width = style.width
    this['-myscript-pen-width'] = style['-myscript-pen-width']
    this['-myscript-pen-fill-style'] = style['-myscript-pen-fill-style']
    this['-myscript-pen-fill-color'] = style['-myscript-pen-fill-color']
  }
}