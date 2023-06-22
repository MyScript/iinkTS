import Server from 'jest-websocket-mock'

import { DefaultRecognitionConfiguration, DefaultServerConfiguration } from '../../../src/configuration/DefaultConfiguration'
import { WSRecognizer } from '../../../src/recognizer/WSRecognizer'
import { TWebSocketEvent } from '../../../src/@types/recognizer/WSRecognizer'
import { delay } from '../utils/helpers'
import { IModel } from '../../../src/@types/model/Model'
import { Model } from '../../../src/model/Model'
import { TPoint } from '../../../src/@types/renderer/Point'
import { DefaultPenStyle } from '../../../src/style/DefaultPenStyle'
import { DeferredPromise } from '../../../src/utils/DeferredPromise'
import { Error as ErrorConst, WSEventType } from '../../../src/Constants'
import { TRecognitionConfiguration, TRecognitionType } from '../../../src/@types/configuration/RecognitionConfiguration'
import { TServerConfiguration } from '../../../src/@types/configuration/ServerConfiguration'
import { DeserializedMessage } from 'jest-websocket-mock/lib/websocket'
import { TTheme } from "../../../src/@types/style/Theme"
import { TPenStyle } from '../../../src/@types/style/PenStyle'

const ackMessage = { "type": "ack", "hmacChallenge": "1f434e8b-cc46-4a8c-be76-708eea2ff305", "iinkSessionId": "c7e72186-6299-4782-b612-3e725aa126f1" }
const contentPackageDescriptionMessage = { "type": "contentPackageDescription", "contentPartCount": 0 }
const partChangeMessage = { "type": "partChanged", "partIdx": 0, "partId": "yyrrutgk", "partCount": 1 }
const newPartMessage = { "type": "newPart", "idx": 0, "id": "lqrcoxjl" }
const exportedMessageEmpty = {"type":"exported","partId":"wyybaqsp","exports":{"application/vnd.myscript.jiix":"{\n \"type\": \"Text\",\n \"label\": \"\",\n \"words\": [  ],\n \"version\": \"3\",\n \"id\": \"MainBlock\"\n}"}}
const exportedMessage = {
  "type": "exported", "partid": 0, "exports": {
    "application/vnd.myscript.jiix": JSON.stringify({
      "type": "Text",
      "label": "hello",
      "words": [{
        "label": "H",
        "candidates": ["h"]
      }]
    })
  }
}

describe('WSRecognizer.ts', () => {
  let mockServer: Server
  const height = 100, width = 100
  beforeEach(() => {
    mockServer = new Server(`wss://${DefaultServerConfiguration.host}/api/v4.0/iink/document`, {})

    mockServer.on('connection', (socket) => {
      socket.on('message', (message: string | Blob | ArrayBuffer | ArrayBufferView) => {
        const parsedMessage: TWebSocketEvent = JSON.parse(message as string)
        switch (parsedMessage.type) {
          case 'newContentPackage':
            socket.send(JSON.stringify(ackMessage))
            break
          case 'hmac':
            socket.send(JSON.stringify(contentPackageDescriptionMessage))
            break
          case 'configuration':
            socket.send(JSON.stringify(partChangeMessage))
            break
          case 'newContentPart':
            socket.send(JSON.stringify(newPartMessage))
            socket.send(JSON.stringify(exportedMessageEmpty))
            break
          case 'addStrokes':
            socket.send(JSON.stringify(exportedMessage))
            break
          default:
            break
        }
      })
    })
  })

  afterEach(() => {
    Server.clean()
  })

  test('should instanciate WSRecognizer', () => {
    const wsr = new WSRecognizer(DefaultServerConfiguration, DefaultRecognitionConfiguration)
    expect(wsr).toBeDefined()
  })

  test('should resolve init promise', async () => {
    const wsr = new WSRecognizer(DefaultServerConfiguration, DefaultRecognitionConfiguration)
    const initPromise = wsr.init(height, width)
    expect(initPromise).resolves.toBeUndefined()
    await initPromise
  })

  test('should have sent initialized messages', async () => {
    const wsr = new WSRecognizer(DefaultServerConfiguration, DefaultRecognitionConfiguration)
    wsr.init(height, width)
    //¯\_(ツ)_/¯ required to wait serve received messages
    await delay(500)
    const parsedMessage = mockServer.messages.map((m: DeserializedMessage<object>) => {
      return JSON.parse(m as string) as TWebSocketEvent
    })
    await delay(500)

    //Send false negative when called with all other tests
    expect(parsedMessage.find(m => m.type === 'newContentPackage')).toBeDefined()
    expect(parsedMessage.find(m => m.type === 'hmac')).toBeDefined()
    expect(parsedMessage.find(m => m.type === 'configuration')).toBeDefined()
    expect(parsedMessage.find(m => m.type === 'newContentPart')).toBeDefined()
  })

  test('should send message', async () => {
    const wsr = new WSRecognizer(DefaultServerConfiguration, DefaultRecognitionConfiguration)
    wsr.init(height, width)

    //¯\_(ツ)_/¯ required to wait the socket.readyState = OPEN only due to mock
    await delay(100)
    const testDataToSend = { type: 'test', data: 'test-data' }
    wsr.send(testDataToSend)

    //¯\_(ツ)_/¯  required to wait server received message
    await delay(100)

    expect(mockServer.messages).toContain(JSON.stringify(testDataToSend))
  })

  test('should reconnect if send message when socket is closed', async () => {
    const wsr = new WSRecognizer(DefaultServerConfiguration, DefaultRecognitionConfiguration)
    wsr.init(height, width)
    //¯\_(ツ)_/¯ required to wait the socket.readyState = OPEN only due to mock
    await delay(100)
    wsr.close(1000, 'test')
    try {
      const parsedMessage = mockServer.messages.map((m: DeserializedMessage<object>) => {
        return JSON.parse(m as string) as TWebSocketEvent
      })
      await delay(500)
      expect(parsedMessage.find(m => m.type === 'newContentPackage')).toBeDefined()
      expect(parsedMessage.find(m => m.type === 'hmac')).toBeDefined()
      expect(parsedMessage.find(m => m.type === 'configuration')).toBeDefined()
      expect(parsedMessage.find(m => m.type === 'newContentPart')).toBeDefined()
    } catch (error) {
      expect(error).toStrictEqual(new Error(WSEventType.DISCONNECTED))
    }
  })

  test('should addStrokes', async () => {
    const wsr = new WSRecognizer(DefaultServerConfiguration, DefaultRecognitionConfiguration)
    wsr.init(height, width)
    await delay(100)

    const model: IModel = new Model(width, height)
    const p1: TPoint = { t: 1, p: 1, x: 1, y: 1 }
    const p2: TPoint = { t: 10, p: 1, x: 100, y: 1 }
    model.initCurrentStroke(p1, 1, 'pen', DefaultPenStyle)
    model.endCurrentStroke(p2, DefaultPenStyle)

    wsr.send = jest.fn()

    expect(async () => {
      await wsr.addStrokes(model)
    }).rejects.toThrowError()
    expect(wsr.send).toBeCalledTimes(1)
    expect(wsr.send).toBeCalledWith({
      type: 'addStrokes',
      strokes: [{
        "p": [0.5, 0.1],
        "pointerId": 1,
        "pointerType": "pen",
        "t": [1, 10],
        "x": [1, 100],
        "y": [1, 1],
      }]
    })

  })

  test('should not send addStrokes if not pending strokes', async () => {
    const wsr = new WSRecognizer(DefaultServerConfiguration, DefaultRecognitionConfiguration)
    await wsr.init(height, width)
    const model: IModel = new Model(width, height)

    await wsr.addStrokes(model)

    wsr.send = jest.fn()
    expect(wsr.send).toBeCalledTimes(0)
  })

  const closeMessageOptions = [
    { code: 1001, message: ErrorConst.GOING_AWAY },
    { code: 1002, message: ErrorConst.PROTOCOL_ERROR },
    { code: 1003, message: ErrorConst.UNSUPPORTED_DATA },
    { code: 1006, message: ErrorConst.ABNORMAL_CLOSURE },
    { code: 1007, message: ErrorConst.INVALID_FRAME_PAULOAD },
    { code: 1008, message: ErrorConst.POLICY_VIOLATION },
    { code: 1009, message: ErrorConst.MESSAGE_TOO_BIG },
    { code: 1011, message: ErrorConst.INTERNAL_ERROR },
    { code: 1012, message: ErrorConst.SERVICE_RESTART },
    { code: 1013, message: ErrorConst.TRY_AGAIN },
    { code: 1014, message: ErrorConst.BAD_GATEWAY },
    { code: 1015, message: ErrorConst.TLS_HANDSHAKE },
    { code: 42, message: ErrorConst.CANT_ESTABLISH },
  ]
  closeMessageOptions.forEach(closeEvent => {
    test(`should emit error & disconnected if the server closes the connection abnormally code == ${closeEvent.code}`, async () => {
      const wsr = new WSRecognizer(DefaultServerConfiguration, DefaultRecognitionConfiguration)

      const deferrer = new DeferredPromise()
      wsr.globalEvent.emitError = jest.fn((p) => deferrer.resolve(p))

      await wsr.init(height, width)
      mockServer.close({ code: closeEvent.code, reason: closeEvent.message, wasClean: true })
      await deferrer.promise

      expect(wsr.globalEvent.emitError).toBeCalledTimes(1)
      expect(wsr.globalEvent.emitError).toBeCalledWith(new Error(closeEvent.message))
    })
  })


  const recognitionTypeList: TRecognitionType[] = ['TEXT', 'DIAGRAM', 'MATH', 'Raw Content']
  recognitionTypeList.forEach((recognitionType: TRecognitionType) => {
    test(`should export ${recognitionType}`, async () => {
      const recognitionConfig: TRecognitionConfiguration = {
        ...DefaultRecognitionConfiguration,
        type: recognitionType
      }
      const wsr = new WSRecognizer(DefaultServerConfiguration, recognitionConfig)
      wsr.init(height, width)
      //¯\_(ツ)_/¯ required to wait the socket.readyState = OPEN only due to mock
      await delay(100)

      const model: IModel = new Model(width + 20, height + 20)

      expect(async () => {
        await wsr.export(model)
      }).rejects.toThrowError()

      //¯\_(ツ)_/¯  required to wait server received message
      await delay(100)

      const exportMessageSent = mockServer.messages[mockServer.messages.length - 1]

      let mimeTypes: string[]

      switch (recognitionType) {
        case 'TEXT':

          mimeTypes = DefaultRecognitionConfiguration.text.mimeTypes
          break
        case 'DIAGRAM':

          mimeTypes = DefaultRecognitionConfiguration.diagram.mimeTypes
          break
        case 'MATH':

          mimeTypes = DefaultRecognitionConfiguration.math.mimeTypes
          break
        case 'Raw Content':

          mimeTypes = ['application/vnd.myscript.jiix']
          break
        default:

          throw new Error("invalid recognition type")
      }

      const exportMessageSentToTest = JSON.stringify({
        type: 'export',
        partId: partChangeMessage.partId,
        mimeTypes
      })
      expect(exportMessageSent).toContain(exportMessageSentToTest)
    })
  })

  test('should ping server from configuration pingDelay', async () => {
    const conf = JSON.parse(JSON.stringify(DefaultServerConfiguration)) as TServerConfiguration
    conf.websocket.pingDelay = 1000
    const wsr = new WSRecognizer(conf, DefaultRecognitionConfiguration)

    wsr.init(height, width)
    await delay(conf.websocket.pingDelay)
    await delay(100)

    let parsedMessage = mockServer.messages.map((m: DeserializedMessage<object>) => {
      return JSON.parse(m as string) as TWebSocketEvent
    })

    expect(parsedMessage.filter(m => m.type === 'ping')).toHaveLength(1)
    await delay(conf.websocket.pingDelay)
    parsedMessage = mockServer.messages.map((m: DeserializedMessage<object>) => {
      return JSON.parse(m as string) as TWebSocketEvent
    })
    expect(parsedMessage.filter(m => m.type === 'ping')).toHaveLength(2)
  })


  test('should import', async () => {
    const wsr = new WSRecognizer(DefaultServerConfiguration, DefaultRecognitionConfiguration)
    wsr.init(height, width)

    //¯\_(ツ)_/¯ required to wait the socket.readyState = OPEN only due to mock
    await delay(100)
    const mimeType = 'text/plain'
    const textImport = 'winter is comming'
    expect(async () => {
      await wsr.import(new Blob([textImport], { type: mimeType }), mimeType)
    }).rejects.toThrowError()
    //¯\_(ツ)_/¯  required to wait server received message
    await delay(100)

    const parsedMessage = mockServer.messages.map((m: DeserializedMessage<object>) => {
      return JSON.parse(m as string) as TWebSocketEvent
    })
    expect(parsedMessage.filter(m => m.type === 'importFile')).toHaveLength(1)
    expect(parsedMessage.filter(m => m.type === 'importFile')[0]).toEqual(
      expect.objectContaining({
        type: 'importFile',
        mimeType
      })
    )
    expect(parsedMessage.filter(m => m.type === 'fileChunk')).toHaveLength(1)
    expect(parsedMessage.filter(m => m.type === 'fileChunk')[0]).toEqual(
      expect.objectContaining({
        type: 'fileChunk',
        data: textImport
      })
    )
  })


  test('should resize', async () => {
    const wsr = new WSRecognizer(DefaultServerConfiguration, DefaultRecognitionConfiguration)

    wsr.init(height, width)

    //¯\_(ツ)_/¯ required to wait the socket.readyState = OPEN only due to mock
    await delay(100)
    const model: IModel = new Model(width + 20, height + 20)
    expect(async () => {
      await wsr.resize(model)
    }).rejects.toThrowError()
    //¯\_(ツ)_/¯  required to wait server received message
    await delay(100)

    const resizeMessageSent = mockServer.messages[mockServer.messages.length - 1]
    const resizeMessageSentToTest = JSON.stringify({
      type: 'changeViewSize',
      height: model.height,
      width: model.width,
    })
    expect(resizeMessageSent).toContain(resizeMessageSentToTest)
  })

  test('should convert', async () => {
    const wsr = new WSRecognizer(DefaultServerConfiguration, DefaultRecognitionConfiguration)

    wsr.init(height, width)
    //¯\_(ツ)_/¯ required to wait the socket.readyState = OPEN only due to mock
    await delay(100)
    const conversionState = 'DIGITAL_EDIT'
    const model: IModel = new Model(width, height)
    expect(async () => {
      await wsr.convert(model, conversionState)
    }).rejects.toThrowError()
    //¯\_(ツ)_/¯  required to wait server received message
    await delay(100)

    const resizeMessageSent = mockServer.messages[mockServer.messages.length - 1]
    const resizeMessageSentToTest = JSON.stringify({
      type: 'convert',
      conversionState
    })
    expect(resizeMessageSent).toContain(resizeMessageSentToTest)
  })


  test('should undo', async () => {
    const wsr = new WSRecognizer(DefaultServerConfiguration, DefaultRecognitionConfiguration)

    const model: IModel = new Model(width, height)

    wsr.init(height, width)
    //¯\_(ツ)_/¯ required to wait the socket.readyState = OPEN only due to mock
    await delay(100)
    expect(async () => {
      await wsr.undo(model)
    }).rejects.toThrowError()
    //¯\_(ツ)_/¯  required to wait server received message
    await delay(100)

    const resizeMessageSent = mockServer.messages[mockServer.messages.length - 1]
    const resizeMessageSentToTest = JSON.stringify({
      type: 'undo',
    })
    expect(resizeMessageSent).toContain(resizeMessageSentToTest)
  })

  test('should redo', async () => {
    const wsr = new WSRecognizer(DefaultServerConfiguration, DefaultRecognitionConfiguration)

    const model: IModel = new Model(width, height)

    wsr.init(height, width)
    //¯\_(ツ)_/¯ required to wait the socket.readyState = OPEN only due to mock
    await delay(100)
    expect(async () => {
      await wsr.redo(model)
    }).rejects.toThrowError()
    //¯\_(ツ)_/¯  required to wait server received message
    await delay(100)

    const resizeMessageSent = mockServer.messages[mockServer.messages.length - 1]
    const resizeMessageSentToTest = JSON.stringify({
      type: 'redo',
    })
    expect(resizeMessageSent).toContain(resizeMessageSentToTest)
  })

  test('should clear', async () => {
    const wsr = new WSRecognizer(DefaultServerConfiguration, DefaultRecognitionConfiguration)

    const model: IModel = new Model(width, height)

    wsr.init(height, width)
    //¯\_(ツ)_/¯ required to wait the socket.readyState = OPEN only due to mock
    await delay(100)
    expect(async () => {
      await wsr.clear(model)
    }).rejects.toThrowError()
    //¯\_(ツ)_/¯  required to wait server received message
    await delay(100)

    const resizeMessageSent = mockServer.messages[mockServer.messages.length - 1]
    const resizeMessageSentToTest = JSON.stringify({
      type: 'clear',
    })
    expect(resizeMessageSent).toContain(resizeMessageSentToTest)
  })

  test("should setTheme", async () => {
    const wsr = new WSRecognizer(DefaultServerConfiguration, DefaultRecognitionConfiguration)
    wsr.init(height, width)
    //¯\_(ツ)_/¯ required to wait the socket.readyState = OPEN only due to mock
    await delay(100)
    const theme: TTheme = {
      ink: {
        width: 42,
        color: '#2E7D32',
        '-myscript-pen-width': 2,
        '-myscript-pen-fill-style': 'purple',
        '-myscript-pen-fill-color': '#FFFFFF00'
      },
      '.math': {
        'font-family': 'STIXGeneral'
      },
      '.math-solved': {
        'font-family': 'STIXGeneral',
        color: 'blue'
      },
      '.text': {
        'font-family': 'Rubik Distressed',
        'font-size': 10
      }
    }
    wsr.setTheme(theme)
    //¯\_(ツ)_/¯  required to wait server received message
    await delay(100)

    const setThemeMessageSent = mockServer.messages[mockServer.messages.length - 1]
    const setThemeMessageSentToTest = "{\"type\":\"setTheme\",\"theme\":\"ink {\\nwidth: 42;\\ncolor: #2E7D32;\\n-myscript-pen-width: 2;\\n-myscript-pen-fill-style: purple;\\n-myscript-pen-fill-color: #FFFFFF00;\\n}\\n.math {\\nfont-family: STIXGeneral;\\n}\\n.math-solved {\\nfont-family: STIXGeneral;\\ncolor: blue;\\n}\\n.text {\\nfont-family: Rubik Distressed;\\nfont-size: 10;\\n}\\n\"}"
    expect(setThemeMessageSent).toContain(setThemeMessageSentToTest)
  })
  test("should setPenStyle", async () => {
    const wsr = new WSRecognizer(DefaultServerConfiguration, DefaultRecognitionConfiguration)
    wsr.init(height, width)
    const CustomPenStyle: TPenStyle = { color: "#d1d1d1" }
    //¯\_(ツ)_/¯ required to wait the socket.readyState = OPEN only due to mock
    await delay(100)
    wsr.setPenStyle(CustomPenStyle)
    await delay(100)
    //¯\_(ツ)_/¯  required to wait server received message
    const setPenStyle = mockServer.messages[mockServer.messages.length - 1]
    const setPenStyleToTest = JSON.stringify({
      type: 'setPenStyle',
      style: 'color: #d1d1d1;'
    })
    expect(setPenStyle).toContain(setPenStyleToTest)
  })
})
