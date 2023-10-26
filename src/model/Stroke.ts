import { TPenStyle } from "../@types/style/PenStyle"
import { TStroke, TStrokeJSON } from "../@types/model/Stroke"
import { TPointer } from "../@types/geometry"
import { LoggerManager } from "../logger"
import { LoggerClass } from "../Constants"

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
  #logger = LoggerManager.getLogger(LoggerClass.STROKE)

  constructor(style: TPenStyle, pointerId: number, pointerType = "pen")
  {
    this.#logger.info("constructor", { style, pointerId, pointerType })
    this.id = `${pointerType}-${Math.random().toString(10).substring(2, 12)}`
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
