import { TPenStyle } from "../@types/style/PenStyle"
import { TStroke, TStrokeJSON } from "../@types/model/Stroke"
import { TPointer } from "../@types/geometry"

export class Stroke implements TStroke
{
  id: string
  type: string
  pointerId: number
  pointerType: string
  elementType?: string
  pointers: TPointer[]
  length: number
  color: string
  width: number
  "-myscript-pen-width": number
  "-myscript-pen-fill-style": string
  "-myscript-pen-fill-color": string

  constructor(style: TPenStyle, pointerId: number, pointerType = "pen")
  {
    this.id = `${pointerType}-${Date.now().toString()}`
    this.type = "stroke"
    this.pointerId = pointerId
    this.pointerType = pointerType
    this.pointers = []
    this.length = 0
    this.color = style.color as string
    this.width = style.width as number
    this["-myscript-pen-width"] = style["-myscript-pen-width"] as number
    this["-myscript-pen-fill-style"] = style["-myscript-pen-fill-style"] as string
    this["-myscript-pen-fill-color"] = style["-myscript-pen-fill-color"] as string
  }
}

export function convertStrokeToJSON(stroke: TStroke): TStrokeJSON
{
  const json: TStrokeJSON = {
    id: stroke.id,
    pointerType: stroke.pointerType,
    p: [],
    t: [],
    x: [],
    y: []
  }
  stroke.pointers.forEach(p => {
    json.p.push(p.p)
    json.t.push(p.t)
    json.x.push(p.x)
    json.y.push(p.y)
  })
  return json
}
