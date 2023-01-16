import { TPoint } from "../../@types/renderer/Point"
import { TStroke } from "../../@types/model/Stroke"
import { computeAxeAngle, computeLinksPoints, computeMiddlePoint } from "../QuadraticUtils"

export class SVGQuadraticStroker
{

  private getArcPath(center: TPoint, radius: number): string
  {
    const svgPath = [
      `M ${center.x},${center.y}`,
      `m ${-radius},0`,
      `a ${radius},${radius} 0 1 0 ${radius * 2},0`,
      `a ${radius},${radius} 0 1 0 ${-(radius * 2)},0`
    ].join(" ")
    return svgPath
  }

  private getLinePath(begin: TPoint, end: TPoint, width: number): string
  {
    const linkPoints1 = computeLinksPoints(begin, computeAxeAngle(begin, end), width)
    const linkPoints2 = computeLinksPoints(end, computeAxeAngle(begin, end), width)
    const svgPath = [
      `M ${linkPoints1[0].x},${linkPoints1[0].y}`,
      `L ${linkPoints2[0].x},${linkPoints2[0].y}`,
      `L ${linkPoints2[1].x},${linkPoints2[1].y}`,
      `L ${linkPoints1[1].x},${linkPoints1[1].y}`
    ].join(" ")
    return svgPath
  }

  private getFinalPath(begin: TPoint, end: TPoint, width: number): string
  {
    const ARCSPLIT = 6
    const angle = computeAxeAngle(begin, end)
    const linkPoints = computeLinksPoints(end, angle, width)
    const parts = [`M ${linkPoints[0].x},${linkPoints[0].y}`]
    for (let i = 1; i <= ARCSPLIT; i++) {
      const newAngle = angle - (i * (Math.PI / ARCSPLIT))
      parts.push(`L ${end.x - (end.p * width * Math.sin(newAngle))},${end.y + (end.p * width * Math.cos(newAngle))}`)
    }
    const svgPath = parts.join(" ")
    return svgPath
  }

  private getQuadraticPath(begin: TPoint, end: TPoint, central: TPoint, width: number): string
  {
    const linkPoints1 = computeLinksPoints(begin, computeAxeAngle(begin, central), width)
    const linkPoints2 = computeLinksPoints(end, computeAxeAngle(central, end), width)
    const linkPoints3 = computeLinksPoints(central, computeAxeAngle(begin, end), width)
    const svgPath = [
      `M ${linkPoints1[0].x},${linkPoints1[0].y}`,
      `Q ${linkPoints3[0].x},${linkPoints3[0].y} ${linkPoints2[0].x},${linkPoints2[0].y}`,
      `L ${linkPoints2[1].x},${linkPoints2[1].y}`,
      `Q ${linkPoints3[1].x},${linkPoints3[1].y} ${linkPoints1[1].x},${linkPoints1[1].y}`
    ].join(" ")
    return svgPath
  }

  private getPointByIndex(stroke: TStroke, index: number): TPoint {
    const point: TPoint = {
      x: stroke.x[index] || 0,
      y: stroke.y[index] || 0,
      t: stroke.t[index] || 0,
      p: stroke.p[index] || 0,
    }
    return point
  }

  private buildSVGPath (stroke: TStroke): string  {
    const STROKE_LENGTH = stroke.x.length
    const STROKE_WIDTH = (stroke.width as number)
    const NB_QUADRATICS = STROKE_LENGTH - 2
    const firstPoint = this.getPointByIndex(stroke, 0)

    const parts = []
    if (STROKE_LENGTH < 3) {
      parts.push(this.getArcPath(firstPoint, STROKE_WIDTH * 0.6))
    } else {
      parts.push(this.getArcPath(firstPoint, STROKE_WIDTH * firstPoint.p))
      parts.push(this.getLinePath(firstPoint, computeMiddlePoint(firstPoint, this.getPointByIndex(stroke, 1)), STROKE_WIDTH))

      for (let i = 0; i < NB_QUADRATICS; i++) {
        const begin = computeMiddlePoint(this.getPointByIndex(stroke, i), this.getPointByIndex(stroke, i + 1))
        const end = computeMiddlePoint(this.getPointByIndex(stroke, i + 1), this.getPointByIndex(stroke, i + 2))
        const central = this.getPointByIndex(stroke, i + 1)
        parts.push(this.getQuadraticPath(begin, end, central, STROKE_WIDTH)
        )
      }
      const beforeLastPoint = this.getPointByIndex(stroke, STROKE_LENGTH - 2)
      const lastPoint = this.getPointByIndex(stroke, STROKE_LENGTH - 1)
      parts.push(this.getLinePath(computeMiddlePoint(beforeLastPoint, lastPoint), lastPoint, STROKE_WIDTH))
      parts.push(this.getFinalPath(beforeLastPoint, lastPoint, STROKE_WIDTH))
    }
    return parts.join(" ")
  }

  drawStroke(svgElement: SVGElement, stroke: TStroke): void
  {
    const svgPath = this.buildSVGPath(stroke)
    const svgStroke = document.createElementNS("http://www.w3.org/2000/svg", "path")
    svgStroke.classList.add("pending-stroke")
    svgStroke.setAttribute("id", stroke.id as string)
    svgStroke.setAttribute("color", stroke.color as string)
    const style = `fill:${stroke.color};stroke:transparent;`
    svgStroke.setAttribute("style", style)
    svgStroke.setAttribute("d", `${svgPath}Z`)
    svgElement.appendChild(svgStroke)
  }

  drawErasingStroke (svgElement: SVGElement, stroke: TStroke) {
    stroke.width = 20
    const svgPath = this.buildSVGPath(stroke)
    const svgStroke = document.createElementNS("http://www.w3.org/2000/svg", "path")
    svgStroke.classList.add("erasing-stroke")
    svgStroke.setAttribute("id", stroke.id as string)
    const style = "fill:grey;stroke:transparent;shadowBlur:5;opacity:0.2;"
    svgStroke.setAttribute("style", style)
    svgStroke.setAttribute("d", `${svgPath}Z`)
    svgElement.appendChild(svgStroke)
  }
}