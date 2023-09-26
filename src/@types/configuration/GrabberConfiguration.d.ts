/**
 * @grabber
 */
export type TListenerConfiguration = {
  capture: boolean
  passive: boolean
}

/**
 * @grabber
 */
export type TGrabberConfiguration = {
  listenerOptions: TListenerConfiguration
  xyFloatPrecision: number
  timestampFloatPrecision: number
}
