import { BaseMenuItem, DecoratorKind, DecoratorUtil, DefaultPenStyle, DefaultStyle, EdgeUtil, Ellipse2d, EraserOps, MathUtil, OBBOps, Polygon2d, Polyline2d, HIT_TOLERANCE, ShapeUtil, Stroke, StrokeUtil, TBox, TDecorator, TEdge, TEdgeLine, TEraser, TMath, TMathElement, TPartialDeep, TPoint, TShapeCircle, TShapeEllipse, TStroke, TStyle, TSymbolChar, TText, TextUtil, computeTypesetVertices, TInteractiveInkCanvas } from "@/iink"


export const delay = (delayInms: number) => {
  return new Promise((resolve) => setTimeout(resolve, delayInms))
}

export function round(n: number, digit = 2) {
  return Math.round(n * Math.pow(10, digit)) / Math.pow(10, digit)
}

export function randomIntFromInterval(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min) + min)
}

const defaultBox: TBox = { height: 10, width: 10, x: 1, y: 1 }

export function buildStroke({
  box = defaultBox,
  style = DefaultPenStyle,
  nbPoint = 5,
  pointerType = "pen",
} = {}): Stroke {
  const stroke = new Stroke(style, pointerType)
  for (let i = 0; i < nbPoint; i++) {
    stroke.pointers.push({
      p: Math.random(),
      dt: i,
      x: randomIntFromInterval(box.x, box.x + box.width),
      y: randomIntFromInterval(box.y, box.y + box.height),
    })
  }
  return stroke
}

export function buildStrokeV2({
  box = defaultBox,
  style = DefaultPenStyle,
  nbPoint = 5,
  pointerType = "pen",
} = {}): TStroke {
  const stroke = StrokeUtil.createEmpty(style, pointerType)
  for (let i = 0; i < nbPoint; i++) {
    stroke.pointers.push({
      p: Math.random(),
      dt: i,
      x: randomIntFromInterval(box.x, box.x + box.width),
      y: randomIntFromInterval(box.y, box.y + box.height),
    })
  }
  return stroke
}

export function buildIIStroke({
  box = defaultBox,
  style = DefaultStyle,
  nbPoint = 5,
  pointerType = "pen",
} = {}): TStroke {
  const stroke = StrokeUtil.createEmpty(style, pointerType)
  const stepX = box.width / (nbPoint - 1)
  const stepY = box.height / (nbPoint - 1)
  for (let i = 0; i < nbPoint; i++) {
    StrokeUtil.addPointer(stroke, {
      p: Math.random(),
      dt: i,
      x: box.x + stepX * i,
      y: box.y + stepY * i,
    })
  }
  return stroke
}

export function buildIIEraser({ box = defaultBox, nbPoint = 5 } = {}): TEraser {
  const eraser = EraserOps.create()
  const stepX = box.width / (nbPoint - 1)
  const stepY = box.height / (nbPoint - 1)
  for (let i = 0; i < nbPoint; i++) {
    eraser.pointers.push({
      p: Math.random(),
      dt: i,
      x: box.x + stepX * i,
      y: box.y + stepY * i,
    })
  }
  return eraser
}

export function buildIIDecorator(kind: DecoratorKind, style: TPartialDeep<TStyle> = DefaultStyle): TDecorator {
  return DecoratorUtil.createDecorator(kind, style)
}

export function buildIICircle({
  center = { x: 0, y: 0 },
  radius = 5,
  style = DefaultStyle,
}: { center?: TPoint; radius?: number; style?: TPartialDeep<TStyle> } = {}): TShapeCircle {
  return ShapeUtil.createCircle(center, radius, style)
}

export function buildIILine({
  start = { x: 0, y: 0 },
  end = { x: 5, y: 5 },
  style = DefaultStyle,
}: { start?: TPoint; end?: TPoint; style?: TPartialDeep<TStyle> } = {}): TEdgeLine {
  return EdgeUtil.createLine(start, end, undefined, undefined, style)
}

export function buildIIText({
  chars = [],
  point = { x: 0, y: 0 },
  boundingBox = { x: 0, y: 10, width: 20, height: 30 },
  style = DefaultStyle,
}: { chars?: TSymbolChar[]; point?: TPoint; boundingBox?: TBox; style?: TPartialDeep<TStyle> } = {}): TText {
  return TextUtil.createText(chars, point, boundingBox, style)
}

export function buildIIMath(
  label: string = "y=3x+2",
  {
    point = { x: 0, y: 0 },
    boundingBox = { x: 0, y: 10, width: 50, height: 30 },
    style = DefaultStyle,
  }: { point?: TPoint; boundingBox?: TBox; style?: TPartialDeep<TStyle> } = {}
): TMath {
  const elements: TMathElement[] = [
    {
      id: "math-elem-1",
      label,
      fontSize: 16,
      fontWeight: "normal",
      fontFamily: "Arial",
      color: "#000000",
      bounds: boundingBox,
    },
  ]
  return MathUtil.createMath(elements, point, boundingBox, style)
}


/**
 * Asserts a transform wrote its coordinates rounded to the three decimals the document stores.
 *
 * Takes the points explicitly rather than walking the symbol, because only the geometry a transform
 * *writes* is in scope: `center`, `start`, `end`, `points`, `point`, `pointers`. The derived fields
 * — `bounds`, `vertices`, `snapPoints`, `edges` — are recomputed from those by the symbol's util,
 * and arithmetic on a rounded value is not itself a rounded value (3.217 − 4 is
 * −0.7829999999999999 in binary floating point). They were never rounded and are not asked to be.
 *
 * The invariant, not thirteen enumerated call sites: before IIC-2010 some transform branches went
 * through `MatrixTransform.applyToPoint` raw and others through a rounding helper, so a resized
 * line held three decimals while a translated one held seventeen.
 */
export function expectPointsRounded(points: TPoint[]): void {
  expect(points.length).toBeGreaterThan(0)
  const unrounded = points.filter((point) => point.x !== +point.x.toFixed(3) || point.y !== +point.y.toFixed(3))
  // Named, not counted: a failure has to show which coordinate kept its full precision.
  expect(unrounded).toEqual([])
}

/**
 * The geometry a symbol's util builds for it, for tests that used to assert against the `*Ops`
 * geometry methods the util replaced. Written once here rather than per file, so a change to how a
 * kind describes itself is a change in one place.
 */
export function ellipseGeometry(ellipse: TShapeEllipse): Ellipse2d {
  return Ellipse2d.fromRadii(ellipse.center, ellipse.radiusX, ellipse.radiusY, ellipse.orientation)
}

/** An edge's path, padded the way `EdgeUtil` pads it so it stays reachable by a selection. */
export function edgeGeometry(vertices: TPoint[], edge: TEdge): Polyline2d {
  const decorated = edge.startDecoration || edge.endDecoration
  return new Polyline2d(vertices, HIT_TOLERANCE + (decorated ? (edge.style.width || 1) * 2.5 : 0))
}

/** A decorator is found by its target's box, filled, in that box's own frame. */
export function decoratorGeometry(decorator: TDecorator): Polygon2d {
  const bounds = decorator.targetBounds
  return bounds ? new Polygon2d(OBBOps.toCorners(bounds), true, bounds.angle) : new Polygon2d([])
}

/** A typeset symbol is found by the box it was measured at, as an outline. */
export function typesetGeometry(symbol: TText | TMath): Polygon2d {
  return new Polygon2d(computeTypesetVertices(OBBOps.toUnrotatedBox(symbol.bounds)))
}

/** A menu item with nothing of its own: a button, for tests about where a menu puts its items */
export class StubMenuItem extends BaseMenuItem<HTMLButtonElement> {
  constructor(id: string, canvas: TInteractiveInkCanvas) {
    super({ id, type: "button" }, canvas)
  }
  createElement(): HTMLButtonElement {
    const button = document.createElement("button")
    button.id = this.config.id
    return button
  }
  update(): void {}
}
