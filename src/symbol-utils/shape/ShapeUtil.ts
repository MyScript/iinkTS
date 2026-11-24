import type { TPartialDeep, TPoint } from "@/core"
import {
  BoxOps,
  Circle2d,
  computeDistance,
  convertRadianToDegree,
  createUUID,
  Ellipse2d,
  type Geometry2d,
  isValidNumber,
  isValidPoint,
  MatrixTransform,
  mergeSymbolTransform,
  OBBOps,
  Polygon2d,
} from "@/core"
import { DefaultStyle, mergeSymbolStyle, type TStyle } from "@/style"
import type { TShape } from "@/symbol"
import {
  ShapeKind,
  SymbolType,
  type TBaseSymbol,
  type TShapeCircle,
  type TShapeEllipse,
  type TShapePolygon,
} from "@/symbol"

import { defineKind, resolveKind, type TKindDefinition } from "../KindDefinition"
import { PathSymbolUtil } from "../PathSymbolUtil"
import { SymbolGeometry } from "../SymbolGeometry"

/**
 * The shape kinds this util can build, and how.
 *
 * Adding a kind is adding an entry: there is no `switch` to find and extend in four places, and the
 * type makes it impossible to supply `create` and forget `overlaps`.
 *
 * `ShapeKind.Table` is absent on purpose — it is declared in the enum with no implementation behind
 * it, so it resolves like any unknown kind rather than like a shape that half works.
 */
/**
 * Whether a shape's style paints its inside, and so whether a query landing wholly within it — and
 * touching no edge — selects it.
 *
 * Unpainted is the default everywhere: `getSVGElement` writes `shape.style.fill || "transparent"`,
 * and the theme's own default is `#FFFFFF00`. Both are "no fill" spelled differently, so both have
 * to be read as one.
 */
function isFilledStyle(shape: TShape): boolean {
  const fill = shape.style.fill?.trim().toLowerCase()
  return !!fill && fill !== "transparent" && fill !== "none" && !/^#[0-9a-f]{6}00$/.test(fill)
}

const SHAPE_KINDS: Partial<Record<ShapeKind, TKindDefinition<TShape>>> = {
  [ShapeKind.Circle]: defineKind<TShape, TShapeCircle>({
    create: (partial) => ShapeUtil.createCircleFromPartial(partial),
    getGeometry: (shape) => new Circle2d(shape.center, shape.radius, isFilledStyle(shape)),
    getSVGPath: (shape) => ShapeUtil.getCirclePath(shape),
    keepsAspectRatio: true,
  }),
  [ShapeKind.Ellipse]: defineKind<TShape, TShapeEllipse>({
    create: (partial) => ShapeUtil.createEllipseFromPartial(partial),
    getGeometry: (shape) =>
      Ellipse2d.fromRadii(shape.center, shape.radiusX, shape.radiusY, shape.orientation, isFilledStyle(shape)),
    getSVGPath: (shape) => ShapeUtil.getEllipsePath(shape),
    // The ellipse is the only kind whose path needs orienting, and this is where that used to live
    // as an `if (shape.kind === ShapeKind.Ellipse)` inside the shared `getSVGElement`.
    extraPathAttributes: (shape) => ({
      transform: `rotate(${convertRadianToDegree(shape.orientation)}, ${shape.center.x}, ${shape.center.y})`,
    }),
  }),
  [ShapeKind.Polygon]: defineKind<TShape, TShapePolygon>({
    create: (partial) => ShapeUtil.createPolygonFromPartial(partial),
    getGeometry: (shape) => new Polygon2d(shape.points, isFilledStyle(shape)),
    getSVGPath: (shape) => ShapeUtil.getPolygonPath(shape),
  }),
}

/**
 * @group SymbolUtils
 */
export class ShapeUtil extends PathSymbolUtil<TShape> {
  readonly type = SymbolType.Shape

  create(partial: TPartialDeep<TShape>): TShape {
    return resolveKind(SHAPE_KINDS, partial.kind, "shape", "create").create(partial)
  }

  /**
   * An unregistered kind gets an empty polygon: no vertices, no edges, an empty box at the origin,
   * and so no overlap with anything. Same answer the record fallback gave, said once instead of
   * field by field.
   */
  getGeometry(shape: TShape): Geometry2d {
    return SHAPE_KINDS[shape.kind]?.getGeometry(shape) ?? new Polygon2d([])
  }

  /**
   * A shape snaps on its box — corners, mid-sides and centre — whatever its outline looks like.
   *
   * None at all for a kind the table does not own: its box is an empty one at the origin, and
   * offering nine snap points there would pull anything nearby to the corner of the page.
   */
  getSnapPoints(shape: TShape): TPoint[] {
    return SHAPE_KINDS[shape.kind] ? OBBOps.getSnapPoints(SymbolGeometry.of(shape).bounds) : []
  }

  keepsAspectRatio(shape: TShape): boolean {
    return SHAPE_KINDS[shape.kind]?.keepsAspectRatio ?? false
  }

  static getSVGPath(shape: TShape): string {
    return resolveKind(SHAPE_KINDS, shape.kind, "shape", "getSVGPath for").getSVGPath(shape)
  }

  /** Which of the three kinds it is, on top of what every symbol's group carries. */
  protected override getGroupAttributes(shape: TShape): Record<string, string> {
    return { ...super.getGroupAttributes(shape), kind: shape.kind }
  }

  protected getPathData(shape: TShape): string {
    return resolveKind(SHAPE_KINDS, shape.kind, "shape", "getSVGElement for").getSVGPath(shape)
  }

  /** Stroked *and* filled, the fill coming from the style — the only family that paints both. */
  protected getPathAttributes(shape: TShape): Record<string, string> {
    const definition = resolveKind(SHAPE_KINDS, shape.kind, "shape", "getSVGElement for")
    const attributes: Record<string, string> = {
      fill: shape.style.fill || "transparent",
      stroke: shape.style.color || DefaultStyle.color!,
      "stroke-width": (shape.style.width || DefaultStyle.width).toString(),
      ...definition.extraPathAttributes?.(shape),
    }
    if (shape.style.opacity) {
      attributes.opacity = shape.style.opacity.toString()
    }
    return attributes
  }

  static createCircle(center: TPoint, radius: number, style?: TPartialDeep<TStyle>): TShapeCircle {
    const mergedStyle = mergeSymbolStyle(style)
    const now = Date.now()
    const circle: TShapeCircle = {
      type: SymbolType.Shape,
      kind: ShapeKind.Circle,
      id: `${SymbolType.Shape}-${createUUID()}`,
      style: mergedStyle,
      creationTime: now,
      modificationDate: now,
      center,
      radius,
      transform: MatrixTransform.identity(),
    }
    return circle
  }

  static createCircleFromPartial(partial: TPartialDeep<TShapeCircle>): TShapeCircle {
    if (!isValidPoint(partial.center)) {
      throw new Error(`Unable to create circle, center is invalid`)
    }
    if (!isValidNumber(partial.radius)) {
      throw new Error(`Unable to create circle, radius is undefined`)
    }
    const circle = ShapeUtil.createCircle(partial.center as TPoint, partial.radius!, partial.style)
    if (partial.id) {
      circle.id = partial.id
    }
    circle.transform = mergeSymbolTransform(partial.transform)
    return circle
  }

  static createCircleBetweenPoints(origin: TPoint, target: TPoint, style?: TPartialDeep<TStyle>): TShapeCircle {
    const circle = ShapeUtil.createCircle(origin, 0, style)
    circle.radius = computeDistance(circle.center, target)
    return circle
  }

  static updateCircleBetweenPoints(circle: TShapeCircle, _origin: TPoint, target: TPoint): void {
    circle.radius = computeDistance(circle.center, target)
  }

  static getCirclePath(circle: TShapeCircle): string {
    return `M ${circle.center.x - circle.radius} ${circle.center.y} a ${circle.radius} ${circle.radius} 0 1 1 ${circle.radius * 2} 0 a ${circle.radius} ${circle.radius} 0 1 1 -${circle.radius * 2} 0 Z`
  }

  static createEllipse(
    center: TPoint,
    radiusX: number,
    radiusY: number,
    orientation: number,
    style?: TPartialDeep<TStyle>
  ): TShapeEllipse {
    const mergedStyle = mergeSymbolStyle(style)
    const now = Date.now()
    const ellipse: TShapeEllipse = {
      type: SymbolType.Shape,
      kind: ShapeKind.Ellipse,
      id: `${SymbolType.Shape}-${createUUID()}`,
      style: mergedStyle,
      creationTime: now,
      modificationDate: now,
      center,
      radiusX,
      radiusY,
      orientation,
      transform: MatrixTransform.identity(),
    }
    return ellipse
  }

  static createEllipseFromPartial(partial: TPartialDeep<TShapeEllipse>): TShapeEllipse {
    if (!isValidPoint(partial.center)) {
      throw new Error(`Unable to create ellipse, center is undefined`)
    }
    if (!isValidNumber(partial.radiusX)) {
      throw new Error(`Unable to create ellipse, radiusX is undefined`)
    }
    if (!isValidNumber(partial.radiusY)) {
      throw new Error(`Unable to create ellipse, radiusY is undefined`)
    }
    const ellipse = ShapeUtil.createEllipse(
      partial.center as TPoint,
      partial.radiusX!,
      partial.radiusY!,
      partial.orientation || 0,
      partial.style
    )
    if (partial.id) {
      ellipse.id = partial.id
    }
    ellipse.transform = mergeSymbolTransform(partial.transform)
    return ellipse
  }

  static createEllipseBetweenPoints(origin: TPoint, target: TPoint, style?: TPartialDeep<TStyle>): TShapeEllipse {
    const center = {
      x: (origin.x + target.x) / 2,
      y: (origin.y + target.y) / 2,
    }
    const radiusX = Math.abs(origin.x - target.x) / 2
    const radiusY = Math.abs(origin.y - target.y) / 2
    return ShapeUtil.createEllipse(center, radiusX, radiusY, 0, style)
  }

  static updateEllipseBetweenPoints(ellipse: TShapeEllipse, origin: TPoint, target: TPoint): void {
    ellipse.center = {
      x: (origin.x + target.x) / 2,
      y: (origin.y + target.y) / 2,
    }
    ellipse.radiusX = Math.abs(origin.x - target.x) / 2
    ellipse.radiusY = Math.abs(origin.y - target.y) / 2
  }

  static getEllipsePath(ellipse: TShapeEllipse): string {
    return `M ${ellipse.center.x - ellipse.radiusX} ${ellipse.center.y} a ${ellipse.radiusX} ${ellipse.radiusY} 0 1 1 ${ellipse.radiusX * 2} 0 a ${ellipse.radiusX} ${ellipse.radiusY} 0 1 1 -${ellipse.radiusX * 2} 0 Z`
  }

  static createPolygon(points: TPoint[], style?: TPartialDeep<TStyle>): TShapePolygon {
    const mergedStyle = mergeSymbolStyle(style)
    const now = Date.now()
    const polygon: TShapePolygon = {
      type: SymbolType.Shape,
      kind: ShapeKind.Polygon,
      id: `${SymbolType.Shape}-${createUUID()}`,
      style: mergedStyle,
      creationTime: now,
      modificationDate: now,
      points,
      transform: MatrixTransform.identity(),
    }
    return polygon
  }

  static createPolygonFromPartial(partial: TPartialDeep<TShapePolygon>): TShapePolygon {
    if (!partial?.points || partial?.points?.length < 3) {
      throw new Error(`Unable to create polygon at least 3 points required`)
    }
    if (partial?.points?.some((p) => !isValidPoint(p))) {
      throw new Error(`Unable to create a polygon, one or more points are invalid`)
    }
    const polygon = ShapeUtil.createPolygon(partial.points as TPoint[], partial.style)
    if (partial.id) {
      polygon.id = partial.id
    }
    polygon.transform = mergeSymbolTransform(partial.transform)
    return polygon
  }

  static createTriangleBetweenPoints(origin: TPoint, target: TPoint, style?: TPartialDeep<TStyle>): TShapePolygon {
    const points: TPoint[] = [
      { x: origin.x, y: origin.y },
      { x: target.x, y: origin.y },
      {
        x: (origin.x + target.x) / 2,
        y: target.y,
      },
    ]
    return ShapeUtil.createPolygon(points, style)
  }

  static updateTriangleBetweenPoints(poly: TShapePolygon, origin: TPoint, target: TPoint): void {
    poly.points = [
      { x: origin.x, y: origin.y },
      { x: target.x, y: origin.y },
      {
        x: (origin.x + target.x) / 2,
        y: target.y,
      },
    ]
    poly.modificationDate = Date.now()
  }

  static createParallelogramBetweenPoints(origin: TPoint, target: TPoint, style?: TPartialDeep<TStyle>): TShapePolygon {
    const points: TPoint[] = [
      { x: origin.x, y: origin.y },
      {
        x: origin.x + (target.x - origin.x) * 0.75,
        y: origin.y,
      },
      { x: target.x, y: target.y },
      {
        x: origin.x + (target.x - origin.x) * 0.25,
        y: target.y,
      },
    ]
    return ShapeUtil.createPolygon(points, style)
  }

  static updateParallelogramBetweenPoints(poly: TShapePolygon, origin: TPoint, target: TPoint): void {
    poly.points = [
      { x: origin.x, y: origin.y },
      {
        x: origin.x + (target.x - origin.x) * 0.75,
        y: origin.y,
      },
      { x: target.x, y: target.y },
      {
        x: origin.x + (target.x - origin.x) * 0.25,
        y: target.y,
      },
    ]
    poly.modificationDate = Date.now()
  }

  static createRectangleBetweenPoints(origin: TPoint, target: TPoint, style?: TPartialDeep<TStyle>): TShapePolygon {
    const box = BoxOps.createFromPoints([origin, target])
    const points: TPoint[] = [
      { x: box.x, y: box.y },
      { x: box.x + box.width, y: box.y },
      {
        x: box.x + box.width,
        y: box.y + box.height,
      },
      { x: box.x, y: box.y + box.height },
    ]
    return ShapeUtil.createPolygon(points, style)
  }

  static updateRectangleBetweenPoints(poly: TShapePolygon, origin: TPoint, target: TPoint): void {
    const box = BoxOps.createFromPoints([origin, target])
    poly.points = [
      { x: box.x, y: box.y },
      { x: box.x + box.width, y: box.y },
      {
        x: box.x + box.width,
        y: box.y + box.height,
      },
      { x: box.x, y: box.y + box.height },
    ]
    poly.modificationDate = Date.now()
  }

  static createRhombusBetweenPoints(origin: TPoint, target: TPoint, style?: TPartialDeep<TStyle>): TShapePolygon {
    const box = BoxOps.createFromPoints([origin, target])
    const points: TPoint[] = [
      { x: box.x + box.width / 2, y: box.y },
      {
        x: box.x + box.width,
        y: box.y + box.height / 2,
      },
      {
        x: box.x + box.width / 2,
        y: box.y + box.height,
      },
      { x: box.x, y: box.y + box.height / 2 },
    ]
    return ShapeUtil.createPolygon(points, style)
  }

  static updateRhombusBetweenPoints(poly: TShapePolygon, origin: TPoint, target: TPoint): void {
    const box = BoxOps.createFromPoints([origin, target])
    poly.points = [
      { x: box.x + box.width / 2, y: box.y },
      {
        x: box.x + box.width,
        y: box.y + box.height / 2,
      },
      {
        x: box.x + box.width / 2,
        y: box.y + box.height,
      },
      { x: box.x, y: box.y + box.height / 2 },
    ]
    poly.modificationDate = Date.now()
  }

  static getPolygonPath(polygon: TShapePolygon): string {
    let path = `M ${polygon.points[0].x} ${polygon.points[0].y}`
    for (let i = 1; i < polygon.points.length; i++) {
      path += ` L ${polygon.points[i].x} ${polygon.points[i].y}`
    }
    return path + " Z"
  }

  /**
   * @group Symbol
   * @summary Check if symbol is a shape (circle, ellipse, polygon)
   * @param symbol - Symbol to check
   * @returns True if symbol is a shape
   */
  static isShape(symbol: TBaseSymbol): symbol is TShape {
    return symbol.type === SymbolType.Shape
  }

  /**
   * @group Symbol
   * @summary Type guard to check if a shape is a circle
   * @param shape - The shape to check
   * @returns True if the shape is a circle
   */
  static isCircleShape(shape: TBaseSymbol): shape is TShapeCircle {
    return ShapeUtil.isShape(shape) && shape.kind === ShapeKind.Circle
  }

  /**
   * @group Symbol
   * @summary Type guard to check if a shape is an ellipse
   * @param shape - The shape to check
   * @returns True if the shape is an ellipse
   */
  static isEllipseShape(shape: TBaseSymbol): shape is TShapeEllipse {
    return ShapeUtil.isShape(shape) && shape.kind === ShapeKind.Ellipse
  }

  /**
   * @group Symbol
   * @summary Type guard to check if a shape is a polygon
   * @param shape - The shape to check
   * @returns True if the shape is a polygon
   */
  static isPolygonShape(shape: TBaseSymbol): shape is TShapePolygon {
    return ShapeUtil.isShape(shape) && shape.kind === ShapeKind.Polygon
  }
}
