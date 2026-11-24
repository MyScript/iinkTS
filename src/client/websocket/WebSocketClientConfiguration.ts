import type { TPartialDeep } from "@/core"
import { isVersionSuperiorOrEqual, mergeDeep } from "@/core"

import {
  DefaultSolverConfiguration,
  type TAutoVariableManagement,
  type TExportConfiguration,
  type TSolverConfiguration,
  type TTextConfConfiguration,
} from "../recognition"
import type { TServerWebsocketConfiguration } from "../shared/ServerConfiguration"
import { DefaultServerWebsocketConfiguration } from "../shared/ServerConfiguration"

/**
 * Content kinds the Interactive Ink session can recognize.
 * @group Client
 */
export type TRecognitionType = "text" | "shape" | "math"

/**
 * Gestures the Interactive Ink session can detect, as listed in `raw-content.gestures`.
 * @group Client
 */
export type TRecognitionGesture = "underline" | "scratch-out" | "join" | "insert" | "strike-through" | "surround"

/**
 * @group Client
 */
export type TRecognitionWebSocketConfiguration = {
  lang: string
  alwaysConnected: boolean
  export: TExportConfiguration
  "raw-content": {
    text?: TTextConfConfiguration
    "session-time"?: number
    recognition?: {
      types: TRecognitionType[]
    }
    classification?: {
      types: TRecognitionType[]
    }
    gestures?: TRecognitionGesture[]
  }
  gesture: {
    enable: boolean
    ignoreGestureStrokes: boolean
  }
  math?: TSolverConfiguration & {
    solver?: TSolverConfiguration & {
      "auto-variable-management"?: TAutoVariableManagement
    }
  }
}

/**
 * @group Client
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
    ignoreGestureStrokes: true,
  },
  math: {
    solver: {
      ...DefaultSolverConfiguration,
      "auto-variable-management": {
        enable: true,
        "scoping-policy": "closest",
      },
    },
  },
}

/**
 * @group Client
 */
export type TWebSocketClientConfiguration = {
  server: TServerWebsocketConfiguration
  recognition: TRecognitionWebSocketConfiguration
}

/**
 * @group Client
 * @source
 */
export const DefaultWebSocketClientConfiguration: TWebSocketClientConfiguration = {
  server: DefaultServerWebsocketConfiguration,
  recognition: DefaultRecognitionWebSocketConfiguration,
}

/**
 * @group Client
 */
export class WebSocketClientConfiguration implements TWebSocketClientConfiguration {
  server: TServerWebsocketConfiguration
  recognition: TRecognitionWebSocketConfiguration

  constructor(configuration?: TPartialDeep<TWebSocketClientConfiguration>) {
    this.server = mergeDeep<TServerWebsocketConfiguration>(
      {},
      DefaultWebSocketClientConfiguration.server,
      configuration?.server
    )

    this.recognition = mergeDeep<TRecognitionWebSocketConfiguration>(
      {},
      DefaultWebSocketClientConfiguration.recognition,
      configuration?.recognition
    )
    this.recognition.export.jiix["full-stroke-ids"] = true
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
