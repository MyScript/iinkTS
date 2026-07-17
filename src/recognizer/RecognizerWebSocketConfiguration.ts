import type { TPartialDeep } from "@/utils"
import { isVersionSuperiorOrEqual, mergeDeep } from "@/utils"

import type { TExportConfiguration, TTextConfConfiguration } from "./recognition"
import type { TServerWebsocketConfiguration } from "./ServerConfiguration"
import { DefaultServerWebsocketConfiguration } from "./ServerConfiguration"

/**
 * @group Recognizer
 */
export type TRecognitionWebSocketConfiguration = {
  lang: string
  alwaysConnected: boolean
  export: TExportConfiguration
  "raw-content": {
    text?: TTextConfConfiguration
    "session-time"?: number
    recognition?: {
      types: ("text" | "shape" | "math")[]
    }
    classification?: {
      types: ("text" | "shape" | "math")[]
    }
    gestures?: ("underline" | "scratch-out" | "join" | "insert" | "strike-through" | "surround")[]
  }
  gesture: {
    enable: boolean
    ignoreGestureStrokes: boolean
  }
  math?: {
    solver?: {
      "auto-variable-management"?: {
        enable?: boolean
        "scoping-policy"?: "closest" | "last-modified" | "last-edited"
      }
      "angle-unit"?: "deg" | "rad"
    }
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
        lines: true,
      },
    },
  },
  "raw-content": {
    recognition: {
      types: ["text", "shape", "math"],
    },
    classification: {
      types: ["text", "shape", "math"],
    },
    gestures: ["underline", "scratch-out", "strike-through", "surround"],
  },
  lang: "en_US",
  alwaysConnected: true,
  gesture: {
    enable: true,
    ignoreGestureStrokes: false,
  },
  math: {
    solver: {
      "auto-variable-management": {
        enable: true,
        "scoping-policy": "closest",
      },
      "angle-unit": "deg",
    },
  },
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
export const DefaultRecognizerWebSocketConfiguration: TRecognizerWebSocketConfiguration = {
  server: DefaultServerWebsocketConfiguration,
  recognition: DefaultRecognitionWebSocketConfiguration,
}

/**
 * @group Recognizer
 */
export class RecognizerWebSocketConfiguration implements TRecognizerWebSocketConfiguration {
  server: TServerWebsocketConfiguration
  recognition: TRecognitionWebSocketConfiguration

  constructor(configuration?: TPartialDeep<TRecognizerWebSocketConfiguration>) {
    this.server = mergeDeep({}, DefaultRecognizerWebSocketConfiguration.server, configuration?.server)

    this.recognition = mergeDeep({}, DefaultRecognizerWebSocketConfiguration.recognition, configuration?.recognition)
    this.recognition.export.jiix["full-stroke-ids"] = true
    // required to draw stroke with math solver
    this.recognition.export.jiix.strokes = true
    this.recognition.export.jiix.ids = true
    this.recognition.export.jiix.text.words = true
    this.recognition.export.jiix.text.chars = true
    this.recognition.export.jiix.text.lines = true
    this.recognition.export.jiix["bounding-box"] = true
    if (configuration?.recognition?.["raw-content"]?.recognition?.types) {
      this.recognition["raw-content"].recognition!.types = configuration.recognition[
        "raw-content"
      ].recognition.types.filter((t) => !!t)
    }
    if (configuration?.recognition?.["raw-content"]?.classification?.types) {
      this.recognition["raw-content"].classification!.types = configuration.recognition[
        "raw-content"
      ].classification.types.filter((t) => !!t)
    }
    if (configuration?.recognition?.["raw-content"]?.gestures) {
      this.recognition["raw-content"].gestures = configuration.recognition["raw-content"].gestures.filter((g) => !!g)
    }
    if (this.server.version && !isVersionSuperiorOrEqual(this.server.version, "3.2.0")) {
      delete this.recognition.export.jiix.text.lines
      delete this.recognition["raw-content"].classification
    }
  }
}
