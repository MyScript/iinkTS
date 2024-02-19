//@ts-nocheck
import { PartialDeep, TConfiguration } from "../../../src/iink"

export const ConfigurationTextWebsocket: PartialDeep<TConfiguration> = {
  server: {
    protocol: 'WEBSOCKET',
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

export const ConfigurationMathWebsocket: PartialDeep<TConfiguration> = {
  server: {
    protocol: 'WEBSOCKET',
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

export const ConfigurationTextRest: PartialDeep<TConfiguration> = {
  server: {
    protocol: 'REST',
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

export const ConfigurationDiagramRest: PartialDeep<TConfiguration> = {
  server: {
    protocol: 'REST',
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

export const ConfigurationMathRest: PartialDeep<TConfiguration> = {
  server: {
    protocol: 'REST',
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

export const ConfigurationRawContentRest: PartialDeep<TConfiguration> = {
  server: {
    protocol: 'REST',
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

export const AllOverrideConfiguration: PartialDeep<TConfiguration> = {
  server: {
    protocol: 'REST',
    scheme: 'http',
    host: 'test.com',
    applicationKey: 'XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX',
    hmacKey: 'YYYYYYYY-YYYY-YYYY-YYYY-YYYYYYYYYYYY',
    version: '2.0.4',
    useWindowLocation: false,
    websocket: {
      pingEnabled: false,
      pingDelay: 42,
      maxPingLostCount: 42,
      autoReconnect: false,
      maxRetryCount: 42,
      fileChunkSize: 42
    }
  },
  recognition: {
    type: 'DIAGRAM',
    alwaysConnected: false,
    lang: 'fr_FR',
    gesture: {
      enable: false
    },
    convert: {
      force: {
        'on-stylesheet-change': false
      }
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
        },
      },
    },
    renderer: {
      debug: {
        'draw-text-boxes': true,
        'draw-image-boxes': true
      }
    },
    math: {
      mimeTypes: ['application/mathml+xml'], // 'application/mathml+xml', 'application/vnd.myscript.jiix',
      solver: {
        enable: false,
        'fractional-part-digits': 4,
        'decimal-separator': ',',
        'rounding-mode': 'truncate',
        'angle-unit': 'rad'
      },
      margin: {
        bottom: 12,
        left: 12,
        right: 12,
        top: 12
      },
      eraser: {
        'erase-precisely': true
      },
      'undo-redo': {
        mode: 'session'
      }
    },
    text: {
      guides: {
        enable: false
      },
      mimeTypes: ['application/vnd.myscript.jiix'],
      margin: {
        top: 21,
        left: 21,
        right: 21,
        bottom: 21
      },
      eraser: {
        'erase-precisely': true
      }
    },
    diagram: {
      mimeTypes: ['application/vnd.openxmlformats-officedocument.presentationml.presentation'],
      eraser: {
        'erase-precisely': true
      },
      convert: {
        "match-text-size": true,
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
    }
  },
  grabber: {
    listenerOptions: {
      capture: true,
      passive: false
    },
    xyFloatPrecision: 27,
    timestampFloatPrecision: 27,
    delayLongTouch: 1000
  },
  rendering: {
    minHeight: 42,
    minWidth: 42,
    smartGuide: {
      enable: false,
    },
    guides: {
      enable: false,
      gap: 42,
      type: "point"
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

export const OffScreenOverrideConfiguration: DeepPartial<TConfiguration> = {
  offscreen: true,
  server: {
    protocol: 'REST',
    scheme: 'http',
    host: 'host',
    applicationKey: 'applicationKey',
    hmacKey: 'hmacKey',
    version: '2.0.4',
    useWindowLocation: false,
    websocket: {
      pingEnabled: false,
      pingDelay: 42,
      maxPingLostCount: 42,
      autoReconnect: false,
      maxRetryCount: 42,
      fileChunkSize: 42
    }
  },
  recognition: {
    type: 'DIAGRAM',
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
    renderer: {
      debug: {
        'draw-text-boxes': true,
        'draw-image-boxes': true
      }
    },
    math: {
      mimeTypes: ['application/mathml+xml'], // 'application/mathml+xml', 'application/vnd.myscript.jiix',
      solver: {
        enable: false,
        'fractional-part-digits': 4,
        'decimal-separator': ',',
        'rounding-mode': 'truncate',
        'angle-unit': 'rad'
      },
      margin: {
        bottom: 12,
        left: 12,
        right: 12,
        top: 12
      },
      eraser: {
        'erase-precisely': true
      },
      'undo-redo': {
        mode: 'session'
      }
    },
    text: {
      guides: {
        enable: false
      },
      mimeTypes: ['application/vnd.myscript.jiix'],
      margin: {
        top: 21,
        left: 21,
        right: 21,
        bottom: 21
      },
      eraser: {
        'erase-precisely': true
      }
    },
    diagram: {
      mimeTypes: ['application/vnd.openxmlformats-officedocument.presentationml.presentation'],
      eraser: {
        'erase-precisely': true
      },
      convert: {
        "match-text-size": true,
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
      gestures : ["scratch-out"]
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
  rendering: {
    minHeight: 42,
    minWidth: 42,
    smartGuide: {
      enable: false,
      fadeOut: {
        enable: true,
        duration: 42
      }
    },
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
