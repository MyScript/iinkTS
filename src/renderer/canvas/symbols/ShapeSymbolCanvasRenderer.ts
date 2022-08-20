
import { TPartialXYPoint } from "../../../@types/renderer/Point"
import { TSymbol, TShapeEllipseSymbol, TShapeLineSymbol, TShapeSymbol, TShapeTableSymbol, TLineSymbol, TShapeRecognizedSymbol } from "../../../@types/renderer/Symbol"

export const ShapeSymbols = {
  table: 'table',
  shape: 'shape',
  recognizedShape: 'recognizedShape',
  ellipse: 'ellipse',
  line: 'line'
}

function phi(angle: number): number
{
  let returnedAngle = ((angle + Math.PI) % (Math.PI * 2)) - Math.PI
  if (returnedAngle < -Math.PI) {
    returnedAngle += Math.PI * 2
  }
  return returnedAngle
}

function drawEllipseArc(context2D: CanvasRenderingContext2D, shapeEllipse: TShapeEllipseSymbol): TPartialXYPoint[]
{
  const { centerPoint, maxRadius, minRadius, orientation, startAngle, sweepAngle } = shapeEllipse
  const angleStep = 0.02 // angle delta between interpolated

  let z1 = Math.cos(orientation)
  let z3 = Math.sin(orientation)
  let z2 = z1
  let z4 = z3
  z1 *= maxRadius
  z2 *= minRadius
  z3 *= maxRadius
  z4 *= minRadius

  const n = Math.floor(Math.abs(sweepAngle) / angleStep)

  const boundariesPoints = []

  context2D.save()
  try {
    context2D.beginPath()

    for (let i = 0; i <= n; i++) {
      const angle = startAngle + ((i / n) * sweepAngle) // points on the arc, in radian
      const alpha = Math.atan2(Math.sin(angle) / minRadius, Math.cos(angle) / maxRadius)

      const cosAlpha = Math.cos(alpha)
      const sinAlpha = Math.sin(alpha)

      // current point
      const x = (centerPoint.x + (z1 * cosAlpha)) - (z4 * sinAlpha)
      const y = (centerPoint.y + (z2 * sinAlpha)) + (z3 * cosAlpha)
      if (i === 0) {
        context2D.moveTo(x, y)
      } else {
        context2D.lineTo(x, y)
      }

      if (i === 0 || i === n) {
        boundariesPoints.push({ x, y })
      }
    }

    context2D.stroke()
  } finally {
    context2D.restore()
  }

  return boundariesPoints
}

function drawArrowHead(context2D: CanvasRenderingContext2D, headPoint: TPartialXYPoint, angle: number, length: number)
{
  const alpha = phi(angle + (Math.PI * (7 / 8)))
  const beta = phi(angle - (Math.PI * (7 / 8)))
  context2D.save()
  try {
    context2D.fillStyle = context2D.strokeStyle

    context2D.moveTo(headPoint.x, headPoint.y)
    context2D.beginPath()
    context2D.lineTo(headPoint.x + (length * Math.cos(alpha)), headPoint.y + (length * Math.sin(alpha)))
    context2D.lineTo(headPoint.x + (length * Math.cos(beta)), headPoint.y + (length * Math.sin(beta)))
    context2D.lineTo(headPoint.x, headPoint.y)
    context2D.fill()
  } finally {
    context2D.restore()
  }
}

function drawShapeEllipse(context2D: CanvasRenderingContext2D, shapeEllipse: TShapeEllipseSymbol)
{
  const points = drawEllipseArc(context2D, shapeEllipse)

  if (shapeEllipse?.beginDecoration === 'ARROW_HEAD') {
    drawArrowHead(context2D, points[0], shapeEllipse.beginTangentAngle, 12.0)
  }
  if (shapeEllipse?.endDecoration === 'ARROW_HEAD') {
    drawArrowHead(context2D, points[1], shapeEllipse.endTangentAngle, 12.0)
  }
}

/**
 * Draw a line
 * @param {Object} context2D Current rendering context2D
 * @param {{x: Number, y: Number}} p1 Origin point
 * @param {{x: Number, y: Number}} p2 Destination point
 */
export function drawLine(context2D: CanvasRenderingContext2D, p1: TPartialXYPoint, p2: TPartialXYPoint)
{
  context2D.save()
  try {
    context2D.beginPath()
    context2D.moveTo(p1.x, p1.y)
    context2D.lineTo(p2.x, p2.y)
    context2D.stroke()
  } finally {
    context2D.restore()
  }
}

function drawShapeLine(context2D: CanvasRenderingContext2D, shapeLine: TShapeLineSymbol)
{
  drawLine(context2D, shapeLine.firstPoint, shapeLine.lastPoint)
  if (shapeLine.beginDecoration === 'ARROW_HEAD') {
    drawArrowHead(context2D, shapeLine.firstPoint, shapeLine.beginTangentAngle, 12.0)
  }
  if (shapeLine.endDecoration === 'ARROW_HEAD') {
    drawArrowHead(context2D, shapeLine.lastPoint, shapeLine.endTangentAngle, 12.0)
  }
}

/**
 * Draw a shape symbol
 * @param {Object} context2D Current rendering context2D
 * @param {Object} symbol Symbol to draw
 */
export function drawShapeSymbol(context2D: CanvasRenderingContext2D, symbol: TSymbol)
{
  context2D.save()
  try {
    context2D.lineWidth = symbol.width
    context2D.strokeStyle = symbol.color

    if (symbol.elementType) {
      switch (symbol.elementType) {
        case ShapeSymbols.shape:
          // eslint-disable-next-line no-case-declarations
          const shapeSymbol = symbol as TShapeSymbol
          drawShapeSymbol(context2D, shapeSymbol.candidates[shapeSymbol.selectedCandidateIndex])
          break
        case ShapeSymbols.table:
          // eslint-disable-next-line no-case-declarations
          const tableSymbols = symbol as TShapeTableSymbol
          tableSymbols.lines.forEach(line => drawShapeSymbol(context2D, line))
          break
        case ShapeSymbols.line:
          // eslint-disable-next-line no-case-declarations
          const lineSymbol = symbol as TLineSymbol
          drawLine(context2D, lineSymbol.data.p1, lineSymbol.data.p2)
          break
        default:
          // logger.error(`${ symbol.elementType } not implemented`)
          break
      }
    } else {
      switch (symbol.type) {
        case ShapeSymbols.ellipse:
          drawShapeEllipse(context2D, symbol as TShapeEllipseSymbol)
          break
        case ShapeSymbols.line:
          drawShapeLine(context2D, symbol as TShapeLineSymbol)
          break
        case ShapeSymbols.recognizedShape:
          // eslint-disable-next-line no-case-declarations
          const recognizedSymbols = symbol as TShapeRecognizedSymbol
          recognizedSymbols.primitives.forEach(primitive => drawShapeSymbol(context2D, primitive))
          break
        default:
          // logger.error(`${ symbol.type } not implemented`)
          break
      }
    }
  } finally {
    context2D.restore()
  }
}
