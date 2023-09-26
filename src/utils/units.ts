
export function convertMillimeterToPixel(mm: number): number
{
  return mm * 96 / 25.4
}

export function convertPixelToMillimeter(px: number): number
{
  return px / 96 * 25.4
}
