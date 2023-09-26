
export type TPoint = {
  x: number
  y: number
}

export type TPointer = TPoint & {
  t: number
  p: number
}

export type TBoundingBox = {
  x: number,
  y: number,
  width: number,
  height: number
}

export type TBoxLimit = {
  xMin: number,
  yMin: number,
  xMax: number,
  yMax: number
}
