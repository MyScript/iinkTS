import { OIShapeCircle, OIShapeEllipse, OIShapePolygon, ShapeKind, TOIShape } from "../../primitive"
import { DefaultStyle } from "../../style"
import { OISVGRendererConst } from "./OISVGRendererConst"
import { SVGBuilder } from "./SVGBuilder"

/**
 * @group Renderer
 */
export class OISVGRendererShapeUtil
{
  static getPolygonePath(polygon: OIShapePolygon): string
  {
    return `M ${polygon.points[0].x} ${polygon.points[0].y} ${polygon.points.slice(1).map(p => `L ${p.x} ${p.y}`).join(" ")} Z`
  }

  static getCirclePath(circle: OIShapeCircle): string
  {
    return `M ${circle.center.x - circle.radius} ${circle.center.y} a ${circle.radius} ${circle.radius} 0 1 1 ${circle.radius * 2} 0 a ${circle.radius} ${circle.radius} 0 1 1 -${circle.radius * 2} 0 Z`
  }

  static getEllipsePath(ellipse: OIShapeEllipse): string
  {
    return `M ${ellipse.center.x - ellipse.radiusX} ${ellipse.center.y} a ${ellipse.radiusX} ${ellipse.radiusY} 0 1 1 ${ellipse.radiusX * 2} 0 a ${ellipse.radiusX} ${ellipse.radiusY} 0 1 1 -${ellipse.radiusX * 2} 0 Z`
  }

  static getSVGPath(shape: TOIShape): string
  {
    switch(shape.kind) {
      case ShapeKind.Polygon:
        return OISVGRendererShapeUtil.getPolygonePath(shape as OIShapePolygon)
      case ShapeKind.Circle:
        return OISVGRendererShapeUtil.getCirclePath(shape as OIShapeCircle)
      case ShapeKind.Ellipse:
        return OISVGRendererShapeUtil.getEllipsePath(shape as OIShapeEllipse)
      default:
        throw new Error(`Can't getSVGPath for shape cause kind is unknow: "${ JSON.stringify(shape) }"`)
    }
  }

  static getSVGElement(shape: TOIShape): SVGGraphicsElement
  {
    const attrs: { [key: string]: string } = {
      "id": shape.id,
      "type": shape.type,
      "kind": shape.kind,
      "vector-effect": "non-scaling-stroke",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
    }
    if (shape.selected) {
      attrs["filter"] = `url(#${ OISVGRendererConst.selectionFilterId })`
    }
    if (shape.deleting) {
      attrs["filter"] = `url(#${ OISVGRendererConst.removalFilterId })`
    }

    const group = SVGBuilder.createGroup(attrs)

    const pathAttrs: { [key: string]: string } = {
      "fill": shape.style.fill || "transparent",
      "stroke": shape.style.color || DefaultStyle.color!,
      "stroke-width": (shape.style.width || DefaultStyle.width!).toString(),
      "opacity": (shape.style.opacity || DefaultStyle.opacity!).toString(),
      "d": OISVGRendererShapeUtil.getSVGPath(shape),
    }

    group.appendChild(SVGBuilder.createPath(pathAttrs))

    return group
  }
}
