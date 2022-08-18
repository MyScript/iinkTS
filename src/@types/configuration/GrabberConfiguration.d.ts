
export type TListenerConfiguration = {
  capture: boolean
  passive: boolean
}

export type TGrabberConfiguration = {
  listenerOptions: TListenerConfiguration
  xyFloatPrecision: number
  timestampFloatPrecision: number
}