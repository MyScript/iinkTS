import { TStroke, IStroker } from "../../../@types/stroker/Stroker"

export function drawStroke (context2D: CanvasRenderingContext2D, stroke: TStroke, stroker: IStroker) {
  if (stroker && stroke && stroke.pointerType !== 'eraser') {
    stroker.drawStroke(context2D, stroke)
  }
}