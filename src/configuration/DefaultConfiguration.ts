import { TConfiguration } from "../@types/Configuration"
import { TGrabberConfiguration } from "../@types/configuration/GrabberConfiguration"
import { TRenderingConfiguration } from "../@types/configuration/RenderingConfiguration"
import { TServerConfiguration } from "../@types/configuration/ServerConfiguration"
import { TRecognitionConfiguration } from "../@types/configuration/RecognitionConfiguration"
import { TTriggerConfiguration } from "../@types/configuration/TriggerConfiguration"
import { TEventConfiguration } from "../@types/configuration/EventConfiguration"
import { TUndoRedoConfiguration } from "../@types/configuration/UndoRedoConfiguration"

export const DefaultServerConfiguration: TServerConfiguration = {
  protocol: "WEBSOCKET",
  scheme: "https",
  host: "cloud.myscript.com",
  applicationKey: "",
  hmacKey: "",
  version: "2.1.0",
  useWindowLocation: false,
  websocket: {
    pingEnabled: true,
    pingDelay: 30000,
    maxPingLostCount: 10,
    autoReconnect: true,
    maxRetryCount: 2,
    fileChunkSize: 300000
  }
}

export const DefaultRecognitionConfiguration: TRecognitionConfiguration = {
  type: "TEXT",
  alwaysConnected: true,
  lang: "en_US",
  gesture: {
    enable: true
  },
  export: {
    "image-resolution": 300,
    jiix: {
      "bounding-box": false,
      strokes: false,
      text: {
        chars: false,
        words: true
      }
    },
  },
  renderer: {
    debug: {
      "draw-text-boxes": false,
      "draw-image-boxes": false
    }
  },
  math: {
    mimeTypes: ["application/x-latex"], // "application/mathml+xml", "application/vnd.myscript.jiix",
    solver: {
      enable: true,
      "fractional-part-digits": 3,
      "decimal-separator": ".",
      "rounding-mode": "half up",
      "angle-unit": "deg"
    },
    margin: {
      bottom: 10,
      left: 15,
      right: 15,
      top: 10
    },
    eraser: {
      "erase-precisely": false
    },
    "undo-redo": {
      mode: "stroke"
    }
  },
  text: {
    guides: {
      enable: true
    },
    mimeTypes: ["application/vnd.myscript.jiix"], // "text/plain"
    margin: {
      top: 20,
      left: 10,
      right: 10,
      bottom: 10
    },
    eraser: {
      "erase-precisely": false
    }
  },
  diagram: {
    mimeTypes: ["application/vnd.myscript.jiix"], // "application/vnd.openxmlformats-officedocument.presentationml.presentation"
    eraser: {
      "erase-precisely": false
    },
    convert: {
      "match-text-size": true
    }
  },
  "raw-content": {
    recognition: {
      text: true,
      shape: false
    },
    eraser: {
      "erase-precisely": false
    }
  }
}

export const DefaultGrabberConfiguration: TGrabberConfiguration = {
  listenerOptions: {
    capture: false,
    passive: true
  },
  xyFloatPrecision: 0,
  timestampFloatPrecision: 0
}

export const DefaultRenderingConfiguration: TRenderingConfiguration = {
  minHeight: 100,
  minWidth: 100,
  smartGuide: {
    enable: true,
    fadeOut: {
      enable: true,
      duration: 5000
    }
  }
}

export const DefaultTriggerConfiguration: TTriggerConfiguration = {
  exportContent: "POINTER_UP",
  exportContentDelay: 1000,
  resizeTriggerDelay: 100
}

export const DefaultEventsConfiguration: TEventConfiguration = {
  processDelay: 10
}

export const DefaultUndoRedoConfiguration: TUndoRedoConfiguration = {
  maxStackSize: 100
}

export const DefaultConfiguration: TConfiguration = {
  server: DefaultServerConfiguration,
  recognition: DefaultRecognitionConfiguration,
  grabber: DefaultGrabberConfiguration,
  rendering: DefaultRenderingConfiguration,
  triggers: DefaultTriggerConfiguration,
  events: DefaultEventsConfiguration,
  "undo-redo": DefaultUndoRedoConfiguration
}
