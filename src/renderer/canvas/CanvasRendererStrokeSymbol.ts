import { TStroke } from "../../@types/model/Stroke"
import { CanvasStroker } from "./CanvasStroker"

export function drawStroke (context2D: CanvasRenderingContext2D, stroke: TStroke, stroker: CanvasStroker) {
  if (stroker && stroke && stroke.pointerType !== "eraser") {
    stroker.drawStroke(context2D, stroke)
  }
}
