import { TPoint } from "../../@types/renderer/Point"
import { TStroke } from "../../@types/model/Stroke"
import { computeAxeAngle, computeLinksPoints, computeMiddlePoint } from "../QuadraticUtils"

export class CanvasQuadraticStroker
{

  private renderArc(context2d: CanvasRenderingContext2D, center: TPoint, radius: number): void
  {
    context2d.arc(center.x, center.y, radius, 0, Math.PI * 2, true)
  }

  private renderLine(context2d: CanvasRenderingContext2D, begin: TPoint, end: TPoint, width: number): void
  {
    const linkPoints1 = computeLinksPoints(begin, computeAxeAngle(begin, end), width)
    const linkPoints2 = computeLinksPoints(end, computeAxeAngle(begin, end), width)

    context2d.moveTo(linkPoints1[0].x, linkPoints1[0].y)
    context2d.lineTo(linkPoints2[0].x, linkPoints2[0].y)
    context2d.lineTo(linkPoints2[1].x, linkPoints2[1].y)
    context2d.lineTo(linkPoints1[1].x, linkPoints1[1].y)
  }

  private renderFinal(context2d: CanvasRenderingContext2D, begin: TPoint, end: TPoint, width: number): void
  {
    const ARCSPLIT = 6
    const angle = computeAxeAngle(begin, end)
    const linkPoints = computeLinksPoints(end, angle, width)
    context2d.moveTo(linkPoints[0].x, linkPoints[0].y)
    for (let i = 1; i <= ARCSPLIT; i++) {
      const newAngle = angle - ((i * Math.PI) / ARCSPLIT)
      context2d.lineTo(end.x - ((end.p * width) * Math.sin(newAngle)), end.y + (end.p * width * Math.cos(newAngle)))
    }
  }

  private renderQuadratic(context2d: CanvasRenderingContext2D, begin: TPoint, end: TPoint, ctrl: TPoint, width: number): void
  {
    const linkPoints1 = computeLinksPoints(begin, computeAxeAngle(begin, ctrl), width)
    const linkPoints2 = computeLinksPoints(end, computeAxeAngle(ctrl, end), width)
    const linkPoints3 = computeLinksPoints(ctrl, computeAxeAngle(begin, end), width)

    context2d.moveTo(linkPoints1[0].x, linkPoints1[0].y)
    context2d.quadraticCurveTo(linkPoints3[0].x, linkPoints3[0].y, linkPoints2[0].x, linkPoints2[0].y)
    context2d.lineTo(linkPoints2[1].x, linkPoints2[1].y)
    context2d.quadraticCurveTo(linkPoints3[1].x, linkPoints3[1].y, linkPoints1[1].x, linkPoints1[1].y)
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

  drawStroke(context2d: CanvasRenderingContext2D, stroke: TStroke): void
  {
    const length = stroke.x.length
    const width = (stroke.width as number) > 0 ? (stroke.width as number) : context2d.lineWidth
    const color = (stroke.color as string) ? (stroke.color as string) : context2d.strokeStyle
    const firstPoint = this.getPointByIndex(stroke, 0) as TPoint
    const nbquadratics = length - 2

    context2d.save()
    try {
      context2d.beginPath()
      if (length < 3) {
        this.renderArc(context2d, firstPoint, width * 0.6)
      } else {
        this.renderArc(context2d, firstPoint, width * firstPoint.p)
        const secondPoint: TPoint = computeMiddlePoint(firstPoint, this.getPointByIndex(stroke, 1))
        this.renderLine(context2d, firstPoint, secondPoint, width)

        // Possibility to try this (the start looks better when the ink is large)
        // var first = computeMiddlePoint(stroke[0], stroke[1]);
        // context2d.arc(first.x, first.y, width * first.p, 0, Math.PI * 2, true);

        for (let i = 0; i < nbquadratics; i++) {
          const begin: TPoint = computeMiddlePoint(this.getPointByIndex(stroke, i), this.getPointByIndex(stroke, i + 1))
          const end: TPoint = computeMiddlePoint(this.getPointByIndex(stroke, i + 1), this.getPointByIndex(stroke, i + 2))
          const ctrl: TPoint = this.getPointByIndex(stroke, i + 1)
          this.renderQuadratic(context2d, begin, end, ctrl, width)
        }
        const beginLine: TPoint = computeMiddlePoint(this.getPointByIndex(stroke, length - 2), this.getPointByIndex(stroke, length - 1))
        const endLine: TPoint = this.getPointByIndex(stroke, length - 1)
        this.renderLine(context2d, beginLine, endLine, width)

        const beginFinal: TPoint = this.getPointByIndex(stroke, length - 2)
        const endFinal: TPoint = this.getPointByIndex(stroke, length - 1)
        this.renderFinal(context2d, beginFinal, endFinal, width)
      }
      context2d.closePath()
      if (color !== undefined) {
        context2d.fillStyle = color
        context2d.fill()
      }
      context2d.save()
    }
    finally {
      context2d.restore()
    }
  }
}
