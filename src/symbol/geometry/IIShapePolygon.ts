import { TStyle } from "../../style"
import { TPoint, isValidPoint } from "../Point"
import { OIShapeBase, ShapeKind } from "./IIShape"
import { Box } from "../Box"
import { PartialDeep } from "../../utils"

/**
 * @group Symbol
 */
export class IIShapePolygon extends OIShapeBase<ShapeKind.Polygon>
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

  clone(): IIShapePolygon
  {
    const clone = new IIShapePolygon(structuredClone(this.points), structuredClone(this.style))
    clone.id = this.id
    clone.selected = this.selected
    clone.deleting = this.deleting
    clone.creationTime = this.creationTime
    clone.modificationDate = this.modificationDate
    return clone
  }

  toJSON(): PartialDeep<IIShapePolygon>
  {
    return {
      id: this.id,
      type: this.type,
      kind: this.kind,
      points: this.points,
      style: this.style,
    }
  }

  static create(partial: PartialDeep<IIShapePolygon>): IIShapePolygon
  {
    if (!partial?.points || partial?.points?.length < 3) throw new Error(`Unable to create polygon at least 3 points required`)
    if (partial?.points?.some(p => !isValidPoint(p))) throw new Error(`Unable to create a polygon, one or more points are invalid`)
    const polygon = new IIShapePolygon(partial.points as TPoint[], partial.style)
    if (partial.id) {
      polygon.id = partial.id
    }
    return polygon
  }

  static createTriangleBetweenPoints(origin: TPoint, target: TPoint, style?: PartialDeep<TStyle>): IIShapePolygon
  {
    const points: TPoint[] = [
      { x: origin.x, y: origin.y },
      { x: target.x, y: origin.y },
      { x: (origin.x + target.x) / 2, y: target.y }
    ]
    return new IIShapePolygon(points, style)
  }
  static updateTriangleBetweenPoints(poly: IIShapePolygon, origin: TPoint, target: TPoint): IIShapePolygon
  {
    poly.points = [
      { x: origin.x, y: origin.y },
      { x: target.x, y: origin.y },
      { x: (origin.x + target.x) / 2, y: target.y }
    ]
    poly.modificationDate = Date.now()
    return poly
  }

  static createParallelogramBetweenPoints(origin: TPoint, target: TPoint, style?: PartialDeep<TStyle>): IIShapePolygon
  {
    const points: TPoint[] = [
      { x: origin.x, y: origin.y },
      { x: origin.x + (target.x - origin.x) * 0.75, y: origin.y },
      { x: target.x, y: target.y },
      { x: origin.x + (target.x - origin.x) * 0.25, y: target.y },
    ]
    return new IIShapePolygon(points, style)
  }
  static updateParallelogramBetweenPoints(poly: IIShapePolygon, origin: TPoint, target: TPoint): IIShapePolygon
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

  static createRectangleBetweenPoints(origin: TPoint, target: TPoint, style?: PartialDeep<TStyle>): IIShapePolygon
  {
    const box = Box.createFromPoints([origin, target])
    const points: TPoint[] = [
      { x: box.xMin, y: box.yMin },
      { x: box.xMax, y: box.yMin },
      { x: box.xMax, y: box.yMax },
      { x: box.xMin, y: box.yMax },
    ]
    return new IIShapePolygon(points, style)
  }
  static updateRectangleBetweenPoints(poly: IIShapePolygon, origin: TPoint, target: TPoint): IIShapePolygon
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

  static createRhombusBetweenPoints(origin: TPoint, target: TPoint, style?: PartialDeep<TStyle>): IIShapePolygon
  {
    const box = Box.createFromPoints([origin, target])
    const points: TPoint[] = [
      { x: box.xMid, y: box.yMin },
      { x: box.xMax, y: box.yMid },
      { x: box.xMid, y: box.yMax },
      { x: box.xMin, y: box.yMid },
    ]
    return new IIShapePolygon(points, style)
  }

  static updateRhombusBetweenPoints(poly: IIShapePolygon, origin: TPoint, target: TPoint): IIShapePolygon
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
