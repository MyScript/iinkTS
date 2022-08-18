import { TConfiguration } from '../@types/Configuration'
import { TGrabberConfiguration } from "../@types/configuration/GrabberConfiguration"
import { TRenderingConfiguration } from '../@types/configuration/RenderingConfiguration'
import { TServerConfiguration } from '../@types/configuration/ServerConfiguration'
import { TRecognitionConfiguration } from '../@types/configuration/RecognitionConfiguration'
import { TTriggerConfiguration } from '../@types/configuration/TriggerConfiguration'
import { TEventConfiguration } from '../@types/configuration/EventConfiguration'

const DefaultServerConfiguration: TServerConfiguration = {
  protocol: 'WEBSOCKET',
  scheme: 'https',
  host: 'cloud.myscript.com',
  applicationKey: '',
  hmacKey: '',
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

const DefaultRecognitionConfiguration: TRecognitionConfiguration = {
  type: 'TEXT',
  alwaysConnected: true,
  replaceMimeTypes: false,
  lang: 'en_US',
  gesture: {
    enable: true
  },
  export: {
    'image-resolution': 300,
    jiix: {
      'bounding-box': false,
      strokes: false,
      text: {
        chars: false,
        words: true
      }
    },
  },
  renderer: {
    debug: {
      'draw-text-boxes': false,
      'draw-image-boxes': false
    }
  },
  math: {
    mimeTypes: ['application/x-latex'], // 'application/mathml+xml', 'application/vnd.myscript.jiix',
    solver: {
      enable: true,
      'fractional-part-digits': 3,
      'decimal-separator': '.',
      'rounding-mode': 'half up',
      'angle-unit': 'deg'
    },
    margin: {
      bottom: 10,
      left: 15,
      right: 15,
      top: 10
    },
    eraser: {
      'erase-precisely': false
    },
    'undo-redo': {
      mode: 'stroke'
    }
  },
  text: {
    guides: {
      enable: true
    },
    mimeTypes: ['text/plain'], // 'application/vnd.myscript.jiix'
    margin: {
      top: 20,
      left: 10,
      right: 10,
      bottom: 10
    },
    eraser: {
      'erase-precisely': false
    }
  },
  diagram: {
    mimeTypes: ['application/vnd.myscript.jiix'], // 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    eraser: {
      'erase-precisely': false
    }
  },
  rawContent: {
    mimeTypes: ['application/vnd.myscript.jiix'],
    recognition: {
      text: true,
      shape: false
    },
    eraser: {
      'erase-precisely': false
    }
  }
}

const DefaultGrabberConfiguration: TGrabberConfiguration = {
  listenerOptions: {
    capture: false,
    passive: true
  },
  xyFloatPrecision: 0,
  timestampFloatPrecision: 0
}

const DefaultRenderingConfiguration: TRenderingConfiguration = {
  minHeight: 100,
  minWidth: 100,
  smartGuide: {
    enable: false,
    fadeOut: {
      enable: false,
      duration: 10000
    }
  }
}

const DefaultTriggerConfiguration: TTriggerConfiguration = {
  exportContent: 'QUIET_PERIOD',
  exportContentDelay: 1000,
  resizeTriggerDelay: 10
}

const DefaultEventsConfiguration: TEventConfiguration = {
  processDelay: 10
}

export const DefaultConfiguration: TConfiguration = {
  server: DefaultServerConfiguration,
  recognition: DefaultRecognitionConfiguration,
  grabber: DefaultGrabberConfiguration,
  rendering: DefaultRenderingConfiguration,
  triggers: DefaultTriggerConfiguration,
  events: DefaultEventsConfiguration,
} as const
