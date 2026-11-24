import { convertMillimeterToPixel } from "../math"
import type { TBox } from "./Box"

/**
 * @group Core/Geometry
 */
export function convertBoundingBoxMillimeterToPixel(box?: TBox): TBox {
  if (!box) {
    return { height: 0, width: 0, x: 0, y: 0 }
  }
  return {
    x: convertMillimeterToPixel(box.x),
    y: convertMillimeterToPixel(box.y),
    width: convertMillimeterToPixel(box.width),
    height: convertMillimeterToPixel(box.height),
  }
}
