import { DefaultMarginConfiguration, TMarginConfiguration } from "./MarginConfiguration"
import { DefaultEraserConfiguration, TEraserConfiguration } from "./EraserConfiguration"

/**
 * @group Configuration
 */
export type TTextGuidesConfiguration = {
  enable: boolean
}

/**
 * @group Configuration
 */
export const DefaultTextGuidesConfiguration: TTextGuidesConfiguration = {
  enable: true
}

/**
 * @group Configuration
 */
export type TTextConfConfiguration = {
  customResources?: string[]
  customLexicon?: string[]
  addLKText?: boolean
}

/**
 * @group Configuration
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
 * @group Configuration
 */
export const DefaultTextConfiguration: TTextConfiguration = {
  guides: DefaultTextGuidesConfiguration,
  eraser: DefaultEraserConfiguration,
  margin: DefaultMarginConfiguration,
  mimeTypes: ["application/vnd.myscript.jiix"],
}
