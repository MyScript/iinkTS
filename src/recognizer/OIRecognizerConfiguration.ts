import { mergeDeep, isVersionSuperiorOrEqual, PartialDeep } from "../utils"
import { TExportConfiguration, TTextConfConfiguration } from "./recognition"
import { DefaultServerWebsocketConfiguration, TServerWebsocketConfiguration } from "./ServerConfiguration"

/**
 * @group Recognizer
 */
export type TOIRecognitionConfiguration = {
  lang: string
  export: TExportConfiguration
  "raw-content": {
    text?: TTextConfConfiguration
    "session-time"?: number
    recognition?: {
      types: ("text" | "shape")[]
    }
    classification?: {
      types: ("text" | "shape")[]
    }
    gestures?: ("underline" | "scratch-out" | "join" | "insert" | "strike-through" | "surround")[]
  }
  gesture: {
    enable: boolean,
    ignoreGestureStrokes: boolean
  }
}

/**
 * @group Recognizer
 * @source
 */
export const DefaultOffscreenRecognitionConfiguration: TOIRecognitionConfiguration = {
  export: {
    jiix: {
      "bounding-box": true,
      "full-stroke-ids": true,
      ids: true,
      strokes: false,
      text: {
        chars: true,
        words: true,
        lines: true
      }
    }
  },
  "raw-content": {
    recognition: {
      types: ["text", "shape"]
    },
    classification: {
      types: ["text", "shape"]
    },
    gestures: ["underline", "scratch-out", "join", "insert", "strike-through", "surround"]
  },
  lang: "en_US",
  gesture: {
    enable: true,
    ignoreGestureStrokes: false,
  }
}

/**
 * @group Recognizer
 */
export type TOIRecognizerConfiguration = {
  server: TServerWebsocketConfiguration
  recognition: TOIRecognitionConfiguration
}

/**
 * @group Recognizer
 * @source
 */
export const DefaultOIRecognizerConfiguration: TOIRecognizerConfiguration =
{
  server: DefaultServerWebsocketConfiguration,
  recognition: DefaultOffscreenRecognitionConfiguration
}

/**
 * @group Recognizer
 */
export class OIRecognizerConfiguration implements TOIRecognizerConfiguration
{
  server: TServerWebsocketConfiguration
  recognition: TOIRecognitionConfiguration

  constructor(configuration?: PartialDeep<TOIRecognizerConfiguration>)
  {
    this.server = mergeDeep({}, DefaultOIRecognizerConfiguration.server, configuration?.server)

    this.recognition = mergeDeep({}, DefaultOIRecognizerConfiguration.recognition, configuration?.recognition)
    this.recognition.export.jiix["full-stroke-ids"] = true
    this.recognition.export.jiix.ids = true
    this.recognition.export.jiix.text.words = true
    this.recognition.export.jiix.text.chars = true
    this.recognition.export.jiix.text.lines = true
    this.recognition.export.jiix["bounding-box"] = true
    if (configuration?.recognition?.["raw-content"]?.recognition?.types) {
      this.recognition["raw-content"].recognition!.types = configuration.recognition["raw-content"].recognition.types as ("text" | "shape")[]
    }
    if (configuration?.recognition?.["raw-content"]?.classification?.types) {
      this.recognition["raw-content"].classification!.types = configuration.recognition["raw-content"].classification.types as ("text" | "shape")[]
    }
    if (configuration?.recognition?.["raw-content"]?.gestures) {
      this.recognition["raw-content"].gestures = configuration.recognition["raw-content"].gestures as ("underline" | "scratch-out" | "join" | "insert" | "strike-through" | "surround")[]
    }
    if (!isVersionSuperiorOrEqual(this.server.version, "3.2.0")) {
      delete this.recognition.export.jiix.text.lines
      delete this.recognition["raw-content"].classification
    }
  }
}
