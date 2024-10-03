
import { DefaultEraserConfiguration, TEraserConfiguration } from "./EraserConfiguration"
import { TTextConfConfiguration } from "./TextConfiguration"

/**
 * @group Configuration
 */
export type TRawContentConfiguration = {
  text?: TTextConfConfiguration
  "session-time"?: number
  recognition?: {
    types: ("text" | "shape")[]
  }
  classification?: {
    types: ("text" | "shape")[]
  }
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
  recognition: {
    types: ["text", "shape"]
  },
  classification: {
    types: ["text", "shape"]
  },
  eraser: DefaultEraserConfiguration,
  /**
   * @remarks only usable in the case of offscreen
   */
  gestures : ["underline", "scratch-out", "join", "insert", "strike-through", "surround"]
}
