import { TConfigurationClient } from "../../../src/@types/configuration"

export const ConfigurationTextWebsocket: TConfigurationClient = {
  server: {
    protocol: 'WEBSOCKET',
    scheme: 'http',
    host: 'cloud.myscript.com',
    applicationKey: '80a7f78d-939c-48e0-84a8-7794d6fbf624',
    hmacKey: 'df2ba19a-7703-4ab4-9164-00dd33357745'
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

export const ConfigurationTextRest: TConfigurationClient = {
  server: {
    protocol: 'REST',
    scheme: 'http',
    host: 'cloud.myscript.com',
    applicationKey: '80a7f78d-939c-48e0-84a8-7794d6fbf624',
    hmacKey: 'df2ba19a-7703-4ab4-9164-00dd33357745'
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

export const ConfigurationDiagramRest: TConfigurationClient = {
  server: {
    protocol: 'REST',
    scheme: 'http',
    host: 'cloud.myscript.com',
    applicationKey: '80a7f78d-939c-48e0-84a8-7794d6fbf624',
    hmacKey: 'df2ba19a-7703-4ab4-9164-00dd33357745'
  },
  recognition: {
    type: 'DIAGRAM',
    diagram: {
      mimeTypes: ['application/vnd.myscript.jiix']
    }
  }
}

export const ConfigurationRawContentRest: TConfigurationClient = {
  server: {
    protocol: 'REST',
    scheme: 'http',
    host: 'cloud.myscript.com',
    applicationKey: '80a7f78d-939c-48e0-84a8-7794d6fbf624',
    hmacKey: 'df2ba19a-7703-4ab4-9164-00dd33357745'
  },
  recognition: {
    type: 'Raw Content',
  }
}

export const AllOverrideConfiguration: TConfigurationClient = {
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
      }
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
      enable: false,
      gap: 100
    }
  },
  triggers: {
    exportContent: 'DEMAND',
    exportContentDelay: 5,
    resizeTriggerDelay: 5
  },
  events: {
    processDelay: 0
  },
  'undo-redo': {
    maxStackSize: 10
  }
}
