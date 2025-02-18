import { isVersionSuperiorOrEqual, mergeDeep, PartialDeep } from "../utils"
import {
  DefaultDiagramConfiguration,
  DefaultExportConfiguration,
  DefaultMathConfiguration,
  DefaultRawContentConfiguration,
  DefaultRecognitionRendererConfiguration,
  DefaultTextConfiguration,
  TConvertionConfiguration,
  TDiagramConfiguration,
  TExportConfiguration,
  TMathConfiguration,
  TRawContentConfiguration,
  TRecognitionRendererConfiguration,
  TTextConfiguration
} from "./recognition"
import { TRecognitionType } from "./RecognitionConfiguration"
import { DefaultServerHTTPConfiguration, TServerHTTPConfiguration } from "./ServerConfiguration"

/**
 * @group Recognizer
 */
export type TInkDeprecatedRecognitionConfiguration = {
  type: TRecognitionType
  lang: string
  math: TMathConfiguration
  text: TTextConfiguration
  diagram: TDiagramConfiguration
  "raw-content": TRawContentConfiguration
  renderer: TRecognitionRendererConfiguration
  export: TExportConfiguration
  convert?: TConvertionConfiguration
}

/**
 * @group Recognizer
 * @source
 */
export const DefaultInkDeprecatedRecognitionConfiguration: TInkDeprecatedRecognitionConfiguration = {
  export: DefaultExportConfiguration,
  math: DefaultMathConfiguration,
  diagram: DefaultDiagramConfiguration,
  "raw-content": DefaultRawContentConfiguration,
  renderer: DefaultRecognitionRendererConfiguration,
  text: DefaultTextConfiguration,
  type: "TEXT",
  lang: "en_US",
}

/**
 * @group Recognizer
 */
export type TInkDeprecatedRecognizerConfiguration = {
  server: TServerHTTPConfiguration
  recognition: TInkDeprecatedRecognitionConfiguration
}

/**
 * @group Recognizer
 */
export const DefaultInkDeprecatedRecognizerConfiguration: TInkDeprecatedRecognizerConfiguration =
{
  server: DefaultServerHTTPConfiguration,
  recognition: DefaultInkDeprecatedRecognitionConfiguration
}

/**
 * @group Recognizer
 * @source
 */
export class InkDeprecatedRecognizerConfiguration implements TInkDeprecatedRecognizerConfiguration {
  recognition: TInkDeprecatedRecognitionConfiguration
  server: TServerHTTPConfiguration

  constructor(configuration?: PartialDeep<TInkDeprecatedRecognizerConfiguration>)
  {
    this.server = mergeDeep({}, DefaultInkDeprecatedRecognizerConfiguration.server, configuration?.server)
    this.recognition = mergeDeep({}, DefaultInkDeprecatedRecognizerConfiguration.recognition, configuration?.recognition)

    if (configuration?.recognition?.text?.mimeTypes) {
      this.recognition.text.mimeTypes = configuration.recognition.text.mimeTypes as ("text/plain" | "application/vnd.myscript.jiix")[]
    }
    this.recognition.text.mimeTypes = [...new Set(this.recognition.text.mimeTypes)]

    if (configuration?.recognition?.math?.mimeTypes) {
      this.recognition.math.mimeTypes = configuration.recognition.math.mimeTypes as ("application/vnd.myscript.jiix" | "application/x-latex" | "application/mathml+xml")[]
    }
    this.recognition.math.mimeTypes = [...new Set(this.recognition.math.mimeTypes)]

    if (configuration?.recognition?.diagram?.mimeTypes) {
      this.recognition.diagram.mimeTypes = configuration.recognition.diagram.mimeTypes as ("application/vnd.myscript.jiix" | "application/vnd.openxmlformats-officedocument.presentationml.presentation" | "image/svg+xml")[]
    }
    this.recognition.diagram.mimeTypes = [...new Set(this.recognition.diagram.mimeTypes)]

    if (configuration?.recognition?.diagram?.convert?.types) {
      this.recognition.diagram.convert!.types = configuration.recognition.diagram.convert.types as ("text" | "shape")[]
    }

    if (configuration?.recognition?.["raw-content"]?.recognition?.types) {
      this.recognition["raw-content"].recognition!.types = configuration?.recognition?.["raw-content"]?.recognition?.types as ("text" | "shape")[]
    }
    if (configuration?.recognition?.["raw-content"]?.classification?.types) {
      this.recognition["raw-content"].classification!.types = configuration?.recognition?.["raw-content"]?.classification?.types as ("text" | "shape")[]
    }
    if (this.server.version) {
      if (!isVersionSuperiorOrEqual(this.server.version, "2.3.0")) {
        delete this.recognition.convert
      }
      if (!isVersionSuperiorOrEqual(this.server.version, "3.2.0")) {
        delete this.recognition.export.jiix.text.lines
      }
    }
  }
}
