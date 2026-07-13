import type { TEraserConfiguration } from "./EraserConfiguration"
import { DefaultEraserConfiguration } from "./EraserConfiguration"
import type { TMarginConfiguration } from "./MarginConfiguration"
import { DefaultMarginConfiguration } from "./MarginConfiguration"

/**
 * @group Client
 */
export type TTextGuidesConfiguration = {
  enable: boolean
}

/**
 * @group Client
 * @source
 */
export const DefaultTextGuidesConfiguration: TTextGuidesConfiguration = {
  enable: true,
}

/**
 * @group Client
 */
export type TTextConfConfiguration = {
  customResources?: string[]
  customLexicon?: string[]
  addLKText?: boolean
}

/**
 * @group Client
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
 * @group Client
 * @source
 */
export const DefaultTextConfiguration: TTextConfiguration = {
  guides: DefaultTextGuidesConfiguration,
  eraser: DefaultEraserConfiguration,
  margin: DefaultMarginConfiguration,
  mimeTypes: ["application/vnd.myscript.jiix"],
}
