import type { TPartialDeep } from "@/utils"
import { isVersionSuperiorOrEqual, mergeDeep } from "@/utils"

import type {
  TConvertionConfiguration,
  TDiagramConfiguration,
  TExportConfiguration,
  TMathConfiguration,
  TRawContentConfiguration,
  TRecognitionRendererConfiguration,
  TTextConfiguration,
} from "./recognition"
import {
  DefaultDiagramConfiguration,
  DefaultExportConfiguration,
  DefaultMathConfiguration,
  DefaultRawContentConfiguration,
  DefaultRecognitionRendererConfiguration,
  DefaultTextConfiguration,
} from "./recognition"
import type { TRecognitionTypeV1 } from "./RecognitionConfiguration"
import type { TServerHTTPConfiguration } from "./ServerConfiguration"
import { DefaultServerHTTPConfiguration } from "./ServerConfiguration"

/**
 * @group Client
 */
export type TRecognitionHTTPV1Configuration = {
  type: TRecognitionTypeV1
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
 * @group Client
 * @source
 */
export const DefaulRecognitionHTTPV1ConfigurationConfiguration: TRecognitionHTTPV1Configuration = {
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
 * @group Client
 */
export type THTTPClientV1Configuration = {
  server: TServerHTTPConfiguration
  recognition: TRecognitionHTTPV1Configuration
}

/**
 * @group Client
 */
export const DefaultHTTPClientV1Configuration: THTTPClientV1Configuration = {
  server: DefaultServerHTTPConfiguration,
  recognition: DefaulRecognitionHTTPV1ConfigurationConfiguration,
}

/**
 * @group Client
 * @source
 */
export class HTTPClientV1Configuration implements THTTPClientV1Configuration {
  recognition: TRecognitionHTTPV1Configuration
  server: TServerHTTPConfiguration

  constructor(configuration?: TPartialDeep<THTTPClientV1Configuration>) {
    this.server = mergeDeep({}, DefaultHTTPClientV1Configuration.server, configuration?.server)
    this.recognition = mergeDeep({}, DefaultHTTPClientV1Configuration.recognition, configuration?.recognition)

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

    if (configuration?.recognition?.diagram?.mimeTypes) {
      this.recognition.diagram.mimeTypes = configuration.recognition.diagram.mimeTypes as (
        | "application/vnd.myscript.jiix"
        | "application/vnd.openxmlformats-officedocument.presentationml.presentation"
        | "image/svg+xml"
      )[]
    }
    this.recognition.diagram.mimeTypes = [...new Set(this.recognition.diagram.mimeTypes)]

    if (configuration?.recognition?.diagram?.convert?.types) {
      this.recognition.diagram.convert!.types = configuration.recognition.diagram.convert.types as ("text" | "shape")[]
    }

    if (configuration?.recognition?.["raw-content"]?.recognition?.types) {
      this.recognition["raw-content"].recognition!.types = configuration?.recognition?.["raw-content"]?.recognition
        ?.types as ("text" | "shape")[]
    }
    this.recognition["raw-content"].recognition.types = [
      ...new Set(this.recognition["raw-content"].recognition.types.filter((type) => type !== "decoration")),
    ]

    if (configuration?.recognition?.["raw-content"]?.classification?.types) {
      this.recognition["raw-content"].classification!.types = configuration?.recognition?.["raw-content"]
        ?.classification?.types as ("text" | "shape")[]
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
