import { mergeDeep, isVersionSuperiorOrEqual, PartialDeep } from "../utils"
import {
  DefaultShapeConfiguration,
  DefaultExportConfiguration,
  DefaultMathConfiguration,
  DefaultRawContentConfiguration,
  DefaultTextInkRecognizerConfiguration,
  TConvertionConfiguration,
  TShapeConfiguration,
  TExportConfiguration,
  TMathConfiguration,
  TRawContentConfiguration,
  TTextInkRecognizerConfiguration
} from "./recognition"
import { TRecognitionType } from "./RecognitionConfiguration"
import { DefaultServerHTTPConfiguration, TServerHTTPConfiguration } from "./ServerConfiguration"

/**
 * @group Recognizer
 */
export type TInkRecognizerRecognitionConfiguration = {
  type: TRecognitionType
  lang: string
  math: TMathConfiguration
  text: TTextInkRecognizerConfiguration
  shape: TShapeConfiguration
  "raw-content": TRawContentConfiguration
  export: TExportConfiguration
  convert?: TConvertionConfiguration
}

/**
 * @group Recognizer
 * @source
 */
export const DefaultInkRecognizerRecognitionConfiguration: TInkRecognizerRecognitionConfiguration = {
  export: DefaultExportConfiguration,
  math: DefaultMathConfiguration,
  shape: DefaultShapeConfiguration,
  "raw-content": DefaultRawContentConfiguration,
  text: DefaultTextInkRecognizerConfiguration,
  type: "TEXT",
  lang: "en_US",
}

/**
 * @group Recognizer
 */
export type TInkRecognizerConfiguration = {
  server: TServerHTTPConfiguration
  recognition: TInkRecognizerRecognitionConfiguration
}

/**
 * @group Recognizer
 */
export const DefaultInkRecognizerConfiguration: TInkRecognizerConfiguration =
{
  server: DefaultServerHTTPConfiguration,
  recognition: DefaultInkRecognizerRecognitionConfiguration
}

/**
 * @group Recognizer
 * @source
 */
export class InkRecognizerConfiguration implements TInkRecognizerConfiguration {
  recognition: TInkRecognizerRecognitionConfiguration
  server: TServerHTTPConfiguration

  constructor(configuration?: PartialDeep<TInkRecognizerConfiguration>)
  {
    this.server = mergeDeep({}, DefaultInkRecognizerConfiguration.server, configuration?.server)
    this.recognition = mergeDeep({}, DefaultInkRecognizerConfiguration.recognition, configuration?.recognition)

    if (configuration?.recognition?.text?.mimeTypes) {
      this.recognition.text.mimeTypes = configuration.recognition.text.mimeTypes as ("text/plain" | "application/vnd.myscript.jiix")[]
    }
    this.recognition.text.mimeTypes = [...new Set(this.recognition.text.mimeTypes)]

    if (configuration?.recognition?.math?.mimeTypes) {
      this.recognition.math.mimeTypes = configuration.recognition.math.mimeTypes as ("application/vnd.myscript.jiix" | "application/x-latex" | "application/mathml+xml")[]
    }
    this.recognition.math.mimeTypes = [...new Set(this.recognition.math.mimeTypes)]

    if (configuration?.recognition?.shape?.mimeTypes) {
      this.recognition.shape.mimeTypes = configuration.recognition.shape.mimeTypes as ("application/vnd.myscript.jiix" | "application/vnd.openxmlformats-officedocument.presentationml.presentation" | "image/svg+xml")[]
    }
    this.recognition.shape.mimeTypes = [...new Set(this.recognition.shape.mimeTypes)]

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