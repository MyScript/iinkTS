import type { TPointer } from "@/core"
import {
  computeFinalOutlinePoints,
  computeLineOutlinePoints,
  computeMiddlePointer,
  computeQuadraticOutlinePoints,
  TWO_PI,
} from "@/core"
import { LoggerCategory, LoggerManager } from "@/logger"
import { computeOutlinePointers, isPenNib, readNibOverrides } from "@/style"
import type { Stroke } from "@/symbol"
/**
 * @group Renderer
 */
export class CanvasRendererStroke {
  #logger = LoggerManager.getLogger(LoggerCategory.RENDERER)

  protected renderArc(context2d: CanvasRenderingContext2D, center: TPointer, radius: number): void {
    this.#logger.debug("renderArc", {
      context2d,
      center,
      radius,
    })
    context2d.arc(center.x, center.y, radius, 0, TWO_PI, true)
  }

  protected renderLine(context2d: CanvasRenderingContext2D, begin: TPointer, end: TPointer, width: number): void {
    this.#logger.debug("renderLine", {
      context2d,
      begin,
      end,
      width,
    })
    const { linkPoints1, linkPoints2 } = computeLineOutlinePoints(begin, end, width)

    context2d.moveTo(linkPoints1[0].x, linkPoints1[0].y)
    context2d.lineTo(linkPoints2[0].x, linkPoints2[0].y)
    context2d.lineTo(linkPoints2[1].x, linkPoints2[1].y)
    context2d.lineTo(linkPoints1[1].x, linkPoints1[1].y)
  }

  protected renderFinal(context2d: CanvasRenderingContext2D, begin: TPointer, end: TPointer, width: number): void {
    this.#logger.debug("renderFinal", {
      context2d,
      begin,
      end,
      width,
    })
    const points = computeFinalOutlinePoints(begin, end, width)
    context2d.moveTo(points[0].x, points[0].y)
    for (let i = 1; i < points.length; i++) {
      context2d.lineTo(points[i].x, points[i].y)
    }
  }

  protected renderQuadratic(
    context2d: CanvasRenderingContext2D,
    begin: TPointer,
    end: TPointer,
    ctrl: TPointer,
    width: number
  ): void {
    this.#logger.debug("renderQuadratic", {
      context2d,
      begin,
      end,
      ctrl,
      width,
    })
    const { linkPoints1, linkPoints2, linkPoints3 } = computeQuadraticOutlinePoints(begin, end, ctrl, width)

    context2d.moveTo(linkPoints1[0].x, linkPoints1[0].y)
    context2d.quadraticCurveTo(linkPoints3[0].x, linkPoints3[0].y, linkPoints2[0].x, linkPoints2[0].y)
    context2d.lineTo(linkPoints2[1].x, linkPoints2[1].y)
    context2d.quadraticCurveTo(linkPoints3[1].x, linkPoints3[1].y, linkPoints1[1].x, linkPoints1[1].y)
  }

  draw(context2d: CanvasRenderingContext2D, stroke: Stroke): void {
    this.#logger.info("draw", {
      context2d,
      stroke,
    })
    const NUMBER_POINTS = stroke.pointers.length
    const NUMBER_QUADRATICS = NUMBER_POINTS - 2
    const width = (stroke.style.width as number) > 0 ? (stroke.style.width as number) : context2d.lineWidth
    const color = (stroke.style.color as string) ? (stroke.style.color as string) : context2d.strokeStyle
    // See `computeWidthProfile`: `p` on a stored pointer is the device's measurement, the width to
    // draw is derived from the pen's speed here.
    const pointers = computeOutlinePointers(
      stroke.pointers,
      stroke.pointerType,
      isPenNib(stroke.style.pen) ? stroke.style.pen : undefined,
      readNibOverrides(stroke.style)
    )
    const firstPoint = pointers[0]

    context2d.save()
    try {
      context2d.beginPath()
      if (NUMBER_POINTS < 3) {
        this.renderArc(context2d, firstPoint, width * 0.6)
      } else {
        this.renderArc(context2d, firstPoint, width * firstPoint.p)
        const secondPoint: TPointer = computeMiddlePointer(firstPoint, pointers[1])
        this.renderLine(context2d, firstPoint, secondPoint, width)

        for (let i = 0; i < NUMBER_QUADRATICS; i++) {
          const begin: TPointer = computeMiddlePointer(pointers[i], pointers[i + 1])
          const end: TPointer = computeMiddlePointer(pointers[i + 1], pointers[i + 2])
          const ctrl: TPointer = pointers[i + 1]
          this.renderQuadratic(context2d, begin, end, ctrl, width)
        }
        const beginLine: TPointer = computeMiddlePointer(pointers[NUMBER_POINTS - 2], pointers[NUMBER_POINTS - 1])
        const endLine: TPointer = pointers[NUMBER_POINTS - 1]
        this.renderLine(context2d, beginLine, endLine, width)

        const beginFinal: TPointer = pointers[NUMBER_POINTS - 2]
        const endFinal: TPointer = pointers[NUMBER_POINTS - 1]
        this.renderFinal(context2d, beginFinal, endFinal, width)
      }
      context2d.closePath()
      if (color !== undefined) {
        context2d.fillStyle = color
        context2d.fill()
      }
    } catch (error) {
      this.#logger.error("draw", { error })
    } finally {
      context2d.restore()
    }
  }
}
