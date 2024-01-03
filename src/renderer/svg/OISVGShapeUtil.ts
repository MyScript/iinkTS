import { OIShapeCircle, OIShapePolygon, ShapeKind, TOIShape } from "../../primitive"
import { DefaultStyle } from "../../style"
import { MatrixTransform } from "../../transform"
import { createPath } from "./SVGElementBuilder"

/**
 * @group Renderer
 */
export class OISVGShapeUtil
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

  getCirclePath(circle: OIShapeCircle): string
  {
    return `M ${circle.center.x - circle.radius} ${circle.center.y} a ${circle.radius} ${circle.radius} 0 1 1 ${circle.radius * 2} 0 a ${circle.radius} ${circle.radius} 0 1 1 -${circle.radius * 2} 0 Z`
  }

  getSVGPath(shape: TOIShape): string
  {
    switch(shape.kind) {
      case ShapeKind.Parallelogram:
      case ShapeKind.Triangle:
      case ShapeKind.Rectangle:
        return this.getPolygonePath(shape as OIShapePolygon)
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
      "opacity": (shape.style.opacity || DefaultStyle.opacity!).toString(),
      "transform": MatrixTransform.toCssString(shape.transform),
      "d": this.getSVGPath(shape),
    }

    if (shape.selected) {
      attrs["filter"] = `url(#${ this.selectionFilterId })`
    }

    return createPath(attrs)
  }

}
