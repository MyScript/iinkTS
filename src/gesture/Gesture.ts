export type TGestureType = ("UNDERLINE"| "SCRATCH" | "JOIN" | "INSERT" | "STRIKETHROUGH" | "SURROUND")

export type TGesture = {
  gestureType: TGestureType
  gestureStrokeId: string
  strokeIds: string[]
  strokeBeforeIds: string[]
  strokeAfterIds: string[]
  subStrokes?: { x: number[], y: number[] }[]
}
