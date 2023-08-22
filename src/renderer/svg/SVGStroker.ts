import { TPointer } from "../../@types/geometry"
import { TStroke } from "../../@types/model/Stroke"
import { computeAxeAngle, computeLinksPoints, computeMiddlePoint } from "../QuadraticUtils"

export class SVGStroker
{

  private getArcPath(center: TPointer, radius: number): string
  {
    const svgPath = [
      `M ${ center.x },${ center.y }`,
      `m ${ -radius },0`,
      `a ${ radius },${ radius } 0 1 0 ${ radius * 2 },0`,
      `a ${ radius },${ radius } 0 1 0 ${ -(radius * 2) },0`
    ].join(" ")
    return svgPath
  }

  private getLinePath(begin: TPointer, end: TPointer, width: number): string
  {
    const linkPoints1 = computeLinksPoints(begin, computeAxeAngle(begin, end), width)
    const linkPoints2 = computeLinksPoints(end, computeAxeAngle(begin, end), width)
    const svgPath = [
      `M ${ linkPoints1[0].x },${ linkPoints1[0].y }`,
      `L ${ linkPoints2[0].x },${ linkPoints2[0].y }`,
      `L ${ linkPoints2[1].x },${ linkPoints2[1].y }`,
      `L ${ linkPoints1[1].x },${ linkPoints1[1].y }`
    ].join(" ")
    return svgPath
  }

  private getFinalPath(begin: TPointer, end: TPointer, width: number): string
  {
    const ARCSPLIT = 6
    const angle = computeAxeAngle(begin, end)
    const linkPoints = computeLinksPoints(end, angle, width)
    const parts = [`M ${ linkPoints[0].x },${ linkPoints[0].y }`]
    for (let i = 1; i <= ARCSPLIT; i++) {
      const newAngle = angle - (i * (Math.PI / ARCSPLIT))
      parts.push(`L ${ end.x - (end.p * width * Math.sin(newAngle)) },${ end.y + (end.p * width * Math.cos(newAngle)) }`)
    }
    const svgPath = parts.join(" ")
    return svgPath
  }

  private getQuadraticPath(begin: TPointer, end: TPointer, central: TPointer, width: number): string
  {
    const linkPoints1 = computeLinksPoints(begin, computeAxeAngle(begin, central), width)
    const linkPoints2 = computeLinksPoints(end, computeAxeAngle(central, end), width)
    const linkPoints3 = computeLinksPoints(central, computeAxeAngle(begin, end), width)
    const svgPath = [
      `M ${ linkPoints1[0].x },${ linkPoints1[0].y }`,
      `Q ${ linkPoints3[0].x },${ linkPoints3[0].y } ${ linkPoints2[0].x },${ linkPoints2[0].y }`,
      `L ${ linkPoints2[1].x },${ linkPoints2[1].y }`,
      `Q ${ linkPoints3[1].x },${ linkPoints3[1].y } ${ linkPoints1[1].x },${ linkPoints1[1].y }`
    ].join(" ")
    return svgPath
  }

  private buildSVGPath(stroke: TStroke): string
  {
    const STROKE_LENGTH = stroke.pointers.length
    const STROKE_WIDTH = (stroke.style.width as number)
    const NB_QUADRATICS = STROKE_LENGTH - 2
    const firstPoint = stroke.pointers[0]

    const parts = []
    if (STROKE_LENGTH < 3) {
      parts.push(this.getArcPath(firstPoint, STROKE_WIDTH * 0.6))
    } else {
      parts.push(this.getArcPath(firstPoint, STROKE_WIDTH * firstPoint.p))
      parts.push(this.getLinePath(firstPoint, computeMiddlePoint(firstPoint, stroke.pointers[1]), STROKE_WIDTH))

      for (let i = 0; i < NB_QUADRATICS; i++) {
        const begin = computeMiddlePoint(stroke.pointers[i], stroke.pointers[i + 1])
        const end = computeMiddlePoint(stroke.pointers[i + 1], stroke.pointers[i + 2])
        const central = stroke.pointers[i + 1]
        parts.push(this.getQuadraticPath(begin, end, central, STROKE_WIDTH)
        )
      }
      const beforeLastPoint = stroke.pointers[STROKE_LENGTH - 2]
      const lastPoint = stroke.pointers[STROKE_LENGTH - 1]
      parts.push(this.getLinePath(computeMiddlePoint(beforeLastPoint, lastPoint), lastPoint, STROKE_WIDTH))
      parts.push(this.getFinalPath(beforeLastPoint, lastPoint, STROKE_WIDTH))
    }
    return parts.join(" ")
  }

  drawStroke(svgElement: SVGElement, stroke: TStroke, attrs?: { name: string, value: string }[]): void
  {
    const svgPathElement = document.createElementNS("http://www.w3.org/2000/svg", "path")
    svgPathElement.classList.add("pending-stroke")
    svgPathElement.setAttribute("id", stroke.id)
    svgPathElement.setAttribute("type", "stroke")
    attrs?.forEach(a =>
    {
      svgPathElement.setAttribute(a.name, a.value)
    })
    const svgPath = this.buildSVGPath(stroke)
    svgPathElement.setAttribute("d", `${ svgPath }Z`)
    svgElement.appendChild(svgPathElement)
  }
}