import { DefaultMarginConfiguration, TMarginConfiguration } from "./MarginConfiguration"
import { DefaultEraserConfiguration, TEraserConfiguration } from "./EraserConfiguration"

/**
 * @group Recognizer
 */
export type TTextGuidesConfigurationV2 = {
  enable: boolean,
  "line-gap-mm"?: number,
  "origin-y-mm"?: number,
}

/**
 * @group Recognizer
 * @source
 */
export const DefaultTextGuidesConfigurationV2: TTextGuidesConfigurationV2 = {
  enable: true,
  "line-gap-mm": 100,
  "origin-y-mm": 0,
}

/**
 * @group Recognizer
 */
export type TTextRecognizerHTTPV2ConfConfiguration = {
  customResources?: string[]
  customLexicon?: string[]
  addLKText?: boolean
}

/**
 * @group Recognizer
 */
export type TTextRecognizerHTTPV2Configuration = {
  text?: boolean
  mimeTypes: ("text/plain" | "application/vnd.myscript.jiix")[]
  margin: TMarginConfiguration
  guides: TTextGuidesConfigurationV2
  configuration?: TTextRecognizerHTTPV2ConfConfiguration
  eraser?: TEraserConfiguration
}

/**
 * @group Recognizer
 * @source
 */
export const DefaultTexConfigurationV2: TTextRecognizerHTTPV2Configuration = {
  guides: DefaultTextGuidesConfigurationV2,
  eraser: DefaultEraserConfiguration,
  margin: DefaultMarginConfiguration,
  mimeTypes: ["application/vnd.myscript.jiix"],
}
