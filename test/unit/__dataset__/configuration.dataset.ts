//@ts-nocheck
import {
  PartialDeep,
  TInteractiveInkEditorConfiguration,
  TInteractiveInkSSREditorConfiguration,
  TRecognizerHTTPV1Configuration,
  TRecognizerWebSocketSSRConfiguration
} from "../../../src/iink"

export const RecognizerWebSocketSSRTextConfiguration: TRecognizerWebSocketSSRConfiguration = {
  server: {
    scheme: 'http',
    host: 'test.com',
    applicationKey: 'XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX',
    hmacKey: 'YYYYYYYY-YYYY-YYYY-YYYY-YYYYYYYYYYYY',
    version: "3.0.0",
    websocket: {
      pingEnabled: false,
      pingDelay: 100
    }
  },
  recognition: {
    lang: "en_US",
    type: 'TEXT',
    text: {
      mimeTypes: ['text/plain', 'application/vnd.myscript.jiix'],
      margin: {
        bottom: 12,
        left: 12,
        right: 12,
        top: 12
      },
    }
  }
}

export const RecognizerWebSocketSSRMathConfiguration: TRecognizerWebSocketSSRConfiguration = {
    server: {
      scheme: 'http',
      host: 'test.com',
      applicationKey: 'XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX',
      hmacKey: 'YYYYYYYY-YYYY-YYYY-YYYY-YYYYYYYYYYYY',
      version: "3.0.0",
      websocket: {
        pingEnabled: false
      }
    },
    recognition: {
      lang: "en_US",
      type: 'MATH',
      math: {
        mimeTypes: ["application/vnd.myscript.jiix"],
      }
    }
  }

export const RecognizerHTTPV1TextConfiguration: TRecognizerHTTPV1Configuration = {
  server: {
    scheme: 'http',
    host: 'test.com',
    applicationKey: 'XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX',
    hmacKey: 'YYYYYYYY-YYYY-YYYY-YYYY-YYYYYYYYYYYY',
    version: "3.0.0"
  },
  recognition: {
    type: 'TEXT',
    text: {
      mimeTypes: ['text/plain', 'application/vnd.myscript.jiix'],
      margin: {
        bottom: 12,
        left: 12,
        right: 12,
        top: 12
      },
    }
  }
}

export const RecognizerHTTPV1DiagramConfiguration: TRecognizerHTTPV1Configuration = {
  server: {
    scheme: 'http',
    host: 'test.com',
    applicationKey: 'XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX',
    hmacKey: 'YYYYYYYY-YYYY-YYYY-YYYY-YYYYYYYYYYYY',
    version: "3.0.0"
  },
  recognition: {
    type: 'DIAGRAM',
    diagram: {
      mimeTypes: ['application/vnd.myscript.jiix']
    }
  }
}

export const RecognizerHTTPV1MathConfiguration: TRecognizerHTTPV1Configuration = {
  server: {
    scheme: 'http',
    host: 'test.com',
    applicationKey: 'XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX',
    hmacKey: 'YYYYYYYY-YYYY-YYYY-YYYY-YYYYYYYYYYYY',
    version: "3.0.0"
  },
  recognition: {
    type: 'MATH',
    math: {
      mimeTypes: ['application/vnd.myscript.jiix']
    }
  }
}

export const RecognizerHTTPV1RawContentConfiguration: TRecognizerHTTPV1Configuration = {
  server: {
    scheme: 'http',
    host: 'test.com',
    applicationKey: 'XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX',
    hmacKey: 'YYYYYYYY-YYYY-YYYY-YYYY-YYYYYYYYYYYY',
    version: "3.0.0"
  },
  recognition: {
    type: 'Raw Content',
  }
}

export const InteractiveInkEditorOverrideConfiguration: TInteractiveInkEditorConfiguration = {
  server: {
    scheme: 'http',
    host: 'test.com',
    applicationKey: 'XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX',
    hmacKey: 'YYYYYYYY-YYYY-YYYY-YYYY-YYYYYYYYYYYY',
    version: '2.0.4',
    websocket: {
      pingEnabled: false,
      pingDelay: 100,
      maxPingLostCount: 42,
      autoReconnect: false,
      maxRetryCount: 42,
      fileChunkSize: 42
    }
  },
  recognition: {
    alwaysConnected: false,
    lang: 'fr_FR',
    gesture: {
      enable: false
    },
    export: {
      'image-resolution': 12,
      jiix: {
        'bounding-box': true,
        strokes: true,
        "full-stroke-ids": true,
        ids: true,
        text: {
          chars: true,
          words: false
        }
      },
    },
    'raw-content': {
      recognition: {
        text: false,
        shape: true
      },
      eraser: {
        'erase-precisely': true
      },
      gestures: ["scratch-out"]
    }
  },
  grabber: {
    listenerOptions: {
      capture: true,
      passive: false
    },
    xyFloatPrecision: 27,
    timestampFloatPrecision: 27
  },
  renderer: {
    minHeight: 42,
    minWidth: 42,
    guides: {
      enable: true,
      gap: 27,
      type: "grid"
    }
  },
  triggers: {
    exportContent: 'DEMAND',
    exportContentDelay: 5,
    resizeTriggerDelay: 5
  },
  'undo-redo': {
    maxStackSize: 10
  }
}
