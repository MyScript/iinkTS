import { Stroke, DefaultPenStyle, TBoundingBox, OIStroke, DefaultStyle, OIDecoratorHighlight, TStyle, TOISymbol, OIDecoratorSurround, OIDecoratorUnderline, OIDecoratorStrikethrough } from "../../src/iink"

export const delay = (delayInms: number) =>
{
  return new Promise(resolve => setTimeout(resolve, delayInms))
}

export function round(n: number, digit = 2)
{
  return Math.round(n * Math.pow(10, digit)) / Math.pow(10, digit)
}

export function randomIntFromInterval(min: number, max: number): number
{
  return Math.floor(Math.random() * (max - min) + min)
}

const defaultBox: TBoundingBox = { height: 10, width: 10, x: 1, y: 1 }

export function buildStroke({ box = defaultBox, style = DefaultPenStyle, nbPoint = 5, pointerId = 1, pointerType = "pen" } = {}): Stroke
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

export function buildOIStroke({ box = defaultBox, style = DefaultStyle, nbPoint = 5, pointerId = 1, pointerType = "pen" } = {}): OIStroke
{
  const stroke = new OIStroke(style, pointerId, pointerType)
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

export function buildOIHighlight(symbols: TOISymbol[], style: TStyle = DefaultStyle): OIDecoratorHighlight
{
  return new OIDecoratorHighlight(style, symbols)
}

export function buildOISurround(symbols: TOISymbol[], style: TStyle = DefaultStyle): OIDecoratorSurround
{
  return new OIDecoratorSurround(style, symbols)
}

export function buildOIUnderline(symbols: TOISymbol[], style: TStyle = DefaultStyle): OIDecoratorUnderline
{
  return new OIDecoratorUnderline(style, symbols)
}

export function buildOIStrikethrough(symbols: TOISymbol[], style: TStyle = DefaultStyle): OIDecoratorStrikethrough
{
  return new OIDecoratorStrikethrough(style, symbols)
}
