
import { DefaultEraserConfiguration, TEraserConfiguration } from "./EraserConfiguration"
import { TTextConfConfiguration } from "./TextConfiguration"

/**
 * @group Recognizer
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
}

/**
 * @group Recognizer
 * @source
 */
export const DefaultRawContentConfiguration: TRawContentConfiguration = {
  recognition: {
    types: ["text", "shape"]
  },
  classification: {
    types: ["text", "shape"]
  },
  eraser: DefaultEraserConfiguration,
}
