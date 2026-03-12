import { LoggerCategory, LoggerManager } from "../../logger"
import { TPoint, TCanvasShapeEllipseSymbol, TCanvasShapeLineSymbol, TCanvasShapeTableSymbol, TSymbol } from "../../symbol"
import { normalizeAngle, calculateEllipseArcPoints } from "../shared"

/**
 * @group Renderer
 */
export class CanvasRendererShape
{
  #logger = LoggerManager.getLogger(LoggerCategory.RENDERER)

  symbols = {
    table: "table",
    ellipse: "ellipse",
    line: "line"
  }

  protected drawEllipseArc(context2D: CanvasRenderingContext2D, shapeEllipse: TCanvasShapeEllipseSymbol): TPoint[]
  {
    this.#logger.debug("drawEllipseArc", { context2D, shapeEllipse })
    const { centerPoint, maxRadius, minRadius, orientation, startAngle, sweepAngle } = shapeEllipse
    const boundariesPoints: TPoint[] = []

    context2D.save()
    try {
      context2D.beginPath()
      const arcPoints = calculateEllipseArcPoints(centerPoint, maxRadius, minRadius, orientation, startAngle, sweepAngle)

      arcPoints.forEach((point, index) => {
        if (index === 0) {
          context2D.moveTo(point.x, point.y)
        } else {
          context2D.lineTo(point.x, point.y)
        }
        // Collect boundary points (first and last)
        if (index === 0 || index === arcPoints.length - 1) {
          boundariesPoints.push(point)
        }
      })
      context2D.stroke()
    } catch(error) {
      this.#logger.error("drawEllipseArc", { error })
    } finally {
      context2D.restore()
    }
    return boundariesPoints
  }

  protected drawLine(context2D: CanvasRenderingContext2D, p1: TPoint, p2: TPoint)
  {
    this.#logger.debug("drawLine", { context2D, p1, p2 })
    context2D.save()
    try {
      context2D.beginPath()
      context2D.moveTo(p1.x, p1.y)
      context2D.lineTo(p2.x, p2.y)
      context2D.stroke()
    } catch(error) {
      this.#logger.error("drawLine", { error })
    } finally {
      context2D.restore()
    }
  }

  protected drawArrowHead(context2D: CanvasRenderingContext2D, headPoint: TPoint, angle: number, length: number)
  {
    this.#logger.debug("drawArrowHead", { context2D, headPoint, angle, length })
    const alpha = normalizeAngle(angle + (Math.PI * (7 / 8)))
    const beta = normalizeAngle(angle - (Math.PI * (7 / 8)))
    context2D.save()
    try {
      context2D.fillStyle = context2D.strokeStyle

      context2D.moveTo(headPoint.x, headPoint.y)
      context2D.beginPath()
      context2D.lineTo(headPoint.x + (length * Math.cos(alpha)), headPoint.y + (length * Math.sin(alpha)))
      context2D.lineTo(headPoint.x + (length * Math.cos(beta)), headPoint.y + (length * Math.sin(beta)))
      context2D.lineTo(headPoint.x, headPoint.y)
      context2D.fill()
    } catch(error) {
      this.#logger.error("drawArrowHead", { error })
    } finally {
      context2D.restore()
    }
  }

  protected drawShapeEllipse(context2D: CanvasRenderingContext2D, shapeEllipse: TCanvasShapeEllipseSymbol)
  {
    this.#logger.debug("drawShapeEllipse", { context2D, shapeEllipse })
    const points = this.drawEllipseArc(context2D, shapeEllipse)

    if (shapeEllipse?.beginDecoration === "ARROW_HEAD") {
      this.drawArrowHead(context2D, points[0], shapeEllipse.beginTangentAngle, 12.0)
    }
    if (shapeEllipse?.endDecoration === "ARROW_HEAD") {
      this.drawArrowHead(context2D, points[1], shapeEllipse.endTangentAngle, 12.0)
    }
  }

  protected drawShapeLine(context2D: CanvasRenderingContext2D, shapeLine: TCanvasShapeLineSymbol)
  {
    this.#logger.debug("drawShapeLine", { context2D, shapeLine })
    this.drawLine(context2D, shapeLine.firstPoint, shapeLine.lastPoint)
    if (shapeLine.beginDecoration === "ARROW_HEAD") {
      this.drawArrowHead(context2D, shapeLine.firstPoint, shapeLine.beginTangentAngle, 12.0)
    }
    if (shapeLine.endDecoration === "ARROW_HEAD") {
      this.drawArrowHead(context2D, shapeLine.lastPoint, shapeLine.endTangentAngle, 12.0)
    }
  }

  draw(context2D: CanvasRenderingContext2D, symbol: TSymbol)
  {
    this.#logger.info("draw", { context2D, symbol })
    context2D.save()
    context2D.lineWidth = symbol.style.width as number
    context2D.strokeStyle = symbol.style.color as string

    switch (symbol.type) {
      case this.symbols.table: {
        const tableSymbols = symbol as TCanvasShapeTableSymbol
        tableSymbols.lines.forEach(line => this.drawLine(context2D, line.p1, line.p2))
        break
      }
      case this.symbols.ellipse: {
        this.drawShapeEllipse(context2D, symbol as TCanvasShapeEllipseSymbol)
        break
      }
      case this.symbols.line: {
        this.drawShapeLine(context2D, symbol as TCanvasShapeLineSymbol)
        break
      }
      default:
        this.#logger.warn("draw", `${ symbol.type } not implemented`)
        break
    }
  }

}
