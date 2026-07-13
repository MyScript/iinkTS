import type { TPartialDeep } from "@/utils"
import { isVersionSuperiorOrEqual, mergeDeep } from "@/utils"

import type {
  TConvertionConfiguration,
  TExportConfiguration,
  TMathConfiguration,
  TRawContentConfiguration,
  TShapeConfiguration,
  TTextHTTPClientV2Configuration,
} from "./recognition"
import {
  DefaultExportConfiguration,
  DefaultMathV2Configuration,
  DefaultRawContentV2Configuration,
  DefaultShapeConfiguration,
  DefaultTexConfigurationV2,
} from "./recognition"
import type { TRecognitionTypeV2 } from "./RecognitionConfiguration"
import type { TServerHTTPConfiguration } from "./ServerConfiguration"
import { DefaultServerHTTPConfiguration } from "./ServerConfiguration"

/**
 * @group Client
 */
export type THTTPClientV2RecognitionConfiguration = {
  type: TRecognitionTypeV2
  lang: string
  math: TMathConfiguration
  text: TTextHTTPClientV2Configuration
  shape: TShapeConfiguration
  "raw-content": TRawContentConfiguration
  export: TExportConfiguration
  convert?: TConvertionConfiguration
}

/**
 * @group Client
 * @source
 */
export const DefaultHTTPClientV2RecognitionConfiguration: THTTPClientV2RecognitionConfiguration = {
  export: DefaultExportConfiguration,
  math: DefaultMathV2Configuration,
  shape: DefaultShapeConfiguration,
  "raw-content": DefaultRawContentV2Configuration,
  text: DefaultTexConfigurationV2,
  type: "TEXT",
  lang: "en_US",
}

/**
 * @group Client
 */
export type THTTPClientV2Configuration = {
  server: TServerHTTPConfiguration
  recognition: THTTPClientV2RecognitionConfiguration
}

/**
 * @group Client
 */
export const DefaultHTTPClientV2Configuration: THTTPClientV2Configuration = {
  server: DefaultServerHTTPConfiguration,
  recognition: DefaultHTTPClientV2RecognitionConfiguration,
}

/**
 * @group Client
 * @source
 */
export class HTTPClientV2Configuration implements THTTPClientV2Configuration {
  recognition: THTTPClientV2RecognitionConfiguration
  server: TServerHTTPConfiguration

  constructor(configuration?: TPartialDeep<THTTPClientV2Configuration>) {
    this.server = mergeDeep({}, DefaultHTTPClientV2Configuration.server, configuration?.server)
    this.recognition = mergeDeep({}, DefaultHTTPClientV2Configuration.recognition, configuration?.recognition)

    if (configuration?.recognition?.text?.mimeTypes) {
      this.recognition.text.mimeTypes = configuration.recognition.text.mimeTypes.filter((t) => !!t)
    }
    this.recognition.text.mimeTypes = [...new Set(this.recognition.text.mimeTypes)]

    if (configuration?.recognition?.math?.mimeTypes) {
      this.recognition.math.mimeTypes = configuration.recognition.math.mimeTypes.filter((t) => !!t)
    }
    this.recognition.math.mimeTypes = [...new Set(this.recognition.math.mimeTypes)]

    if (configuration?.recognition?.shape?.mimeTypes) {
      this.recognition.shape.mimeTypes = configuration.recognition.shape.mimeTypes.filter((t) => !!t)
    }
    this.recognition.shape.mimeTypes = [...new Set(this.recognition.shape.mimeTypes)]

    if (configuration?.recognition?.["raw-content"]?.recognition?.types) {
      this.recognition["raw-content"].recognition!.types = configuration?.recognition?.[
        "raw-content"
      ]?.recognition?.types.filter((t) => !!t)
    }
    if (configuration?.recognition?.["raw-content"]?.classification?.types) {
      this.recognition["raw-content"].classification!.types = configuration?.recognition?.[
        "raw-content"
      ]?.classification?.types.filter((t) => !!t)
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
