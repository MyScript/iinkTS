import { DefaultMarginConfiguration, TMarginConfiguration } from "./MarginConfiguration"
import { DefaultEraserConfiguration, TEraserConfiguration } from "./EraserConfiguration"

/**
 * @group Recognizer
 */
export type TTextGuidesInkRecognizerConfiguration = {
  enable: boolean,
  "line-gap-mm"?: number,
  "origin-y-mm"?: number,
}

/**
 * @group Recognizer
 * @source
 */
export const DefaultTextGuidesInkRecognizerConfiguration: TTextGuidesInkRecognizerConfiguration = {
  enable: true,
  "line-gap-mm": 100,
  "origin-y-mm": 0,
}

/**
 * @group Recognizer
 */
export type TTextInkRecognizerConfConfiguration = {
  customResources?: string[]
  customLexicon?: string[]
  addLKText?: boolean
}

/**
 * @group Recognizer
 */
export type TTextInkRecognizerConfiguration = {
  text?: boolean
  mimeTypes: ("text/plain" | "application/vnd.myscript.jiix")[]
  margin: TMarginConfiguration
  guides: TTextGuidesInkRecognizerConfiguration
  configuration?: TTextInkRecognizerConfConfiguration
  eraser?: TEraserConfiguration
}

/**
 * @group Recognizer
 * @source
 */
export const DefaultTextInkRecognizerConfiguration: TTextInkRecognizerConfiguration = {
  guides: DefaultTextGuidesInkRecognizerConfiguration,
  eraser: DefaultEraserConfiguration,
  margin: DefaultMarginConfiguration,
  mimeTypes: ["application/vnd.myscript.jiix"],
}
