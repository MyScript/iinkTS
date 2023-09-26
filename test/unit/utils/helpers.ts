import { TBoundingBox, TStroke } from "../../../src/@types"
import { model, style } from "../../../src/iink"

const { Stroke } = model
const { DefaultPenStyle } = style

export const delay = (delayInms: number) =>
{
  return new Promise(resolve => setTimeout(resolve, delayInms))
}

export function randomIntFromInterval(min: number, max: number): number
{
  return Math.floor(Math.random() * (max - min) + min)
}

const defaultBox: TBoundingBox = { height: 10, width: 10, x: 1, y: 1 }
export function buildStroke({ box = defaultBox, style = DefaultPenStyle, nbPoint = 5, pointerId = 1, pointerType = "pen" } = {}): TStroke
{
  const stroke = new Stroke(style, pointerId, pointerType)
  for (let i = 0; i < nbPoint; i++) {
    stroke.pointers.push({
      p: Math.random(),
      t: Date.now() + i,
      x: randomIntFromInterval(box.x, box.x + box.width),
      y: randomIntFromInterval(box.y, box.y + box.height),
    })
  }
  return stroke
}
