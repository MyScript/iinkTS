
/**
 * @group Grabber
 */
export type TListenerConfiguration = {
  capture: boolean
  passive: boolean
}

/**
 * @group Grabber
 * @source
 */
export const DefaultListenerConfiguration: TListenerConfiguration = {
  capture: false,
  passive: true
}

/**
 * @group Grabber
 */
export type TGrabberConfiguration = {
  listenerOptions: TListenerConfiguration
  xyFloatPrecision: number
  timestampFloatPrecision: number
  delayLongTouch: number
}

/**
 * @group Grabber
 * @source
 */
export const DefaultGrabberConfiguration: TGrabberConfiguration = {
  listenerOptions: DefaultListenerConfiguration,
  xyFloatPrecision: 0,
  timestampFloatPrecision: 0,
  delayLongTouch: 500
}
