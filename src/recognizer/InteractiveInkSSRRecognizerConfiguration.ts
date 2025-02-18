import { isVersionSuperiorOrEqual, mergeDeep, PartialDeep } from "../utils"
import {
  DefaultExportConfiguration,
  DefaultMathConfiguration,
  DefaultRecognitionRendererConfiguration,
  DefaultTextConfiguration,
  TConvertionConfiguration,
  TExportConfiguration,
  TMathConfiguration,
  TRecognitionRendererConfiguration,
  TTextConfiguration
} from "./recognition"
import { TRecognitionType } from "./RecognitionConfiguration"
import { DefaultServerWebsocketConfiguration, TServerWebsocketConfiguration } from "./ServerConfiguration"

/**
 * @group Recognizer
 */
export type TInteractiveInkSSRRecognitionConfiguration = {
  type: Omit<TRecognitionType, "DIAGRAM" | "Raw Content">
  lang: string
  math: TMathConfiguration
  text: TTextConfiguration
  renderer: TRecognitionRendererConfiguration
  export: TExportConfiguration
  convert?: TConvertionConfiguration
}

/**
 * @group Recognizer
 * @source
 */
export const DefaultInteractiveInkSSRRecognitionConfiguration: TInteractiveInkSSRRecognitionConfiguration = {
  export: DefaultExportConfiguration,
  math: DefaultMathConfiguration,
  renderer: DefaultRecognitionRendererConfiguration,
  text: DefaultTextConfiguration,
  type: "TEXT",
  lang: "en_US",
}

/**
 * @group Recognizer
 */
export type TInteractiveInkSSRRecognizerConfiguration = {
  server: TServerWebsocketConfiguration
  recognition: TInteractiveInkSSRRecognitionConfiguration
}

/**
 * @group Recognizer
 * @source
 */
export const DefaultInteractiveInkSSRRecognizerConfiguration: TInteractiveInkSSRRecognizerConfiguration =
{
  server: DefaultServerWebsocketConfiguration,
  recognition: DefaultInteractiveInkSSRRecognitionConfiguration
}

/**
 * @group Recognizer
 */
export class InteractiveInkSSRRecognizerConfiguration implements TInteractiveInkSSRRecognizerConfiguration
{
  recognition: TInteractiveInkSSRRecognitionConfiguration
  server: TServerWebsocketConfiguration

  constructor(configuration?: PartialDeep<TInteractiveInkSSRRecognizerConfiguration>) {
    this.server = mergeDeep({}, DefaultInteractiveInkSSRRecognizerConfiguration.server, configuration?.server)
    this.recognition = mergeDeep({}, DefaultInteractiveInkSSRRecognizerConfiguration.recognition, configuration?.recognition)

    if (configuration?.recognition?.text?.mimeTypes) {
      this.recognition.text.mimeTypes = configuration.recognition.text.mimeTypes as ("text/plain" | "application/vnd.myscript.jiix")[]
    }
    this.recognition.text.mimeTypes = [...new Set(this.recognition.text.mimeTypes)]

    if (configuration?.recognition?.math?.mimeTypes) {
      this.recognition.math.mimeTypes = configuration.recognition.math.mimeTypes as ("application/vnd.myscript.jiix" | "application/x-latex" | "application/mathml+xml")[]
    }
    this.recognition.math.mimeTypes = [...new Set(this.recognition.math.mimeTypes)]

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