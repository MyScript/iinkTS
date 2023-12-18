
import { DefaultEraserConfiguration, TEraserConfiguration } from "./EraserConfiguration"
import { TTextConfConfiguration } from "./TextConfiguration"

/**
 * @group Configuration
 */
export type TRawContentRecognitionConfiguration = {
  text: boolean
  shape: boolean
}

/**
 * @group Configuration
 */
export const DefaultRawContentRecognitionConfiguration: TRawContentRecognitionConfiguration = {
  text: true,
  shape: true
}

/**
 * @group Configuration
 */
export type TRawContentConfiguration = {
  text?: TTextConfConfiguration
  "session-time"?: number
  recognition?: TRawContentRecognitionConfiguration
  eraser?: TEraserConfiguration
  /**
   * @description allows you to define the detected gestures
   * @remarks only usable in the case of offscreen
   */
  gestures? : ("underline" | "scratch-out" | "join" | "insert" | "strike-through" | "surround")[]
}

/**
 * @group Configuration
 */
export const DefaultRawContentConfiguration: TRawContentConfiguration = {
  recognition: DefaultRawContentRecognitionConfiguration,
  eraser: DefaultEraserConfiguration,
  /**
   * @remarks only usable in the case of offscreen
   */
  gestures : ["underline", "scratch-out", "join", "insert", "strike-through", "surround"]
}
