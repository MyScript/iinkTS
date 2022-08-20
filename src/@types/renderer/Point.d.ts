
export type TPartialXYPoint = {
  x: number
  y: number
}

export type TPoint = TPartialXYPoint & {
  t: number
  p: number
}
