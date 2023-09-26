import {
  TPenStyle,
  TStroke,
  TStrokeJSON,
  TPointer,
} from "../@types"
import { createUUID } from "../utils/uuid"
import { LoggerManager } from "../logger"
import { LoggerClass } from "../Constants"

export class Stroke implements TStroke
{
  #logger = LoggerManager.getLogger(LoggerClass.STROKE)

  id: string
  readonly creationTime: number
  modificationDate: number
  type: string
  pointerId: number
  pointerType: string
  elementType?: string
  pointers: TPointer[]
  length: number
  style: TPenStyle

  constructor(style: TPenStyle, pointerId: number, pointerType = "pen", type = "stroke")
  {
    this.#logger.info("constructor", { style, pointerId, pointerType })
    this.creationTime = Date.now()
    this.id = `${pointerType}-${createUUID()}`
    this.modificationDate = this.creationTime
    this.type = type
    this.pointerId = pointerId
    this.pointerType = pointerType
    this.pointers = []
    this.style = style
    this.length = 0
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
