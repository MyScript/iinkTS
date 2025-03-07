import { mergeDeep, isVersionSuperiorOrEqual, PartialDeep } from "../utils"
import { TExportConfiguration, TTextConfConfiguration } from "./recognition"
import { DefaultServerWebsocketConfiguration, TServerWebsocketConfiguration } from "./ServerConfiguration"

/**
 * @group Recognizer
 */
export type TRecognitionWebSocketConfiguration = {
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
export const DefaultRecognitionWebSocketConfiguration: TRecognitionWebSocketConfiguration = {
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
export type TRecognizerWebSocketConfiguration = {
  server: TServerWebsocketConfiguration
  recognition: TRecognitionWebSocketConfiguration
}

/**
 * @group Recognizer
 * @source
 */
export const DefaultRecognizerWebSocketConfiguration: TRecognizerWebSocketConfiguration =
{
  server: DefaultServerWebsocketConfiguration,
  recognition: DefaultRecognitionWebSocketConfiguration
}

/**
 * @group Recognizer
 */
export class RecognizerWebSocketConfiguration implements TRecognizerWebSocketConfiguration
{
  server: TServerWebsocketConfiguration
  recognition: TRecognitionWebSocketConfiguration

  constructor(configuration?: PartialDeep<TRecognizerWebSocketConfiguration>)
  {
    this.server = mergeDeep({}, DefaultRecognizerWebSocketConfiguration.server, configuration?.server)

    this.recognition = mergeDeep({}, DefaultRecognizerWebSocketConfiguration.recognition, configuration?.recognition)
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
    if (this.server.version && !isVersionSuperiorOrEqual(this.server.version, "3.2.0")) {
      delete this.recognition.export.jiix.text.lines
      delete this.recognition["raw-content"].classification
    }
  }
}
