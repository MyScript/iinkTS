import
{
  DefaultPenStyle,
  DefaultStyle,
  TBoundingBox,
  TStyle,
  Stroke,
  OIStroke,
  OIDecorator,
  OIShapeCircle,
  OIEdgeLine,
  OIText,
  TOISymbolChar,
  TPoint,
  DecoratorKind,
} from "../../src/iink"

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

export function buildStroke({ box = defaultBox, style = DefaultPenStyle, nbPoint = 5,  pointerType = "pen" } = {}): Stroke
{
  const stroke = new Stroke(style, pointerType)
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

export function buildOIStroke({ box = defaultBox, style = DefaultStyle, nbPoint = 5, pointerType = "pen" } = {}): OIStroke
{
  const stroke = new OIStroke(style, pointerType)
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

export function buildOIDecorator(kind: DecoratorKind, style: TStyle = DefaultStyle): OIDecorator
{
  return new OIDecorator(kind, style)
}

export function buildOICircle({ center = { x: 0, y: 0 }, radius = 5, style = DefaultStyle }: { center?: TPoint, radius?: number, style?: TStyle } = {}): OIShapeCircle
{
  return new OIShapeCircle(style, center, radius)
}

export function buildOILine({ start = { x: 0, y: 0 }, end = { x: 5, y: 5 }, style = DefaultStyle }: { start?: TPoint, end?: TPoint, style?: TStyle } = {}): OIEdgeLine
{
  return new OIEdgeLine(style, start, end)
}

export function buildOIText({ chars = [], point = { x: 0, y: 0 }, boundingBox = { x: 0, y: 10, width: 20, height: 30 }, style = DefaultStyle }: { chars?: TOISymbolChar[], point?: TPoint, boundingBox?: TBoundingBox, style?: TStyle } = {}): OIText
{
  return new OIText(style, chars, point, boundingBox)
}
