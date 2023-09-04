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
  style: TPenStyle

  constructor(style: TPenStyle, pointerId: number, pointerType = "pen")
  {
    this.id = `${pointerType}-${Date.now().toString()}`
    this.type = "stroke"
    this.pointerId = pointerId
    this.pointerType = pointerType
    this.pointers = []
    this.length = 0
    this.style = style
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
