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
    mockServer = new Server(`wss://${ DefaultServerConfiguration.host }/api/v4.0/iink/document`, { })

    mockServer.on('connection', (socket) =>
    {
      socket.on('message', (message: string | Blob | ArrayBuffer | ArrayBufferView) =>
      {
        const parsedMessage: TWebSocketEvent = JSON.parse(message as string)
        switch (parsedMessage.type) {
          case 'newContentPackage':
            socket.send(JSON.stringify(ackMessage))
            break;
          case 'hmac':
            socket.send(JSON.stringify(contentPackageDescriptionMessage))
            break;
          case 'configuration':
            socket.send(JSON.stringify(partChangeMessage))
            break;
          case 'newContentPart':
            socket.send(JSON.stringify(newPartMessage))
            break;
          default:
            break;
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

    const parsedMessage = mockServer.messages.map((m: DeserializedMessage<object>) => {
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
          "p": [ 0.5, 0.1 ],
          "pointerId": 1,
          "pointerType": "pen",
          "t": [ 1, 10 ],
          "x": [ 1, 100 ],
          "y": [ 1, 1 ],
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

    mockServer.close({ code: 1000, reason: 'test', wasClean: true})
    await closeDeferred.promise

    expect(wsr.wsEvent.emitDisconnected).toBeCalledWith(
      expect.objectContaining({ type: 'close', code: 1000, reason: 'test'})
    )
  })

  test('should emit error & disconnected if the server closes the connection abnormally (code != 1000)', async () =>
  {
    const wsr = new WSRecognizer(DefaultServerConfiguration, DefaultRecognitionConfiguration)

    const connectionActiveDeferred = new DeferredPromise()
    wsr.wsEvent.emitConnectionActive = jest.fn(() => connectionActiveDeferred.resolve(true))

    const closeDeferred = new DeferredPromise()
    wsr.wsEvent.emitDisconnected = jest.fn((p) => closeDeferred.resolve(p))

    const errorDeferred = new DeferredPromise()
    wsr.wsEvent.emitError = jest.fn((p) => errorDeferred.resolve(p))

    wsr.init(height, width)

    await connectionActiveDeferred.promise
    await delay(100)

    mockServer.close({ code: 1011, reason: 'not-normally-closure', wasClean: true})
    await errorDeferred.promise
    await closeDeferred.promise

    expect(wsr.wsEvent.emitError).toBeCalledTimes(1)
    expect(wsr.wsEvent.emitError).toBeCalledWith(new Error(ErrorConst.INTERNAL_ERROR))

    expect(wsr.wsEvent.emitDisconnected).toBeCalledTimes(1)
    expect(wsr.wsEvent.emitDisconnected).toBeCalledWith(
      expect.objectContaining({ type: 'close', code: 1011, reason: 'not-normally-closure'})
    )
  })

  test('should emit error if the server send message with type error', async () =>
  {
    const wsr = new WSRecognizer(DefaultServerConfiguration, DefaultRecognitionConfiguration)

    const connectionActiveDeferred = new DeferredPromise()
    wsr.wsEvent.emitConnectionActive = jest.fn(() => connectionActiveDeferred.resolve(true))

    const errorDeferred = new DeferredPromise()
    wsr.wsEvent.emitError = jest.fn((p) => errorDeferred.resolve(p))

    wsr.init(height, width)

    await connectionActiveDeferred.promise
    await delay(100)

    const errorMessageToSent = {"type":"error", "message":"Session closed due to no activity.","code":"no.activity" }
    mockServer.send(JSON.stringify(errorMessageToSent))
    await errorDeferred.promise

    expect(wsr.wsEvent.emitError).toBeCalledTimes(1)
    expect(wsr.wsEvent.emitError).toBeCalledWith(new Error(errorMessageToSent.message))
  })

  const recognitionTypeList: TRecognitionType[] = ['TEXT', 'DIAGRAM', 'MATH', 'Raw Content']
  recognitionTypeList.forEach((recognitionType: TRecognitionType) => {
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

      let mimeType = ''
      switch (recognitionType) {
        case 'TEXT':
          mimeType = 'text/plain'
          break;
        case 'DIAGRAM':
          mimeType = 'application/vnd.myscript.jiix'
          break;
        case 'MATH':
          mimeType = 'application/x-latex'
          break;
        case 'Raw Content':
          mimeType = 'application/vnd.myscript.jiix'
          break;

        default:
          throw new Error("invalid recognition type");
      }
      const exportMessageSentToTest = JSON.stringify({
        type: 'export',
        partId: partChangeMessage.partId,
        mimeTypes: [mimeType]
      })
      expect(exportMessageSent).toContain(exportMessageSentToTest)
    })
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
