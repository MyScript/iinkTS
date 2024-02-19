
/**
 * @group Configuration
 */
export type TListenerConfiguration = {
  capture: boolean
  passive: boolean
}

/**
 * @group Configuration
 */
export const DefaultListenerConfiguration: TListenerConfiguration = {
  capture: false,
  passive: true
}


/**
 * @group Configuration
 */
export type TGrabberConfiguration = {
  listenerOptions: TListenerConfiguration
  xyFloatPrecision: number
  timestampFloatPrecision: number
  delayLongTouch: number
}

/**
 * @group Configuration
 */
export const DefaultGrabberConfiguration: TGrabberConfiguration = {
  listenerOptions: DefaultListenerConfiguration,
  xyFloatPrecision: 0,
  timestampFloatPrecision: 0,
  delayLongTouch: 500
}
