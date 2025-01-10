import {
  TDiagramConfiguration,
  TExportConfiguration,
  TMathConfiguration,
  TRawContentConfiguration,
  TRecognitionRendererConfiguration,
  TTextConfiguration,
  TConvertionConfiguration,
  DefaultDiagramConfiguration,
  DefaultExportConfiguration,
  DefaultRecognitionRendererConfiguration,
  DefaultRawContentConfiguration,
  DefaultMathConfiguration,
  DefaultTextConfiguration,
  DefaultConvertionConfiguration,
} from "./recognition"

/**
 * @group Configuration
 */
export type TRecognitionType = "TEXT" | "MATH" | "DIAGRAM" | "Raw Content"

/**
 * @group Configuration
 */
export type TConverstionState = "DIGITAL_EDIT" | "HANDWRITING"

/**
 * @group Configuration
 */
export type TRecognitionConfiguration = {
  type: TRecognitionType
  alwaysConnected: boolean
  lang: string
  math: TMathConfiguration
  text: TTextConfiguration
  diagram: TDiagramConfiguration
  renderer: TRecognitionRendererConfiguration
  export: TExportConfiguration
  "raw-content": TRawContentConfiguration
  gesture: {
    enable: boolean,
    ignoreGestureStrokes: boolean
  }
  convert?: TConvertionConfiguration
}

/**
 * @group Configuration
 */
export const DefaultRecognitionConfiguration: TRecognitionConfiguration = {
  diagram: DefaultDiagramConfiguration,
  export: DefaultExportConfiguration,
  math: DefaultMathConfiguration,
  "raw-content": DefaultRawContentConfiguration,
  renderer: DefaultRecognitionRendererConfiguration,
  text: DefaultTextConfiguration,
  type: "TEXT",
  alwaysConnected: true,
  lang: "en_US",
  gesture: {
    enable: true,
    ignoreGestureStrokes: false,
  },
  convert: DefaultConvertionConfiguration,
}
