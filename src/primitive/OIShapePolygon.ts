import { TStyle } from "../style"
import { TPoint, isValidPoint } from "./Point"
import { OIShapeBase, ShapeKind } from "./OIShape"
import { Box } from "./Box"
import { PartialDeep } from "../utils"

/**
 * @group Primitive
 */
export class OIShapePolygon extends OIShapeBase<ShapeKind.Polygon>
{
  points: TPoint[]

  constructor(points: TPoint[], style?: PartialDeep<TStyle>)
  {
    super(ShapeKind.Polygon, style)
    this.points = points
  }

  get vertices(): TPoint[]
  {
    return this.points
  }

  get bounds(): Box
  {
    return Box.createFromPoints(this.vertices)
  }

  clone(): OIShapePolygon
  {
    const clone = new OIShapePolygon(structuredClone(this.points), structuredClone(this.style))
    clone.id = this.id
    clone.selected = this.selected
    clone.deleting = this.deleting
    clone.creationTime = this.creationTime
    clone.modificationDate = this.modificationDate
    return clone
  }

  toJSON(): PartialDeep<OIShapePolygon>
  {
    return {
      id: this.id,
      type: this.type,
      kind: this.kind,
      points: this.points,
      style: this.style,
    }
  }

  static create(partial: PartialDeep<OIShapePolygon>): OIShapePolygon
  {
    if (!partial?.points || partial?.points?.length < 3) throw new Error(`Unable to create polygon at least 3 points required`)
    if (partial?.points?.some(p => !isValidPoint(p))) throw new Error(`Unable to create a polygon, one or more points are invalid`)
    return new OIShapePolygon(partial.points as TPoint[], partial.style)
  }

  static createTriangleBetweenPoints(origin: TPoint, target: TPoint, style?: PartialDeep<TStyle>): OIShapePolygon
  {
    const points: TPoint[] = [
      { x: origin.x, y: origin.y },
      { x: target.x, y: origin.y },
      { x: (origin.x + target.x) / 2, y: target.y }
    ]
    return new OIShapePolygon(points, style)
  }
  static updateTriangleBetweenPoints(poly: OIShapePolygon, origin: TPoint, target: TPoint): OIShapePolygon
  {
    poly.points = [
      { x: origin.x, y: origin.y },
      { x: target.x, y: origin.y },
      { x: (origin.x + target.x) / 2, y: target.y }
    ]
    poly.modificationDate = Date.now()
    return poly
  }

  static createParallelogramBetweenPoints(origin: TPoint, target: TPoint, style?: PartialDeep<TStyle>): OIShapePolygon
  {
    const points: TPoint[] = [
      { x: origin.x, y: origin.y },
      { x: origin.x + (target.x - origin.x) * 0.75, y: origin.y },
      { x: target.x, y: target.y },
      { x: origin.x + (target.x - origin.x) * 0.25, y: target.y },
    ]
    return new OIShapePolygon(points, style)
  }
  static updateParallelogramBetweenPoints(poly: OIShapePolygon, origin: TPoint, target: TPoint): OIShapePolygon
  {
    const points: TPoint[] = [
      { x: origin.x, y: origin.y },
      { x: origin.x + (target.x - origin.x) * 0.75, y: origin.y },
      { x: target.x, y: target.y },
      { x: origin.x + (target.x - origin.x) * 0.25, y: target.y },
    ]
    poly.points = points
    poly.modificationDate = Date.now()
    return poly
  }

  static createRectangleBetweenPoints(origin: TPoint, target: TPoint, style?: PartialDeep<TStyle>): OIShapePolygon
  {
    const box = Box.createFromPoints([origin, target])
    const points: TPoint[] = [
      { x: box.xMin, y: box.yMin },
      { x: box.xMax, y: box.yMin },
      { x: box.xMax, y: box.yMax },
      { x: box.xMin, y: box.yMax },
    ]
    return new OIShapePolygon(points, style)
  }
  static updateRectangleBetweenPoints(poly: OIShapePolygon, origin: TPoint, target: TPoint): OIShapePolygon
  {
    const box = Box.createFromPoints([origin, target])
    const points: TPoint[] = [
      { x: box.xMin, y: box.yMin },
      { x: box.xMax, y: box.yMin },
      { x: box.xMax, y: box.yMax },
      { x: box.xMin, y: box.yMax },
    ]
    poly.points = points
    poly.modificationDate = Date.now()
    return poly
  }

  static createRhombusBetweenPoints(origin: TPoint, target: TPoint, style?: PartialDeep<TStyle>): OIShapePolygon
  {
    const box = Box.createFromPoints([origin, target])
    const points: TPoint[] = [
      { x: box.xMid, y: box.yMin },
      { x: box.xMax, y: box.yMid },
      { x: box.xMid, y: box.yMax },
      { x: box.xMin, y: box.yMid },
    ]
    return new OIShapePolygon(points, style)
  }

  static updateRhombusBetweenPoints(poly: OIShapePolygon, origin: TPoint, target: TPoint): OIShapePolygon
  {
    const box = Box.createFromPoints([origin, target])
    const points: TPoint[] = [
      { x: box.xMid, y: box.yMin },
      { x: box.xMax, y: box.yMid },
      { x: box.xMid, y: box.yMax },
      { x: box.xMin, y: box.yMid },
    ]
    poly.points = points
    poly.modificationDate = Date.now()
    return poly
  }
}
