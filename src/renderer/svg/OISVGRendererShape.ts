import { OIShapeCircle, OIShapePolygon, OIShapeRectangle, ShapeKind, TOIShape } from "../../primitive"
import { DefaultStyle } from "../../style"
import { createPath } from "./SVGElementBuilder"

export class OISVGRendererShape
{
  selectionFilterId: string

  constructor(selectionFilterId: string)
  {
    this.selectionFilterId = selectionFilterId
  }

  getPolygonePath(polygon: OIShapePolygon): string
  {
    return `M ${polygon.points[0].x} ${polygon.points[0].y} ${polygon.points.slice(1).map(p => `L ${p.x} ${p.y}`).join(" ")} Z`
  }

  getRectanglePath(rect: OIShapeRectangle): string
  {
    return `M ${rect.x} ${rect.y} h ${rect.width} v ${rect.height} h -${rect.width} Z`
  }

  getCirclePath(circle: OIShapeCircle): string
  {
    return `M ${circle.center.x} ${circle.center.y} m ${circle.radius} 0 a ${circle.radius} ${circle.radius} 0 1 0 -${circle.radius * 2} 0 a ${circle.radius} ${circle.radius} 0 1 0 ${circle.radius * 2} 0 Z`
  }

  getSVGPath(shape: TOIShape): string
  {
    switch(shape.kind) {
      case ShapeKind.Parallelogram:
      case ShapeKind.Triangle:
        return this.getPolygonePath(shape as OIShapePolygon)
      case ShapeKind.Rectangle:
        return this.getRectanglePath(shape as OIShapeRectangle)
      case ShapeKind.Circle:
        return this.getCirclePath(shape as OIShapeCircle)
      default:
        throw new Error(`Can't getSVGPath for shape cause kind is unknow: "${shape.kind}"`)
    }
  }

  getSVGElement(shape: TOIShape): SVGPathElement
  {

    const attrs: { [key: string]: string } = {
      "id": shape.id,
      "type": shape.type,
      "kind": shape.kind,
      "vector-effect": "non-scaling-stroke",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
      "fill": "transparent",
      "stroke": shape.style.color || DefaultStyle.color!,
      "stroke-width": (shape.style.width || DefaultStyle.width!).toString(),
      "d": this.getSVGPath(shape),
    }

    if (shape.selected) {
      attrs["filter"] = `url(#${ this.selectionFilterId })`
    }

    return createPath(attrs)
  }

}
