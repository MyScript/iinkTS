
export type TPoint = {
  x: number
  y: number
}

export type TPointer = TPoint & {
  t: number
  p: number
}

export type TSegment = { p1: TPoint, p2: TPoint }

export type TLineEquation = { a: number, b: number}
