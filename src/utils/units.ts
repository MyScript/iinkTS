import { TBoundingBox } from "../primitive"

/**
 * @group Utils
 */
export function convertMillimeterToPixel(mm: number): number
{
  return +(mm * 96 / 25.4).toFixed(3)
}

/**
 * @group Utils
 */
export function convertPixelToMillimeter(px: number): number
{
  return +(px / 96 * 25.4).toFixed(3)
}

/**
 * @group Utils
 */
export function convertBoundingBoxMillimeterToPixel(box?: TBoundingBox): TBoundingBox
{
  if (!box) {
    return { height: 0, width: 0, x: 0, y: 0}
  }
  return {
    x: convertMillimeterToPixel(box.x),
    y: convertMillimeterToPixel(box.y),
    width: convertMillimeterToPixel(box.width),
    height: convertMillimeterToPixel(box.height),
  }
}
