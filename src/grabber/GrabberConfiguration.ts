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
  passive: true,
}

/**
 * Which pointers may draw on the canvas.
 * - "any": every pointer type (mouse, touch, pen)
 * - "pen": pen only, so a palm resting on a tablet never inks
 * - "auto": every pointer type until the first pen event, then pen only
 * @group Grabber
 */
export type TGrabberInputMode = "any" | "pen" | "auto"

/**
 * @group Grabber
 */
export type TGrabberConfiguration = {
  listenerOptions: TListenerConfiguration
  xyFloatPrecision: number
  timestampFloatPrecision: number
  delayLongTouch: number
  inputMode: TGrabberInputMode
}

/**
 * @group Grabber
 * @source
 */
export const DefaultGrabberConfiguration: TGrabberConfiguration = {
  listenerOptions: DefaultListenerConfiguration,
  xyFloatPrecision: 0,
  // Negative means "do not coarsen": pointer times are kept to three decimals. A pen samples
  // several times per millisecond, and the previous default of 0 rounded to whole milliseconds,
  // which reported consecutive samples as captured at the very same instant.
  timestampFloatPrecision: -1,
  delayLongTouch: 500,
  inputMode: "any",
}
