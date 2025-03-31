import { IIShapeCircle, IIShapeEllipse, IIShapePolygon, ShapeKind, TIIShape } from "../../symbol"
import { DefaultStyle } from "../../style"
import { convertRadianToDegree } from "../../utils"
import { SVGRendererConst } from "./SVGRendererConst"
import { SVGBuilder } from "./SVGBuilder"

/**
 * @group Renderer
 */
export class SVGRendererShapeUtil
{
  static getPolygonePath(polygon: IIShapePolygon): string
  {
    return `M ${polygon.points[0].x} ${polygon.points[0].y} ${polygon.points.slice(1).map(p => `L ${p.x} ${p.y}`).join(" ")} Z`
  }

  static getCirclePath(circle: IIShapeCircle): string
  {
    return `M ${circle.center.x - circle.radius} ${circle.center.y} a ${circle.radius} ${circle.radius} 0 1 1 ${circle.radius * 2} 0 a ${circle.radius} ${circle.radius} 0 1 1 -${circle.radius * 2} 0 Z`
  }

  static getEllipsePath(ellipse: IIShapeEllipse): string
  {
    return `M ${ellipse.center.x - ellipse.radiusX} ${ellipse.center.y} a ${ellipse.radiusX} ${ellipse.radiusY} 0 1 1 ${ellipse.radiusX * 2} 0 a ${ellipse.radiusX} ${ellipse.radiusY} 0 1 1 -${ellipse.radiusX * 2} 0 Z`
  }

  static getSVGPath(shape: TIIShape): string
  {
    switch(shape.kind) {
      case ShapeKind.Polygon:
        return SVGRendererShapeUtil.getPolygonePath(shape as IIShapePolygon)
      case ShapeKind.Circle:
        return SVGRendererShapeUtil.getCirclePath(shape as IIShapeCircle)
      case ShapeKind.Ellipse:
        return SVGRendererShapeUtil.getEllipsePath(shape as IIShapeEllipse)
      default:
        throw new Error(`Can't getSVGPath for shape cause kind is unknow: "${ JSON.stringify(shape) }"`)
    }
  }

  static getSVGElement(shape: TIIShape): SVGGraphicsElement
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
      attrs["filter"] = `url(#${ SVGRendererConst.selectionFilterId })`
    }
    if (shape.deleting) {
      attrs["filter"] = `url(#${ SVGRendererConst.removalFilterId })`
    }

    const group = SVGBuilder.createGroup(attrs)

    const pathAttrs: { [key: string]: string } = {
      "fill": shape.style.fill || "transparent",
      "stroke": shape.style.color || DefaultStyle.color!,
      "stroke-width": (shape.style.width || DefaultStyle.width).toString(),
      "d": SVGRendererShapeUtil.getSVGPath(shape),
    }
    if (shape.style.opacity) {
      pathAttrs["opacity"] = shape.style.opacity.toString()
    }
    if (shape.kind === ShapeKind.Ellipse) {
      pathAttrs.transform = `rotate(${ convertRadianToDegree(shape.orientation) }, ${shape.center.x}, ${shape.center.y})`
    }

    group.appendChild(SVGBuilder.createPath(pathAttrs))

    return group
  }
}