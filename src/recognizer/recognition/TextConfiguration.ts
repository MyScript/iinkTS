import { DefaultMarginConfiguration, TMarginConfiguration } from "./MarginConfiguration"
import { DefaultEraserConfiguration, TEraserConfiguration } from "./EraserConfiguration"

/**
 * @group Recognizer
 */
export type TTextGuidesConfiguration = {
  enable: boolean
}

/**
 * @group Recognizer
 * @source
 */
export const DefaultTextGuidesConfiguration: TTextGuidesConfiguration = {
  enable: true
}

/**
 * @group Recognizer
 */
export type TTextConfConfiguration = {
  customResources?: string[]
  customLexicon?: string[]
  addLKText?: boolean
}

/**
 * @group Recognizer
 */
export type TTextConfiguration = {
  text?: boolean
  mimeTypes: ("text/plain" | "application/vnd.myscript.jiix")[]
  margin: TMarginConfiguration
  guides?: TTextGuidesConfiguration
  configuration?: TTextConfConfiguration
  eraser?: TEraserConfiguration
}

/**
 * @group Recognizer
 * @source
 */
export const DefaultTextConfiguration: TTextConfiguration = {
  guides: DefaultTextGuidesConfiguration,
  eraser: DefaultEraserConfiguration,
  margin: DefaultMarginConfiguration,
  mimeTypes: ["application/vnd.myscript.jiix"],
}
