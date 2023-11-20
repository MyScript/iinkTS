
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
}

/**
 * @group Configuration
 */
export const DefaultRawContentConfiguration: TRawContentConfiguration = {
  recognition: DefaultRawContentRecognitionConfiguration,
  eraser: DefaultEraserConfiguration
}
