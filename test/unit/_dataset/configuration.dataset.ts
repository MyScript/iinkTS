import { TConfigurationClient } from "../../../src/@types/Configuration"

export const ConfigurationTextWebsocket: TConfigurationClient = {
  server: {
    protocol: 'WEBSOCKET',
    scheme: 'http',
    host: 'webdemoapi.myscript.com',
    applicationKey: '515131ab-35fa-411c-bb4d-3917e00faf60',
    hmacKey: '54b2ca8a-6752-469d-87dd-553bb450e9ad'
  },
  recognition: {
    type: 'TEXT',
    text: {
      mimeTypes: ['text/plain', 'application/vnd.myscript.jiix']
    }
  }
}

export const ConfigurationTextRest: TConfigurationClient = {
  server: {
    protocol: 'REST',
    scheme: 'http',
    host: 'webdemoapi.myscript.com',
    applicationKey: '515131ab-35fa-411c-bb4d-3917e00faf60',
    hmacKey: '54b2ca8a-6752-469d-87dd-553bb450e9ad'
  },
  recognition: {
    type: 'TEXT',
    text: {
      mimeTypes: ['text/plain', 'application/vnd.myscript.jiix']
    }
  }
}

export const ConfigurationDiagramRest: TConfigurationClient = {
  server: {
    protocol: 'REST',
    scheme: 'http',
    host: 'webdemoapi.myscript.com',
    applicationKey: '515131ab-35fa-411c-bb4d-3917e00faf60',
    hmacKey: '54b2ca8a-6752-469d-87dd-553bb450e9ad'
  },
  recognition: {
    type: 'DIAGRAM',
    text: {
      mimeTypes: ['application/vnd.myscript.jiix']
    }
  }
}

export const ConfigurationRawContentRest: TConfigurationClient = {
  server: {
    protocol: 'REST',
    scheme: 'http',
    host: 'webdemoapi.myscript.com',
    applicationKey: '515131ab-35fa-411c-bb4d-3917e00faf60',
    hmacKey: '54b2ca8a-6752-469d-87dd-553bb450e9ad'
  },
  recognition: {
    type: 'Raw Content',
    text: {
      mimeTypes: ['application/vnd.myscript.jiix']
    }
  }
}

export const AllOverrideConfiguration: TConfigurationClient = {
  server: {
    protocol: 'REST',
    scheme: 'http',
    host: 'host',
    applicationKey: 'applicationKey',
    hmacKey: 'hmacKey',
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
    replaceMimeTypes: true,
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
      }
    },
    rawContent: {
      mimeTypes: ['application/vnd.myscript.jiix'],
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
    }
  },
  triggers: {
    exportContent: 'DEMAND',
    exportContentDelay: 5,
    resizeTriggerDelay: 5
  },
  events: {
    processDelay: 0
  }
}


export const ConfigurationReplaceMimeType: TConfigurationClient = {
  recognition: {
    replaceMimeTypes: true,
    math: {
      mimeTypes: ['application/mathml+xml'],
    },
    diagram: {
      mimeTypes: ['application/vnd.openxmlformats-officedocument.presentationml.presentation'],
    },
    text: {
      mimeTypes: ['application/vnd.myscript.jiix'],
    },
    rawContent: {
      mimeTypes: ['application/vnd.myscript.jiix'],
    },
  }
}
export const ConfigurationReplaceMimeTypeEmpty: TConfigurationClient = {
  recognition: {
    replaceMimeTypes: true,
  }
}