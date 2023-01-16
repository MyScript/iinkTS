import { TStroke } from "../../@types/model/Stroke"
import { CanvasQuadraticStroker } from "./CanvasQuadraticStroker"

export function drawStroke (context2D: CanvasRenderingContext2D, stroke: TStroke, stroker: CanvasQuadraticStroker) {
  if (stroker && stroke && stroke.pointerType !== "eraser") {
    stroker.drawStroke(context2D, stroke)
  }
}
