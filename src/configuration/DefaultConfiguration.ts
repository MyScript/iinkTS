import {
  TConfiguration,
  TGrabberConfiguration,
  TRenderingConfiguration,
  TServerConfiguration,
  TRecognitionConfiguration,
  TTriggerConfiguration,
  TUndoRedoConfiguration,
  TLoggerConfiguration,
  LoggerClass,
  LoggerLevel
} from "../@types"

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
      },
    },
  },
  renderer: {
    debug: {
      "draw-text-boxes": false,
      "draw-image-boxes": false
    }
  },
  math: {
    mimeTypes: ["application/vnd.myscript.jiix"], // "application/mathml+xml", "application/x-latex" ,
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
      shape: true
    },
    eraser: {
      "erase-precisely": false
    },
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
      enable: false,
      duration: 5000
    }
  },
  guides: {
    enable: true,
    gap: 50
  }
}

export const DefaultTriggerConfiguration: TTriggerConfiguration = {
  exportContent: "POINTER_UP",
  exportContentDelay: 1000,
  resizeTriggerDelay: 100
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
  "undo-redo": DefaultUndoRedoConfiguration
}

export const DefaultLoggerConfiguration: TLoggerConfiguration = {
  [LoggerClass.EDITOR]: LoggerLevel.ERROR,
  [LoggerClass.BEHAVIORS]: LoggerLevel.ERROR,
  [LoggerClass.RECOGNIZER]: LoggerLevel.ERROR,
  [LoggerClass.GRABBER]: LoggerLevel.ERROR,
  [LoggerClass.RENDERER]: LoggerLevel.ERROR,
  [LoggerClass.CONFIGURATION]: LoggerLevel.ERROR,
  [LoggerClass.PUBLIC_EVENT]: LoggerLevel.ERROR,
  [LoggerClass.INTERNAL_EVENT]: LoggerLevel.ERROR,
  [LoggerClass.MODEL]: LoggerLevel.ERROR,
  [LoggerClass.STROKE]: LoggerLevel.ERROR,
  [LoggerClass.SMARTGUIDE]: LoggerLevel.ERROR,
  [LoggerClass.STYLE]: LoggerLevel.ERROR,
  [LoggerClass.UNDO_REDO]: LoggerLevel.ERROR
}
