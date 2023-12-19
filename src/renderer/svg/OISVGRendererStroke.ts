import { OIStroke, TPointer } from "../../primitive"

export class OISVGRendererStroke
{
  getSVGPath(stroke: OIStroke): string
  {
    if (stroke.pointers.length < 2) return ""

    const firstPoint = stroke.pointers.at(0) as TPointer
    const middlePoints = stroke.pointers.slice(1)

    const startPathMoveTo = `M ${ firstPoint.x } ${ firstPoint.y }`

    const middlePathQuadratic = middlePoints.reduce((acc, point) => {
      return `${ acc } ${ point.x } ${ point.y }`
    }, "Q")

    return `${ startPathMoveTo } ${ middlePathQuadratic }`
  }

  getSVGElement(stroke: OIStroke): SVGPathElement
  {
    const el = document.createElementNS("http://www.w3.org/2000/svg", "path")
    el.setAttribute("id", stroke.id)
    el.setAttribute("type", "stroke")
    el.setAttribute("vector-effect", "non-scaling-stroke")
    el.setAttribute("stroke-linecap", "round")
    el.setAttribute("stroke-linejoin", "round")
    el.setAttribute("fill", "transparent")

    if (stroke.pointerType === "eraser") {
      el.setAttribute("stroke-width", "20")
      el.setAttribute("stroke", "grey")
      el.setAttribute("opacity", "0.2")
      el.setAttribute("shadowBlur", "5")
    }
    else {
      el.setAttribute("stroke", stroke.style.color || "black")
      el.setAttribute("stroke-width", stroke.style.width?.toString() || "1")
    }
    el.setAttribute("d", `${ this.getSVGPath(stroke) }`)
    return el
  }

}
