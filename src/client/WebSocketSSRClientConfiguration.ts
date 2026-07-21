import type { TPartialDeep } from "@/utils"
import { isVersionSuperiorOrEqual, mergeDeep } from "@/utils"

import type {
  TConvertionConfiguration,
  TExportConfiguration,
  TMathConfiguration,
  TRecognitionRendererConfiguration,
  TTextConfiguration,
} from "./recognition"
import {
  DefaultExportConfiguration,
  DefaultMathConfiguration,
  DefaultRecognitionRendererConfiguration,
  DefaultTextConfiguration,
} from "./recognition"
import type { TRecognitionTypeV1 } from "./RecognitionConfiguration"
import type { TServerWebsocketConfiguration } from "./ServerConfiguration"
import { DefaultServerWebsocketConfiguration } from "./ServerConfiguration"

/**
 * @group Client
 */
export type TWebSocketSSRClientRecognitionConfiguration = {
  type: Omit<TRecognitionTypeV1, "DIAGRAM" | "Raw Content">
  lang: string
  math: TMathConfiguration
  text: TTextConfiguration
  renderer: TRecognitionRendererConfiguration
  export: TExportConfiguration
  convert?: TConvertionConfiguration
}

/**
 * @group Client
 * @source
 */
export const DefaultWebSocketSSRClientRecognitionConfiguration: TWebSocketSSRClientRecognitionConfiguration = {
  export: DefaultExportConfiguration,
  math: DefaultMathConfiguration,
  renderer: DefaultRecognitionRendererConfiguration,
  text: DefaultTextConfiguration,
  type: "TEXT",
  lang: "en_US",
}

/**
 * @group Client
 */
export type TWebSocketSSRClientConfiguration = {
  server: TServerWebsocketConfiguration
  recognition: TWebSocketSSRClientRecognitionConfiguration
}

/**
 * @group Client
 * @source
 */
export const DefaultWebSocketSSRClientConfiguration: TWebSocketSSRClientConfiguration = {
  server: DefaultServerWebsocketConfiguration,
  recognition: DefaultWebSocketSSRClientRecognitionConfiguration,
}

/**
 * @group Client
 */
export class WebSocketSSRClientConfiguration implements TWebSocketSSRClientConfiguration {
  recognition: TWebSocketSSRClientRecognitionConfiguration
  server: TServerWebsocketConfiguration

  constructor(configuration?: TPartialDeep<TWebSocketSSRClientConfiguration>) {
    this.server = mergeDeep({}, DefaultWebSocketSSRClientConfiguration.server, configuration?.server)
    this.recognition = mergeDeep({}, DefaultWebSocketSSRClientConfiguration.recognition, configuration?.recognition)

    if (configuration?.recognition?.text?.mimeTypes) {
      this.recognition.text.mimeTypes = configuration.recognition.text.mimeTypes as (
        "text/plain" | "application/vnd.myscript.jiix"
      )[]
    }
    this.recognition.text.mimeTypes = [...new Set(this.recognition.text.mimeTypes)]

    if (configuration?.recognition?.math?.mimeTypes) {
      this.recognition.math.mimeTypes = configuration.recognition.math.mimeTypes as (
        "application/vnd.myscript.jiix" | "application/x-latex" | "application/mathml+xml"
      )[]
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
