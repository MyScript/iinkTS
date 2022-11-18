import Server from 'jest-websocket-mock'
import { DeserializedMessage } from 'jest-websocket-mock/lib/websocket'

import { DefaultRecognitionConfiguration, DefaultServerConfiguration } from '../../../src/configuration/DefaultConfiguration'
import { WSRecognizer } from '../../../src/recognizer/WSRecognizer'
import { DeferredPromise } from '../../../src/utils/DeferredPromise'
import { TWebSocketEvent } from '../../../src/@types/recognizer/WSRecognizer'
import { IModel } from '../../../src/@types/model/Model'
import { Model } from '../../../src/model/Model'
import { WSEventType, Error as ErrorConst } from '../../../src/Constants'
import { delay } from '../utils/helpers'
import { TRecognitionConfiguration, TRecognitionType } from '../../../src/@types/configuration/RecognitionConfiguration'
import { TPoint } from '../../../src/@types/renderer/Point'
import { DefaultPenStyle } from '../../../src/style/DefaultPenStyle'
import { TServerConfiguration } from '../../../src/@types/configuration/ServerConfiguration'

const ackMessage = { "type": "ack", "hmacChallenge": "1f434e8b-cc46-4a8c-be76-708eea2ff305", "iinkSessionId": "c7e72186-6299-4782-b612-3e725aa126f1" }
const contentPackageDescriptionMessage = { "type": "contentPackageDescription", "contentPartCount": 0 }
const partChangeMessage = { "type": "partChanged", "partIdx": 0, "partId": "qjkxjdvh", "partCount": 1 }
const newPartMessage = { "type": "newPart", "idx": 0, "id": "lqrcoxjl" }

describe('WSRecognizer.ts', () =>
{
  let mockServer: Server
  const height = 100, width = 100

  beforeEach(() =>
  {
    mockServer = new Server(`wss://${ DefaultServerConfiguration.host }/api/v4.0/iink/document`, {})

    mockServer.on('connection', (socket) =>
    {
      socket.on('message', (message: string | Blob | ArrayBuffer | ArrayBufferView) =>
      {
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
            break
          default:
            break
        }
      })
    })
  })

  afterEach(() =>
  {
    Server.clean()
  })

  test('should instanciate WSRecognizer', () =>
  {
    const wsr = new WSRecognizer(DefaultServerConfiguration, DefaultRecognitionConfiguration)
    expect(wsr).toBeDefined()
  })

  test('should emit initialized WSRecognizer', async () =>
  {
    const wsr = new WSRecognizer(DefaultServerConfiguration, DefaultRecognitionConfiguration)
    wsr.wsEvent.emitInitialized = jest.fn()
    wsr.init(height, width)
    expect(wsr.wsEvent.emitInitialized).toBeCalledTimes(1)
  })

  test('should emit connected & connection_active after init & server send newPart message', async () =>
  {
    const wsr = new WSRecognizer(DefaultServerConfiguration, DefaultRecognitionConfiguration)

    const connectionDeferred = new DeferredPromise()
    wsr.wsEvent.emitConnected = jest.fn(() => connectionDeferred.resolve(true))
    const connectionActiveDeferred = new DeferredPromise()
    wsr.wsEvent.emitConnectionActive = jest.fn(() => connectionActiveDeferred.resolve(true))

    wsr.init(height, width)

    await connectionDeferred.promise
    expect(wsr.wsEvent.emitConnected).toBeCalledTimes(1)
    await connectionActiveDeferred.promise
    expect(wsr.wsEvent.emitConnectionActive).toBeCalledTimes(1)
  })

  test('should have sent initialized messages', async () =>
  {
    const wsr = new WSRecognizer(DefaultServerConfiguration, DefaultRecognitionConfiguration)

    const connectionActiveDeferred = new DeferredPromise()
    wsr.wsEvent.emitConnectionActive = jest.fn(() => connectionActiveDeferred.resolve(true))

    wsr.init(height, width)

    await connectionActiveDeferred.promise

    //¯\_(ツ)_/¯ required to wait serve received messages
    await delay(100)

    const parsedMessage = mockServer.messages.map((m: DeserializedMessage<object>) =>
    {
      return JSON.parse(m as string) as TWebSocketEvent
    })
    expect(parsedMessage.find(m => m.type === 'newContentPackage')).toBeDefined()
    expect(parsedMessage.find(m => m.type === 'hmac')).toBeDefined()
    expect(parsedMessage.find(m => m.type === 'configuration')).toBeDefined()
    expect(parsedMessage.find(m => m.type === 'newContentPart')).toBeDefined()
  })

  test('should send message', async () =>
  {
    const wsr = new WSRecognizer(DefaultServerConfiguration, DefaultRecognitionConfiguration)

    const connectionActiveDeferred = new DeferredPromise()
    wsr.wsEvent.emitConnectionActive = jest.fn(() => connectionActiveDeferred.resolve(true))

    wsr.init(height, width)

    await connectionActiveDeferred.promise
    //¯\_(ツ)_/¯ required to wait the socket.readyState = OPEN only due to mock
    await delay(100)
    const testDataToSend = { type: 'test', data: 'test-data' }
    wsr.send(testDataToSend)

    //¯\_(ツ)_/¯  required to wait server received message
    await delay(100)

    expect(mockServer.messages).toContain(JSON.stringify(testDataToSend))
  })

  test('should throw DISCONNECTED if send message when socket is closed', async () =>
  {
    const wsr = new WSRecognizer(DefaultServerConfiguration, DefaultRecognitionConfiguration)

    const connectionActiveDeferred = new DeferredPromise()
    wsr.wsEvent.emitConnectionActive = jest.fn(() => connectionActiveDeferred.resolve(true))

    const closeDeferred = new DeferredPromise()
    wsr.wsEvent.emitDisconnected = jest.fn((p) => closeDeferred.resolve(p))

    wsr.init(height, width)

    await connectionActiveDeferred.promise
    //¯\_(ツ)_/¯ required to wait the socket.readyState = OPEN only due to mock
    await delay(100)
    wsr.close(1000, 'test')
    try {
      wsr.send({ type: 'test' })
      expect('DISCONNECTED error should be throw').toBe(true)
    } catch (error) {
      expect(error).toStrictEqual(new Error(WSEventType.DISCONNECTED))
    }
  })

  test('should addStrokes', async () =>
  {
    const wsr = new WSRecognizer(DefaultServerConfiguration, DefaultRecognitionConfiguration)

    const connectionActiveDeferred = new DeferredPromise()
    wsr.wsEvent.emitConnectionActive = jest.fn(() => connectionActiveDeferred.resolve(true))

    wsr.init(height, width)

    await connectionActiveDeferred.promise
    await delay(100)

    const model: IModel = new Model(width, height)
    const p1: TPoint = { t: 1, p: 1, x: 1, y: 1 }
    const p2: TPoint = { t: 10, p: 1, x: 100, y: 1 }
    model.initCurrentStroke(p1, 1, 'pen', DefaultPenStyle)
    model.endCurrentStroke(p2, DefaultPenStyle)

    wsr.send = jest.fn()
    wsr.addStrokes(model)
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

  test('should not send when addStrokes if pending strokes', async () =>
  {
    const wsr = new WSRecognizer(DefaultServerConfiguration, DefaultRecognitionConfiguration)

    const connectionActiveDeferred = new DeferredPromise()
    wsr.wsEvent.emitConnectionActive = jest.fn(() => connectionActiveDeferred.resolve(true))
    wsr.init(height, width)

    await connectionActiveDeferred.promise
    await delay(100)

    const model: IModel = new Model(width, height)

    wsr.addStrokes(model)

    wsr.send = jest.fn()
    expect(wsr.send).toBeCalledTimes(0)

  })

  test('should emit disconnected if the server closes the connection normally (code: 1000)', async () =>
  {
    const wsr = new WSRecognizer(DefaultServerConfiguration, DefaultRecognitionConfiguration)

    const connectionActiveDeferred = new DeferredPromise()
    wsr.wsEvent.emitConnectionActive = jest.fn(() => connectionActiveDeferred.resolve(true))

    const closeDeferred = new DeferredPromise()
    wsr.wsEvent.emitDisconnected = jest.fn((p) => closeDeferred.resolve(p))

    wsr.init(height, width)

    await connectionActiveDeferred.promise
    await delay(100)

    mockServer.close({ code: 1000, reason: 'test', wasClean: true })
    await closeDeferred.promise

    expect(wsr.wsEvent.emitDisconnected).toBeCalledWith(
      expect.objectContaining({ type: 'close', code: 1000, reason: 'test' })
    )
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
  closeMessageOptions.forEach(closeEvent =>
  {
    test(`should emit error & disconnected if the server closes the connection abnormally code == ${ closeEvent.code }`, async () =>
    {
      const wsr = new WSRecognizer(DefaultServerConfiguration, DefaultRecognitionConfiguration)

      const connectionActiveDeferred = new DeferredPromise()
      wsr.wsEvent.emitConnectionActive = jest.fn(() => connectionActiveDeferred.resolve(true))

      const closeDeferred = new DeferredPromise()
      wsr.wsEvent.emitDisconnected = jest.fn((p) => closeDeferred.resolve(p))

      const deferrer = new DeferredPromise()
      wsr.wsEvent.emitError = jest.fn((p) => deferrer.resolve(p))

      wsr.init(height, width)

      await connectionActiveDeferred.promise
      await delay(100)

      mockServer.close({ code: closeEvent.code, reason: closeEvent.message, wasClean: true })
      await deferrer.promise
      await closeDeferred.promise

      expect(wsr.wsEvent.emitError).toBeCalledTimes(1)
      expect(wsr.wsEvent.emitError).toBeCalledWith(new Error(closeEvent.message))

      expect(wsr.wsEvent.emitDisconnected).toBeCalledTimes(1)
      expect(wsr.wsEvent.emitDisconnected).toBeCalledWith(
        expect.objectContaining({ type: 'close', code: closeEvent.code, reason: closeEvent.message })
      )
    })
  })

  test('should emit EXPORT if the server send message with type export', async () =>
  {
    const wsr = new WSRecognizer(DefaultServerConfiguration, DefaultRecognitionConfiguration)

    const connectionActiveDeferred = new DeferredPromise()
    wsr.wsEvent.emitConnectionActive = jest.fn(() => connectionActiveDeferred.resolve(true))

    const deferrer = new DeferredPromise()
    wsr.wsEvent.emitExported = jest.fn((p) => deferrer.resolve(p))

    wsr.init(height, width)

    await connectionActiveDeferred.promise
    await delay(100)

    const exportMessage = { "type": "exported", "partId": "nanhtglk", "exports": { "application/vnd.myscript.jiix": "{\n \"type\": \"Text\",\n \"label\": \"\",\n \"words\": [  ],\n \"version\": \"3\",\n \"id\": \"MainBlock\"\n}", "text/plain": "" } }
    mockServer.send(JSON.stringify(exportMessage))
    await deferrer.promise

    expect(wsr.wsEvent.emitExported).toBeCalledTimes(1)
    expect(wsr.wsEvent.emitExported).toBeCalledWith(exportMessage)
  })

  test('should emit CONTENT_CHANGE if the server send message with type contentChanged', async () =>
  {
    const wsr = new WSRecognizer(DefaultServerConfiguration, DefaultRecognitionConfiguration)

    const connectionActiveDeferred = new DeferredPromise()
    wsr.wsEvent.emitConnectionActive = jest.fn(() => connectionActiveDeferred.resolve(true))

    const deferrer = new DeferredPromise()
    wsr.wsEvent.emitContentChange = jest.fn((p) => deferrer.resolve(p))

    wsr.init(height, width)

    await connectionActiveDeferred.promise
    await delay(100)

    const contentChangeMessage = { "type": "contentChanged", "partId": "onkputbe", "canUndo": true, "canRedo": false, "empty": false, "undoStackIndex": 1, "possibleUndoCount": 1 }
    mockServer.send(JSON.stringify(contentChangeMessage))
    await deferrer.promise

    expect(wsr.wsEvent.emitContentChange).toBeCalledTimes(1)
    expect(wsr.wsEvent.emitContentChange).toBeCalledWith(contentChangeMessage)
  })

  test('should emit SVG_PATCH if the server send message with type svgPatch', async () =>
  {
    const wsr = new WSRecognizer(DefaultServerConfiguration, DefaultRecognitionConfiguration)

    const connectionActiveDeferred = new DeferredPromise()
    wsr.wsEvent.emitConnectionActive = jest.fn(() => connectionActiveDeferred.resolve(true))

    const deferrer = new DeferredPromise()
    wsr.wsEvent.emitSVGPatch = jest.fn((p) => deferrer.resolve(p))

    wsr.init(height, width)

    await connectionActiveDeferred.promise
    await delay(100)

    const svgPatchMessage = {
      "type": "svgPatch", "updates": [{
        "type": "REPLACE_ALL",
        "svg": "<svg data-layer=\"MODEL\" x=\"0px\" y=\"0px\" width=\"1033px\" height=\"787px\" viewBox=\"0 0 1033 787\"></svg>\n"
      }], "layer": "MODEL"
    }
    mockServer.send(JSON.stringify(svgPatchMessage))
    await deferrer.promise

    expect(wsr.wsEvent.emitSVGPatch).toBeCalledTimes(1)
    expect(wsr.wsEvent.emitSVGPatch).toBeCalledWith(svgPatchMessage)
  })


  test('should emit ERROR if the server send message with type error', async () =>
  {
    const wsr = new WSRecognizer(DefaultServerConfiguration, DefaultRecognitionConfiguration)

    const connectionActiveDeferred = new DeferredPromise()
    wsr.wsEvent.emitConnectionActive = jest.fn(() => connectionActiveDeferred.resolve(true))

    const deferrer = new DeferredPromise()
    wsr.wsEvent.emitError = jest.fn((p) => deferrer.resolve(p))

    wsr.init(height, width)

    await connectionActiveDeferred.promise
    await delay(100)

    const errorMessageToSent = { "type": "error", "message": "Session closed due to no activity.", "code": "no.activity" }
    mockServer.send(JSON.stringify(errorMessageToSent))
    await deferrer.promise

    expect(wsr.wsEvent.emitError).toBeCalledTimes(1)
    expect(wsr.wsEvent.emitError).toBeCalledWith(new Error(errorMessageToSent.message))
  })

  const recognitionTypeList: TRecognitionType[] = ['TEXT', 'DIAGRAM', 'MATH', 'Raw Content']
  recognitionTypeList.forEach((recognitionType: TRecognitionType) =>
  {
    test(`should export ${ recognitionType }`, async () =>
    {
      const recognitionConfig: TRecognitionConfiguration = {
        ...DefaultRecognitionConfiguration,
        type: recognitionType
      }
      const wsr = new WSRecognizer(DefaultServerConfiguration, recognitionConfig)

      const connectionActiveDeferred = new DeferredPromise()
      wsr.wsEvent.emitConnectionActive = jest.fn(() => connectionActiveDeferred.resolve(true))

      wsr.init(height, width)

      await connectionActiveDeferred.promise
      //¯\_(ツ)_/¯ required to wait the socket.readyState = OPEN only due to mock
      await delay(100)
      const model: IModel = new Model(width + 20, height + 20)
      await wsr.export(model)
      //¯\_(ツ)_/¯  required to wait server received message
      await delay(100)

      const exportMessageSent = mockServer.messages[mockServer.messages.length - 1]

      let mimeTypes = []
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

  test('should ping server from configuration pingDelay', async () =>
  {
    const conf = JSON.parse(JSON.stringify(DefaultServerConfiguration)) as TServerConfiguration
    conf.websocket.pingDelay = 1000
    const wsr = new WSRecognizer(conf, DefaultRecognitionConfiguration)

    const connectionActiveDeferred = new DeferredPromise()
    wsr.wsEvent.emitConnectionActive = jest.fn(() => connectionActiveDeferred.resolve(true))

    wsr.init(height, width)
    await connectionActiveDeferred.promise
    await delay(conf.websocket.pingDelay)

    let parsedMessage = mockServer.messages.map((m: DeserializedMessage<object>) =>
    {
      return JSON.parse(m as string) as TWebSocketEvent
    })
    expect(parsedMessage.filter(m => m.type === 'ping')).toHaveLength(1)
    await delay(conf.websocket.pingDelay)
    parsedMessage = mockServer.messages.map((m: DeserializedMessage<object>) =>
    {
      return JSON.parse(m as string) as TWebSocketEvent
    })
    expect(parsedMessage.filter(m => m.type === 'ping')).toHaveLength(2)
  })

  test('should close the connection if maxPingLostCount is reached', async () =>
  {
    const conf = JSON.parse(JSON.stringify(DefaultServerConfiguration)) as TServerConfiguration
    conf.websocket.pingDelay = 1
    conf.websocket.maxPingLostCount = 1
    const wsr = new WSRecognizer(conf, DefaultRecognitionConfiguration)

    wsr.close = jest.fn()

    const connectionActiveDeferred = new DeferredPromise()
    wsr.wsEvent.emitConnectionActive = jest.fn(() => connectionActiveDeferred.resolve(true))

    wsr.init(height, width)
    await connectionActiveDeferred.promise
    await delay(conf.websocket.pingDelay)

    expect(wsr.close).toBeCalledTimes(1)
    expect(wsr.close).toBeCalledWith(1000, 'PING_LOST')
  })

  test('should import', async () =>
  {
    const wsr = new WSRecognizer(DefaultServerConfiguration, DefaultRecognitionConfiguration)

    const connectionActiveDeferred = new DeferredPromise()
    wsr.wsEvent.emitConnectionActive = jest.fn(() => connectionActiveDeferred.resolve(true))

    wsr.init(height, width)

    await connectionActiveDeferred.promise
    //¯\_(ツ)_/¯ required to wait the socket.readyState = OPEN only due to mock
    await delay(100)
    const mimeType = 'text/plain'
    const textImport = 'winter is comming'
    wsr.import(new Blob([textImport], { type: mimeType }), mimeType)
    //¯\_(ツ)_/¯  required to wait server received message
    await delay(100)

    const parsedMessage = mockServer.messages.map((m: DeserializedMessage<object>) =>
    {
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

  test('should resize', async () =>
  {
    const wsr = new WSRecognizer(DefaultServerConfiguration, DefaultRecognitionConfiguration)

    const connectionActiveDeferred = new DeferredPromise()
    wsr.wsEvent.emitConnectionActive = jest.fn(() => connectionActiveDeferred.resolve(true))

    wsr.init(height, width)

    await connectionActiveDeferred.promise
    //¯\_(ツ)_/¯ required to wait the socket.readyState = OPEN only due to mock
    await delay(100)
    const model: IModel = new Model(width + 20, height + 20)
    wsr.resize(model)
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

  test('should convert', async () =>
  {
    const wsr = new WSRecognizer(DefaultServerConfiguration, DefaultRecognitionConfiguration)

    const connectionActiveDeferred = new DeferredPromise()
    wsr.wsEvent.emitConnectionActive = jest.fn(() => connectionActiveDeferred.resolve(true))

    wsr.init(height, width)

    await connectionActiveDeferred.promise
    //¯\_(ツ)_/¯ required to wait the socket.readyState = OPEN only due to mock
    await delay(100)
    const conversionState = 'DIGITAL_EDIT'
    wsr.convert(conversionState)
    //¯\_(ツ)_/¯  required to wait server received message
    await delay(100)

    const resizeMessageSent = mockServer.messages[mockServer.messages.length - 1]
    const resizeMessageSentToTest = JSON.stringify({
      type: 'convert',
      conversionState
    })
    expect(resizeMessageSent).toContain(resizeMessageSentToTest)
  })

  test('should undo', async () =>
  {
    const wsr = new WSRecognizer(DefaultServerConfiguration, DefaultRecognitionConfiguration)

    const connectionActiveDeferred = new DeferredPromise()
    wsr.wsEvent.emitConnectionActive = jest.fn(() => connectionActiveDeferred.resolve(true))

    wsr.init(height, width)

    await connectionActiveDeferred.promise
    //¯\_(ツ)_/¯ required to wait the socket.readyState = OPEN only due to mock
    await delay(100)
    wsr.undo()
    //¯\_(ツ)_/¯  required to wait server received message
    await delay(100)

    const resizeMessageSent = mockServer.messages[mockServer.messages.length - 1]
    const resizeMessageSentToTest = JSON.stringify({
      type: 'undo',
    })
    expect(resizeMessageSent).toContain(resizeMessageSentToTest)
  })

  test('should redo', async () =>
  {
    const wsr = new WSRecognizer(DefaultServerConfiguration, DefaultRecognitionConfiguration)

    const connectionActiveDeferred = new DeferredPromise()
    wsr.wsEvent.emitConnectionActive = jest.fn(() => connectionActiveDeferred.resolve(true))

    wsr.init(height, width)

    await connectionActiveDeferred.promise
    //¯\_(ツ)_/¯ required to wait the socket.readyState = OPEN only due to mock
    await delay(100)
    wsr.redo()
    //¯\_(ツ)_/¯  required to wait server received message
    await delay(100)

    const resizeMessageSent = mockServer.messages[mockServer.messages.length - 1]
    const resizeMessageSentToTest = JSON.stringify({
      type: 'redo',
    })
    expect(resizeMessageSent).toContain(resizeMessageSentToTest)
  })

  test('should clear', async () =>
  {
    const wsr = new WSRecognizer(DefaultServerConfiguration, DefaultRecognitionConfiguration)

    const connectionActiveDeferred = new DeferredPromise()
    wsr.wsEvent.emitConnectionActive = jest.fn(() => connectionActiveDeferred.resolve(true))

    wsr.init(height, width)

    await connectionActiveDeferred.promise
    //¯\_(ツ)_/¯ required to wait the socket.readyState = OPEN only due to mock
    await delay(100)
    wsr.clear()
    //¯\_(ツ)_/¯  required to wait server received message
    await delay(100)

    const resizeMessageSent = mockServer.messages[mockServer.messages.length - 1]
    const resizeMessageSentToTest = JSON.stringify({
      type: 'clear',
    })
    expect(resizeMessageSent).toContain(resizeMessageSentToTest)
  })
})
