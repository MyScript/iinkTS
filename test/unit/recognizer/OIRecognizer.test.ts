import { OffScreenOverrideConfiguration } from "../__dataset__/configuration.dataset"
import { ServerOIWebsocketMock, contextlessGestureMessage, gestureDetectedMessage, hTextJIIX, partChangeMessage } from "../__mocks__/ServerOIWebsocketMock"
import { buildOIStroke, delay } from "../helpers"
import
{
  OIRecognizer,
  RecognizerError,
  TServerConfiguration,
  TRecognitionConfiguration,
  TMatrixTransform,
  MatrixTransform,
  TOIHistoryBackendChanges,
} from "../../../src/iink"
import { toResolve } from 'jest-extended'
expect.extend({ toResolve })

describe("OIRecognizer.ts", () =>
{
  const ServerConfig = OffScreenOverrideConfiguration.server as TServerConfiguration
  const RecognitionConfig = OffScreenOverrideConfiguration.recognition as TRecognitionConfiguration

  test("should instanciate OIRecognizer", () =>
  {
    const oiRecognizer = new OIRecognizer(ServerConfig, RecognitionConfig)
    expect(oiRecognizer).toBeDefined()
  })

  describe("Properties", () =>
  {
    test("should get url", () =>
    {
      const serverConfig = {
        ...ServerConfig,
        scheme: "http",
        host: "pony",
        applicationKey: "applicationKey"
      } as TServerConfiguration
      const oiRecognizer = new OIRecognizer(serverConfig, RecognitionConfig)
      expect(oiRecognizer.url).toEqual("ws://pony/api/v4.0/iink/offscreen?applicationKey=applicationKey")
    })

    test(`should get mimeTypes`, () =>
    {
      const oiRecognizer = new OIRecognizer(ServerConfig, RecognitionConfig)
      expect(oiRecognizer.mimeTypes).toEqual(["application/vnd.myscript.jiix"])
    })
  })

  describe("init", () =>
  {
    const serverConfig: TServerConfiguration = {
      ...ServerConfig,
      host: "init-test"
    }
    let mockServer: ServerOIWebsocketMock
    let oiRecognizer: OIRecognizer

    beforeEach(() =>
    {
      oiRecognizer = new OIRecognizer(serverConfig, RecognitionConfig)
      mockServer = new ServerOIWebsocketMock(oiRecognizer.url)
    })
    afterEach(async () =>
    {
      await oiRecognizer.destroy()
      mockServer.close()
    })

    test("should have dialog sequence with hmacChallenge", async () =>
    {
      expect(mockServer.getMessages("authenticate")).toHaveLength(0)
      const promise = oiRecognizer.init()
      //¯\_(ツ)_/¯  required to wait server received message
      await delay(100)
      expect(mockServer.getMessages("authenticate")).toHaveLength(1)

      expect(mockServer.getMessages("hmac")).toHaveLength(0)
      mockServer.sendHMACChallenge()
      //¯\_(ツ)_/¯  required to wait server received message
      await delay(100)
      expect(mockServer.getMessages("hmac")).toHaveLength(1)

      expect(mockServer.getMessages("initSession")).toHaveLength(0)
      mockServer.sendAuthenticated()
      //¯\_(ツ)_/¯  required to wait server received message
      await delay(100)
      expect(mockServer.getMessages("initSession")).toHaveLength(1)

      expect(mockServer.getMessages("newContentPart")).toHaveLength(0)
      mockServer.sendSessionDescription()
      //¯\_(ツ)_/¯  required to wait server received message
      await delay(100)
      expect(mockServer.getMessages("newContentPart")).toHaveLength(1)

      mockServer.sendPartChangeMessage()
      await promise
      expect(1).toEqual(1)
    })
    test("should have dialog sequence without hmacChallenge", async () =>
    {
      expect(mockServer.getMessages("authenticate")).toHaveLength(0)
      const promise = oiRecognizer.init()
      //¯\_(ツ)_/¯  required to wait server received message
      await delay(100)
      expect(mockServer.getMessages("authenticate")).toHaveLength(1)

      expect(mockServer.getMessages("initSession")).toHaveLength(0)
      mockServer.sendAuthenticated()
      //¯\_(ツ)_/¯  required to wait server received message
      await delay(100)
      expect(mockServer.getMessages("initSession")).toHaveLength(1)

      expect(mockServer.getMessages("newContentPart")).toHaveLength(0)
      mockServer.sendSessionDescription()
      //¯\_(ツ)_/¯  required to wait server received message
      await delay(100)
      expect(mockServer.getMessages("newContentPart")).toHaveLength(1)

      mockServer.sendPartChangeMessage()
      await promise
      expect(1).toEqual(1)
    })
    test("should have dialog sequence with newPart", async () =>
    {
      expect(mockServer.getMessages("authenticate")).toHaveLength(0)
      const promise = oiRecognizer.init()
      //¯\_(ツ)_/¯  required to wait server received message
      await delay(100)
      expect(mockServer.getMessages("authenticate")).toHaveLength(1)

      expect(mockServer.getMessages("initSession")).toHaveLength(0)
      mockServer.sendAuthenticated()
      //¯\_(ツ)_/¯  required to wait server received message
      await delay(100)
      expect(mockServer.getMessages("initSession")).toHaveLength(1)

      expect(mockServer.getMessages("newContentPart")).toHaveLength(0)
      mockServer.sendSessionDescription()
      //¯\_(ツ)_/¯  required to wait server received message
      await delay(100)
      expect(mockServer.getMessages("newContentPart")).toHaveLength(1)

      mockServer.sendNewPartMessage()
      await promise
      expect(1).toEqual(1)
    })
    test("should reject if receive error message", async () =>
    {
      const spyEmitError: jest.SpyInstance = jest.spyOn(oiRecognizer.event, "emitError")
      expect.assertions(3)
      const promise = oiRecognizer.init()
      //¯\_(ツ)_/¯  required to wait for the instantiation of the promise of the recognizer
      await delay(100)
      mockServer.sendNotGrantedErrorMessage()
      await expect(promise).rejects.toEqual(RecognizerError.WRONG_CREDENTIALS)
      await expect(spyEmitError).toHaveBeenCalledTimes(1)
      await expect(spyEmitError).toHaveBeenCalledWith(new Error(RecognizerError.WRONG_CREDENTIALS))
    })
  })

  //TODO fix mock web worker
  describe.skip("Ping", () =>
  {
    const serverConfig: TServerConfiguration = {
      ...JSON.parse(JSON.stringify(ServerConfig)),
      host: "ping-test"
    }
    let mockServer: ServerOIWebsocketMock
    let oiRecognizer: OIRecognizer

    beforeEach(() =>
    {
      oiRecognizer = new OIRecognizer(serverConfig, RecognitionConfig)

      mockServer = new ServerOIWebsocketMock(oiRecognizer.url)
      mockServer.init()
    })
    afterEach(async () =>
    {
      await oiRecognizer.destroy()
      mockServer.close()
    })

    test("should send ping message", async () =>
    {
      expect.assertions(2)
      serverConfig.websocket.pingEnabled = true
      const oiRecognizer = new OIRecognizer(serverConfig, RecognitionConfig)
      await oiRecognizer.init()
      await delay(serverConfig.websocket.pingDelay * 1.5)
      expect(mockServer.getMessages("ping")).toHaveLength(1)
      await delay(serverConfig.websocket.pingDelay)
      expect(mockServer.getMessages("ping")).toHaveLength(2)
      await oiRecognizer.destroy()
    })
    test("should not send ping message", async () =>
    {
      expect.assertions(2)
      serverConfig.websocket.pingEnabled = false
      const oiRecognizer = new OIRecognizer(serverConfig, RecognitionConfig)
      await oiRecognizer.init()
      await delay(serverConfig.websocket.pingDelay * 1.5)
      expect(mockServer.getMessages("ping")).toHaveLength(0)
      await delay(serverConfig.websocket.pingDelay)
      expect(mockServer.getMessages("ping")).toHaveLength(0)
      await oiRecognizer.destroy()
    })
    test("should close the connection when maxPingLostCount is reached", async () =>
    {
      expect.assertions(3)
      serverConfig.websocket.pingEnabled = true
      serverConfig.websocket.maxPingLostCount = 2
      const oiRecognizer = new OIRecognizer(serverConfig, RecognitionConfig)
      await oiRecognizer.init()
      await delay(serverConfig.websocket.pingDelay * 1.5)
      expect(mockServer.server.clients()).toHaveLength(1)
      await delay(serverConfig.websocket.pingDelay * serverConfig.websocket.maxPingLostCount + 100)
      expect(mockServer.getMessages("ping")).toHaveLength(serverConfig.websocket.maxPingLostCount + 1)
      expect(mockServer.server.clients()).toHaveLength(0)
    })
  })

  describe("send", () =>
  {
    const serverConfig: TServerConfiguration = {
      ...ServerConfig,
      host: "send-test"
    }
    serverConfig.websocket.autoReconnect = true
    let mockServer: ServerOIWebsocketMock
    let oiRecognizer: OIRecognizer

    beforeEach(() =>
    {
      oiRecognizer = new OIRecognizer(serverConfig, RecognitionConfig)
      mockServer = new ServerOIWebsocketMock(oiRecognizer.url)
      mockServer.init()
    })
    afterEach(async () =>
    {
      await oiRecognizer.destroy()
      mockServer.close()
    })

    test("should send message", async () =>
    {
      expect.assertions(1)
      await oiRecognizer.init()
      const testDataToSend = { type: "test", data: "test-data" }
      await oiRecognizer.send(testDataToSend)
      //¯\_(ツ)_/¯  required to wait server received message
      await delay(100)
      const messageSent = JSON.parse(mockServer.getLastMessage() as string)
      expect(messageSent).toEqual(testDataToSend)
    })
    test("should reconnect before send message", async () =>
    {
      expect.assertions(1)
      await oiRecognizer.init()
      await oiRecognizer.close(1000, "CLOSE_RECOGNIZER")
      const testDataToSend = { type: "test", data: "test-data" }
      await oiRecognizer.send(testDataToSend)
      //¯\_(ツ)_/¯  required to wait server received message
      await delay(300)
      const messageSent = JSON.parse(mockServer.getLastMessage() as string)
      expect(messageSent).toEqual(testDataToSend)
    })
  })

  describe("addStrokes", () =>
  {
    const serverConfig: TServerConfiguration = {
      ...ServerConfig,
      host: "add-strokes-test"
    }
    let mockServer: ServerOIWebsocketMock
    let oiRecognizer: OIRecognizer
    const strokes = [buildOIStroke()]

    beforeEach(() =>
    {
      oiRecognizer = new OIRecognizer(serverConfig, RecognitionConfig)
      mockServer = new ServerOIWebsocketMock(oiRecognizer.url)
      mockServer.init()
    })
    afterEach(async () =>
    {
      await oiRecognizer.destroy()
      mockServer.close()
    })

    test("should not send addStrokes message if 0 strokes", async () =>
    {
      expect.assertions(1)
      await oiRecognizer.init()
      await oiRecognizer.addStrokes([])
      //¯\_(ツ)_/¯  required to wait server received message
      await delay(100)
      const messageSent = JSON.parse(mockServer.getLastMessage() as string)
      await expect(messageSent.type).not.toEqual("addStrokes")
    })
    test("should send addStrokes message", async () =>
    {
      expect.assertions(1)
      await oiRecognizer.init()
      oiRecognizer.addStrokes(strokes)
      //¯\_(ツ)_/¯  required to wait for the instantiation of the promise of the recognizer
      await delay(100)
      const messageSent = JSON.parse(mockServer.getLastMessage() as string)
      const messageSentExpected = {
        type: "addStrokes",
        strokes: strokes.map(s => s.formatToSend())
      }
      await expect(messageSent).toMatchObject(messageSentExpected)
    })
    test("should resolve addStrokes when received gestureDetected", async () =>
    {
      expect.assertions(1)
      await oiRecognizer.init()
      const promise = oiRecognizer.addStrokes(strokes)
      //¯\_(ツ)_/¯  required to wait for the instantiation of the promise of the recognizer
      await delay(100)
      mockServer.sendGestureDetectedMessage()
      await expect(promise).resolves.toEqual(gestureDetectedMessage)
    })
    test("should reject if receive error message", async () =>
    {
      const spyEmitError: jest.SpyInstance = jest.spyOn(oiRecognizer.event, "emitError")
      expect.assertions(3)
      await oiRecognizer.init()
      const promise = oiRecognizer.addStrokes(strokes)
      //¯\_(ツ)_/¯  required to wait for the instantiation of the promise of the recognizer
      await delay(100)
      mockServer.sendNotGrantedErrorMessage()
      await expect(promise).rejects.toEqual(RecognizerError.WRONG_CREDENTIALS)
      await expect(spyEmitError).toHaveBeenCalledTimes(1)
      await expect(spyEmitError).toHaveBeenCalledWith(new Error(RecognizerError.WRONG_CREDENTIALS))
    })
  })

  describe("replaceStrokes", () =>
  {
    const serverConfig: TServerConfiguration = {
      ...ServerConfig,
      host: "replace-strokes-test"
    }
    let mockServer: ServerOIWebsocketMock
    let oiRecognizer: OIRecognizer
    const strokes = [buildOIStroke()]
    const oldStrokeIds = ["id-1", "id-2"]

    beforeEach(() =>
    {
      oiRecognizer = new OIRecognizer(serverConfig, RecognitionConfig)
      mockServer = new ServerOIWebsocketMock(oiRecognizer.url)
      mockServer.init()
    })
    afterEach(async () =>
    {
      await oiRecognizer.destroy()
      mockServer.close()
    })

    test("should not send replaceStrokes message if 0 strokes", async () =>
    {
      expect.assertions(1)
      await oiRecognizer.init()
      await oiRecognizer.replaceStrokes([], [])
      //¯\_(ツ)_/¯  required to wait server received message
      await delay(100)
      const messageSent = JSON.parse(mockServer.getLastMessage() as string)
      await expect(messageSent.type).not.toEqual("replaceStrokes")
    })
    test("should send replaceStrokes message", async () =>
    {
      expect.assertions(1)
      await oiRecognizer.init()
      oiRecognizer.replaceStrokes(oldStrokeIds, strokes)
      //¯\_(ツ)_/¯  required to wait for the instantiation of the promise of the recognizer
      await delay(100)
      const messageSent = JSON.parse(mockServer.getLastMessage() as string)
      const messageSentExpected = {
        type: "replaceStrokes",
        oldStrokeIds,
      }
      await expect(messageSent).toMatchObject(messageSentExpected)
    })
    test("should resolve replaceStrokes when received contentChanged", async () =>
    {
      expect.assertions(1)
      await oiRecognizer.init()
      const promise = oiRecognizer.replaceStrokes(oldStrokeIds, strokes)
      //¯\_(ツ)_/¯  required to wait for the instantiation of the promise of the recognizer
      await delay(100)
      mockServer.sendContentChangeMessage()
      await expect(promise).toResolve()
    })
    test("should reject if receive error message", async () =>
    {
      const spyEmitError: jest.SpyInstance = jest.spyOn(oiRecognizer.event, "emitError")
      expect.assertions(3)
      await oiRecognizer.init()
      const promise = oiRecognizer.replaceStrokes(oldStrokeIds, strokes)
      //¯\_(ツ)_/¯  required to wait for the instantiation of the promise of the recognizer
      await delay(100)
      mockServer.sendNotGrantedErrorMessage()
      await expect(promise).rejects.toEqual(RecognizerError.WRONG_CREDENTIALS)
      await expect(spyEmitError).toHaveBeenCalledTimes(1)
      await expect(spyEmitError).toHaveBeenCalledWith(new Error(RecognizerError.WRONG_CREDENTIALS))
    })
  })

  describe("transformTranslate", () =>
  {
    const serverConfig: TServerConfiguration = {
      ...ServerConfig,
      host: "replace-strokes-test"
    }
    let mockServer: ServerOIWebsocketMock
    let oiRecognizer: OIRecognizer
    const strokeIds = ["id-1", "id-2"]
    const tx = 5, ty = 10

    beforeEach(() =>
    {
      oiRecognizer = new OIRecognizer(serverConfig, RecognitionConfig)
      mockServer = new ServerOIWebsocketMock(oiRecognizer.url)
      mockServer.init()
    })
    afterEach(async () =>
    {
      await oiRecognizer.destroy()
      mockServer.close()
    })

    test("should not send transformTranslate message if 0 strokes", async () =>
    {
      expect.assertions(1)
      await oiRecognizer.init()
      await oiRecognizer.transformTranslate([], tx, ty)
      //¯\_(ツ)_/¯  required to wait server received message
      await delay(100)
      const messageSent = JSON.parse(mockServer.getLastMessage() as string)
      await expect(messageSent.type).not.toEqual("transformTranslate")
    })
    test("should send transformTranslate message", async () =>
    {
      expect.assertions(1)
      await oiRecognizer.init()
      oiRecognizer.transformTranslate(strokeIds, tx, ty)
      //¯\_(ツ)_/¯  required to wait for the instantiation of the promise of the recognizer
      await delay(100)
      const messageSent = JSON.parse(mockServer.getLastMessage() as string)
      const messageSentExpected = {
        type: "transform",
        transformationType: "TRANSLATE",
        strokeIds,
        tx,
        ty
      }
      await expect(messageSent).toMatchObject(messageSentExpected)
    })
    test("should resolve transformTranslate when received contentChanged", async () =>
    {
      expect.assertions(1)
      await oiRecognizer.init()
      const promise = oiRecognizer.transformTranslate(strokeIds, tx, ty)
      //¯\_(ツ)_/¯  required to wait for the instantiation of the promise of the recognizer
      await delay(100)
      mockServer.sendContentChangeMessage()
      await expect(promise).toResolve()
    })
    test("should reject if receive error message", async () =>
    {
      const spyEmitError: jest.SpyInstance = jest.spyOn(oiRecognizer.event, "emitError")
      expect.assertions(3)
      await oiRecognizer.init()
      const promise = oiRecognizer.transformTranslate(strokeIds, tx, ty)
      //¯\_(ツ)_/¯  required to wait for the instantiation of the promise of the recognizer
      await delay(100)
      mockServer.sendNotGrantedErrorMessage()
      await expect(promise).rejects.toEqual(RecognizerError.WRONG_CREDENTIALS)
      await expect(spyEmitError).toHaveBeenCalledTimes(1)
      await expect(spyEmitError).toHaveBeenCalledWith(new Error(RecognizerError.WRONG_CREDENTIALS))
    })
  })

  describe("transformRotate", () =>
  {
    const serverConfig: TServerConfiguration = {
      ...ServerConfig,
      host: "replace-strokes-test"
    }
    let mockServer: ServerOIWebsocketMock
    let oiRecognizer: OIRecognizer
    const strokeIds = ["id-1", "id-2"]
    const angle = Math.PI / 2, x0 = 10, y0 = 20

    beforeEach(() =>
    {
      oiRecognizer = new OIRecognizer(serverConfig, RecognitionConfig)
      mockServer = new ServerOIWebsocketMock(oiRecognizer.url)
      mockServer.init()
    })
    afterEach(async () =>
    {
      await oiRecognizer.destroy()
      mockServer.close()
    })

    test("should not send transformRotate message if 0 strokes", async () =>
    {
      expect.assertions(1)
      await oiRecognizer.init()
      await oiRecognizer.transformRotate([], angle, x0, y0)
      //¯\_(ツ)_/¯  required to wait server received message
      await delay(100)
      const messageSent = JSON.parse(mockServer.getLastMessage() as string)
      await expect(messageSent.type).not.toEqual("transformRotate")
    })
    test("should send transformRotate message", async () =>
    {
      expect.assertions(1)
      await oiRecognizer.init()
      oiRecognizer.transformRotate(strokeIds, angle, x0, y0)
      //¯\_(ツ)_/¯  required to wait for the instantiation of the promise of the recognizer
      await delay(100)
      const messageSent = JSON.parse(mockServer.getLastMessage() as string)
      const messageSentExpected = {
        type: "transform",
        transformationType: "ROTATE",
        strokeIds,
        angle,
        x0,
        y0
      }
      await expect(messageSent).toMatchObject(messageSentExpected)
    })
    test("should resolve transformRotate when received contentChanged", async () =>
    {
      expect.assertions(1)
      await oiRecognizer.init()
      const promise = oiRecognizer.transformRotate(strokeIds, angle, x0, y0)
      //¯\_(ツ)_/¯  required to wait for the instantiation of the promise of the recognizer
      await delay(100)
      mockServer.sendContentChangeMessage()
      await expect(promise).toResolve()
    })
    test("should reject if receive error message", async () =>
    {
      const spyEmitError: jest.SpyInstance = jest.spyOn(oiRecognizer.event, "emitError")
      expect.assertions(3)
      await oiRecognizer.init()
      const promise = oiRecognizer.transformRotate(strokeIds, angle, x0, y0)
      //¯\_(ツ)_/¯  required to wait for the instantiation of the promise of the recognizer
      await delay(100)
      mockServer.sendNotGrantedErrorMessage()
      await expect(promise).rejects.toEqual(RecognizerError.WRONG_CREDENTIALS)
      await expect(spyEmitError).toHaveBeenCalledTimes(1)
      await expect(spyEmitError).toHaveBeenCalledWith(new Error(RecognizerError.WRONG_CREDENTIALS))
    })
  })

  describe("transformScale", () =>
  {
    const serverConfig: TServerConfiguration = {
      ...ServerConfig,
      host: "replace-strokes-test"
    }
    let mockServer: ServerOIWebsocketMock
    let oiRecognizer: OIRecognizer
    const strokeIds = ["id-1", "id-2"]
    const scaleX = 2, scaleY = 2, x0 = 10, y0 = 20

    beforeEach(() =>
    {
      oiRecognizer = new OIRecognizer(serverConfig, RecognitionConfig)
      mockServer = new ServerOIWebsocketMock(oiRecognizer.url)
      mockServer.init()
    })
    afterEach(async () =>
    {
      await oiRecognizer.destroy()
      mockServer.close()
    })

    test("should not send transformScale message if 0 strokes", async () =>
    {
      expect.assertions(1)
      await oiRecognizer.init()
      await oiRecognizer.transformScale([], scaleX, scaleY, x0, y0)
      //¯\_(ツ)_/¯  required to wait server received message
      await delay(100)
      const messageSent = JSON.parse(mockServer.getLastMessage() as string)
      await expect(messageSent.type).not.toEqual("transformScale")
    })
    test("should send transformScale message", async () =>
    {
      expect.assertions(1)
      await oiRecognizer.init()
      oiRecognizer.transformScale(strokeIds, scaleX, scaleY, x0, y0)
      //¯\_(ツ)_/¯  required to wait for the instantiation of the promise of the recognizer
      await delay(100)
      const messageSent = JSON.parse(mockServer.getLastMessage() as string)
      const messageSentExpected = {
        type: "transform",
        transformationType: "SCALE",
        strokeIds,
        scaleX,
        scaleY,
        x0,
        y0
      }
      await expect(messageSent).toMatchObject(messageSentExpected)
    })
    test("should resolve transformScale when received contentChanged", async () =>
    {
      expect.assertions(1)
      await oiRecognizer.init()
      const promise = oiRecognizer.transformScale(strokeIds, scaleX, scaleY, x0, y0)
      //¯\_(ツ)_/¯  required to wait for the instantiation of the promise of the recognizer
      await delay(100)
      mockServer.sendContentChangeMessage()
      await expect(promise).toResolve()
    })
    test("should reject if receive error message", async () =>
    {
      const spyEmitError: jest.SpyInstance = jest.spyOn(oiRecognizer.event, "emitError")
      expect.assertions(3)
      await oiRecognizer.init()
      const promise = oiRecognizer.transformScale(strokeIds, scaleX, scaleY, x0, y0)
      //¯\_(ツ)_/¯  required to wait for the instantiation of the promise of the recognizer
      await delay(100)
      mockServer.sendNotGrantedErrorMessage()
      await expect(promise).rejects.toEqual(RecognizerError.WRONG_CREDENTIALS)
      await expect(spyEmitError).toHaveBeenCalledTimes(1)
      await expect(spyEmitError).toHaveBeenCalledWith(new Error(RecognizerError.WRONG_CREDENTIALS))
    })
  })

  describe("transformMatrix", () =>
  {
    const serverConfig: TServerConfiguration = {
      ...ServerConfig,
      host: "transform-strokes-test"
    }
    let mockServer: ServerOIWebsocketMock
    let oiRecognizer: OIRecognizer
    const strokeIds = ["id-1", "id-2"]
    const matrix: TMatrixTransform = new MatrixTransform(6, 5, 4, 3, 2, 1)

    beforeEach(() =>
    {
      oiRecognizer = new OIRecognizer(serverConfig, RecognitionConfig)
      mockServer = new ServerOIWebsocketMock(oiRecognizer.url)
      mockServer.init()
    })
    afterEach(async () =>
    {
      await oiRecognizer.destroy()
      mockServer.close()
    })

    test("should not send transformMatrix message if 0 strokes", async () =>
    {
      expect.assertions(1)
      await oiRecognizer.init()
      await oiRecognizer.transformMatrix([], matrix)
      //¯\_(ツ)_/¯  required to wait server received message
      await delay(100)
      const messageSent = JSON.parse(mockServer.getLastMessage() as string)
      await expect(messageSent.type).not.toEqual("transformMatrix")
    })
    test("should send transformMatrix message", async () =>
    {
      expect.assertions(1)
      await oiRecognizer.init()
      oiRecognizer.transformMatrix(strokeIds, matrix)
      //¯\_(ツ)_/¯  required to wait for the instantiation of the promise of the recognizer
      await delay(100)
      const messageSent = JSON.parse(mockServer.getLastMessage() as string)
      const messageSentExpected = {
        type: "transform",
        transformationType: "MATRIX",
        strokeIds,
        ...matrix
      }
      await expect(messageSent).toMatchObject(messageSentExpected)
    })
    test("should resolve transformMatrix when received contentChanged", async () =>
    {
      expect.assertions(1)
      await oiRecognizer.init()
      const promise = oiRecognizer.transformMatrix(strokeIds, matrix)
      //¯\_(ツ)_/¯  required to wait for the instantiation of the promise of the recognizer
      await delay(100)
      mockServer.sendContentChangeMessage()
      await expect(promise).toResolve()
    })
    test("should reject if receive error message", async () =>
    {
      const spyEmitError: jest.SpyInstance = jest.spyOn(oiRecognizer.event, "emitError")
      expect.assertions(3)
      await oiRecognizer.init()
      const promise = oiRecognizer.transformMatrix(strokeIds, matrix)
      //¯\_(ツ)_/¯  required to wait for the instantiation of the promise of the recognizer
      await delay(100)
      mockServer.sendNotGrantedErrorMessage()
      await expect(promise).rejects.toEqual(RecognizerError.WRONG_CREDENTIALS)
      await expect(spyEmitError).toHaveBeenCalledTimes(1)
      await expect(spyEmitError).toHaveBeenCalledWith(new Error(RecognizerError.WRONG_CREDENTIALS))
    })
  })

  describe("eraseStrokes", () =>
  {
    const serverConfig: TServerConfiguration = {
      ...ServerConfig,
      host: "erase-strokes-test"
    }
    let mockServer: ServerOIWebsocketMock
    let oiRecognizer: OIRecognizer
    const strokeIds = ["erase-1"]

    beforeEach(() =>
    {
      oiRecognizer = new OIRecognizer(serverConfig, RecognitionConfig)
      mockServer = new ServerOIWebsocketMock(oiRecognizer.url)
      mockServer.init()
    })
    afterEach(async () =>
    {
      await oiRecognizer.destroy()
      mockServer.close()
    })

    test("should not send eraseStrokes message if 0 strokes", async () =>
    {
      expect.assertions(1)
      await oiRecognizer.init()
      await oiRecognizer.eraseStrokes([])
      //¯\_(ツ)_/¯  required to wait server received message
      await delay(100)
      const messageSent = JSON.parse(mockServer.getLastMessage() as string)
      await expect(messageSent.type).not.toEqual("eraseStrokes")
    })
    test("should send eraseStrokes message", async () =>
    {
      expect.assertions(1)
      await oiRecognizer.init()
      oiRecognizer.eraseStrokes(strokeIds)
      //¯\_(ツ)_/¯  required to wait for the instantiation of the promise of the recognizer
      await delay(100)
      const messageSent = JSON.parse(mockServer.getLastMessage() as string)
      const messageSentExpected = {
        type: "eraseStrokes",
        strokeIds
      }
      await expect(messageSent).toMatchObject(messageSentExpected)
    })
    test("should resolve eraseStrokes when received contentChanged", async () =>
    {
      expect.assertions(1)
      await oiRecognizer.init()
      const promise = oiRecognizer.eraseStrokes(strokeIds)
      //¯\_(ツ)_/¯  required to wait for the instantiation of the promise of the recognizer
      await delay(100)
      mockServer.sendContentChangeMessage()
      await expect(promise).toResolve()
    })
    test("should reject if receive error message", async () =>
    {
      const spyEmitError: jest.SpyInstance = jest.spyOn(oiRecognizer.event, "emitError")
      expect.assertions(3)
      await oiRecognizer.init()
      const promise = oiRecognizer.eraseStrokes(strokeIds)
      //¯\_(ツ)_/¯  required to wait for the instantiation of the promise of the recognizer
      await delay(100)
      mockServer.sendNotGrantedErrorMessage()
      await expect(promise).rejects.toEqual(RecognizerError.WRONG_CREDENTIALS)
      await expect(spyEmitError).toHaveBeenCalledTimes(1)
      await expect(spyEmitError).toHaveBeenCalledWith(new Error(RecognizerError.WRONG_CREDENTIALS))
    })
  })

  describe("recognizeGesture", () =>
  {
    const serverConfig: TServerConfiguration = {
      ...ServerConfig,
      host: "erase-strokes-test"
    }
    let mockServer: ServerOIWebsocketMock
    let oiRecognizer: OIRecognizer
    const stroke = buildOIStroke()

    beforeEach(() =>
    {
      oiRecognizer = new OIRecognizer(serverConfig, RecognitionConfig)
      mockServer = new ServerOIWebsocketMock(oiRecognizer.url)
      mockServer.init()
    })
    afterEach(async () =>
    {
      await oiRecognizer.destroy()
      mockServer.close()
    })

    test("should not send recognizeGesture message if 0 strokes", async () =>
    {
      expect.assertions(1)
      await oiRecognizer.init()
      //@ts-ignore
      await oiRecognizer.recognizeGesture()
      //¯\_(ツ)_/¯  required to wait server received message
      await delay(100)
      const messageSent = JSON.parse(mockServer.getLastMessage() as string)
      await expect(messageSent.type).not.toEqual("recognizeGesture")
    })
    test("should send recognizeGesture message", async () =>
    {
      expect.assertions(1)
      await oiRecognizer.init()
      oiRecognizer.recognizeGesture(stroke)
      //¯\_(ツ)_/¯  required to wait for the instantiation of the promise of the recognizer
      await delay(100)
      const messageSent = JSON.parse(mockServer.getLastMessage() as string)
      const messageSentExpected = {
        type: "contextlessGesture",
        stroke: stroke.formatToSend()
      }
      await expect(messageSent).toMatchObject(messageSentExpected)
    })
    test("should resolve recognizeGesture when received contextlessGesture", async () =>
    {
      expect.assertions(1)
      await oiRecognizer.init()
      stroke.id = contextlessGestureMessage.strokeId
      const promise = oiRecognizer.recognizeGesture(stroke)
      //¯\_(ツ)_/¯  required to wait for the instantiation of the promise of the recognizer
      await delay(100)
      mockServer.sendContextlessGestureMessage()
      await expect(promise).toResolve()
    })
    test("should reject if receive error message", async () =>
    {
      const spyEmitError: jest.SpyInstance = jest.spyOn(oiRecognizer.event, "emitError")
      expect.assertions(3)
      await oiRecognizer.init()
      const promise = oiRecognizer.recognizeGesture(stroke)
      //¯\_(ツ)_/¯  required to wait for the instantiation of the promise of the recognizer
      await delay(100)
      mockServer.sendNotGrantedErrorMessage()
      await expect(promise).rejects.toEqual(RecognizerError.WRONG_CREDENTIALS)
      await expect(spyEmitError).toHaveBeenCalledTimes(1)
      await expect(spyEmitError).toHaveBeenCalledWith(new Error(RecognizerError.WRONG_CREDENTIALS))
    })
  })

  describe("waitForIdle", () =>
  {
    const serverConfig: TServerConfiguration = {
      ...ServerConfig,
      host: "waitForIdle-test"
    }
    let mockServer: ServerOIWebsocketMock
    let oiRecognizer: OIRecognizer

    beforeEach(() =>
    {
      oiRecognizer = new OIRecognizer(serverConfig, RecognitionConfig)
      mockServer = new ServerOIWebsocketMock(oiRecognizer.url)
      mockServer.init({ withIdle: false })
    })
    afterEach(async () =>
    {
      await oiRecognizer.destroy()
      mockServer.close()
    })

    test("should send waitForIdle & resolve when receive idle message", async () =>
    {
      expect.assertions(2)
      await oiRecognizer.init()
      const promise = oiRecognizer.waitForIdle()
      //¯\_(ツ)_/¯  required to wait server received message
      await delay(100)
      const wfiMessageSent = mockServer.getLastMessage()
      expect(wfiMessageSent).toEqual(JSON.stringify({ type: "waitForIdle" }))
      //¯\_(ツ)_/¯  required to wait for the instantiation of the promise of the recognizer
      await delay(100)
      mockServer.send(JSON.stringify({ type: "idle" }))
      await delay(100)
      await expect(promise).resolves.toBeUndefined()
    })
    test("should reject if receive error message", async () =>
    {
      const spyEmitError: jest.SpyInstance = jest.spyOn(oiRecognizer.event, "emitError")
      expect.assertions(3)
      await oiRecognizer.init()
      const promise = oiRecognizer.waitForIdle()
      //¯\_(ツ)_/¯  required to wait for the instantiation of the promise of the recognizer
      await delay(100)
      mockServer.sendNotGrantedErrorMessage()
      await expect(promise).rejects.toEqual(RecognizerError.WRONG_CREDENTIALS)
      await expect(spyEmitError).toHaveBeenCalledTimes(1)
      await expect(spyEmitError).toHaveBeenCalledWith(new Error(RecognizerError.WRONG_CREDENTIALS))
    })
  })

  describe("undo", () =>
  {
    const serverConfig: TServerConfiguration = {
      ...ServerConfig,
      host: "undo-test"
    }
    let mockServer: ServerOIWebsocketMock
    let oiRecognizer: OIRecognizer

    beforeEach(() =>
    {
      oiRecognizer = new OIRecognizer(serverConfig, RecognitionConfig)
      mockServer = new ServerOIWebsocketMock(oiRecognizer.url)
      mockServer.init()
    })
    afterEach(async () =>
    {
      await oiRecognizer.destroy()
      mockServer.close()
    })

    test("should not send message if no changes", async () =>
    {
      expect.assertions(2)
      await oiRecognizer.init()
      oiRecognizer.send = jest.fn()
      oiRecognizer.undo({})
      await delay(100)
      expect(oiRecognizer.send).toHaveBeenCalledTimes(0)
      const changes: TOIHistoryBackendChanges = { added: [buildOIStroke()] }
      oiRecognizer.undo(changes)
      await delay(100)
      expect(oiRecognizer.send).toHaveBeenCalledTimes(1)
    })
    test("should send undo message with changes", async () =>
    {
      await oiRecognizer.init()
      const changes: TOIHistoryBackendChanges = {
        added: [buildOIStroke()],
        erased: [buildOIStroke()],
        replaced: { newStrokes: [buildOIStroke()], oldStrokes: [buildOIStroke()] },
        matrix: { matrix: new MatrixTransform(1, 2, 3, 4, 5, 6), strokes: [buildOIStroke()] },
        rotate: [{ angle: Math.PI / 2, center: { x: 5, y: 10 }, strokes: [buildOIStroke()] }],
        scale: [{ origin: { x: 2, y: 4 }, scaleX: 2, scaleY: 3, strokes: [buildOIStroke()] }],
        translate: [{ strokes: [buildOIStroke()], tx: 12, ty: 42 }]
      }
      oiRecognizer.undo(changes)
      //¯\_(ツ)_/¯  required to wait for the instantiation of the promise of the recognizer
      await delay(100)
      const messageSent = JSON.parse(mockServer.getLastMessage() as string)
      expect(messageSent.type).toEqual("undo")
      expect(messageSent.changes).toHaveLength(Object.keys(changes).length)
      expect(messageSent.changes).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: "addStrokes",
            strokes: changes.added!.map(s => s.formatToSend()),
            processGestures: false
          })
        ])
      )
      expect(messageSent.changes).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
              type: "eraseStrokes",
              strokeIds: changes.erased!.map(s => s.id)
            })
        ])
      )
      expect(messageSent.changes).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: "replaceStrokes",
            oldStrokeIds: changes.replaced!.oldStrokes.map(s => s.id),
            newStrokes: changes.replaced!.newStrokes.map(s => s.formatToSend())
          })
        ])
      )
      expect(messageSent.changes).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: "transform",
            transformationType: "MATRIX",
            strokeIds: changes.matrix!.strokes.map(s => s.id),
            ...changes.matrix!.matrix
          })
        ])
      )
      expect(messageSent.changes).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: "transform",
            transformationType: "ROTATE",
            strokeIds: changes.rotate![0].strokes.map(s => s.id),
            angle: changes.rotate![0].angle,
            x0: changes.rotate![0].center.x,
            y0: changes.rotate![0].center.y
          })
        ])
      )
      expect(messageSent.changes).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: "transform",
            transformationType: "SCALE",
            strokeIds: changes.scale![0].strokes.map(s => s.id),
            scaleX: changes.scale![0].scaleX,
            scaleY: changes.scale![0].scaleY,
            x0: changes.scale![0].origin.x,
            y0: changes.scale![0].origin.y
          })
        ])
      )
      expect(messageSent.changes).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: "transform",
            transformationType: "TRANSLATE",
            strokeIds: changes.translate![0].strokes.map(s => s.id),
            tx: changes.translate![0].tx,
            ty: changes.translate![0].ty
          })
        ])
      )
    })
    test("should resolve undo when received contentChanged", async () =>
    {
      expect.assertions(1)
      await oiRecognizer.init()
      const changes: TOIHistoryBackendChanges = { added: [buildOIStroke()] }
      const promise = oiRecognizer.undo(changes)
      //¯\_(ツ)_/¯  required to wait for the instantiation of the promise of the recognizer
      await delay(100)
      mockServer.sendContentChangeMessage()
      await expect(promise).toResolve()
    })
    test("should reject if receive error message", async () =>
    {
      const spyEmitError: jest.SpyInstance = jest.spyOn(oiRecognizer.event, "emitError")
      expect.assertions(3)
      await oiRecognizer.init()
      const changes: TOIHistoryBackendChanges = { added: [buildOIStroke()] }
      const promise = oiRecognizer.undo(changes)
      //¯\_(ツ)_/¯  required to wait for the instantiation of the promise of the recognizer
      await delay(100)
      mockServer.sendNotGrantedErrorMessage()
      await expect(promise).rejects.toEqual(RecognizerError.WRONG_CREDENTIALS)
      expect(spyEmitError).toHaveBeenCalledTimes(1)
      expect(spyEmitError).toHaveBeenCalledWith(new Error(RecognizerError.WRONG_CREDENTIALS))
    })
  })

  describe("redo", () =>
  {
    const serverConfig: TServerConfiguration = {
      ...ServerConfig,
      host: "redo-test"
    }
    let mockServer: ServerOIWebsocketMock
    let oiRecognizer: OIRecognizer

    beforeEach(() =>
    {
      oiRecognizer = new OIRecognizer(serverConfig, RecognitionConfig)
      mockServer = new ServerOIWebsocketMock(oiRecognizer.url)
      mockServer.init()
    })
    afterEach(async () =>
    {
      await oiRecognizer.destroy()
      mockServer.close()
    })

    test("should send redo message", async () =>
    {
      expect.assertions(1)
      await oiRecognizer.init()
      const changes: TOIHistoryBackendChanges = { added: [buildOIStroke()] }
      oiRecognizer.redo(changes)
      //¯\_(ツ)_/¯  required to wait for the instantiation of the promise of the recognizer
      await delay(100)
      const messageSent = JSON.parse(mockServer.getLastMessage() as string)
      const messageSentExpected = { type: "redo" }
      await expect(messageSent).toMatchObject(messageSentExpected)
    })
    test("should resolve redo when received contentChanged", async () =>
    {
      expect.assertions(1)
      await oiRecognizer.init()
      const changes: TOIHistoryBackendChanges = { added: [buildOIStroke()] }
      const promise = oiRecognizer.redo(changes)
      //¯\_(ツ)_/¯  required to wait for the instantiation of the promise of the recognizer
      await delay(100)
      mockServer.sendContentChangeMessage()
      await expect(promise).toResolve()
    })
    test("should reject if receive error message", async () =>
    {
      const spyEmitError: jest.SpyInstance = jest.spyOn(oiRecognizer.event, "emitError")
      expect.assertions(3)
      await oiRecognizer.init()
      const changes: TOIHistoryBackendChanges = { added: [buildOIStroke()] }
      const promise = oiRecognizer.redo(changes)
      //¯\_(ツ)_/¯  required to wait for the instantiation of the promise of the recognizer
      await delay(100)
      mockServer.sendNotGrantedErrorMessage()
      await expect(promise).rejects.toEqual(RecognizerError.WRONG_CREDENTIALS)
      await expect(spyEmitError).toHaveBeenCalledTimes(1)
      await expect(spyEmitError).toHaveBeenCalledWith(new Error(RecognizerError.WRONG_CREDENTIALS))
    })
  })

  describe("clear", () =>
  {
    const serverConfig: TServerConfiguration = {
      ...ServerConfig,
      host: "clear-test"
    }
    let mockServer: ServerOIWebsocketMock
    let oiRecognizer: OIRecognizer

    beforeEach(() =>
    {
      oiRecognizer = new OIRecognizer(serverConfig, RecognitionConfig)
      mockServer = new ServerOIWebsocketMock(oiRecognizer.url)
      mockServer.init()
    })
    afterEach(async () =>
    {
      await oiRecognizer.destroy()
      mockServer.close()
    })

    test("should send clear message", async () =>
    {
      expect.assertions(1)
      await oiRecognizer.init()
      oiRecognizer.clear()
      //¯\_(ツ)_/¯  required to wait for the instantiation of the promise of the recognizer
      await delay(100)
      const messageSent = JSON.parse(mockServer.getLastMessage() as string)
      const messageSentExpected = { type: "clear" }
      await expect(messageSent).toMatchObject(messageSentExpected)
    })
    test("should resolve clear when received contentChanged", async () =>
    {
      expect.assertions(1)
      await oiRecognizer.init()
      const promise = oiRecognizer.clear()
      //¯\_(ツ)_/¯  required to wait for the instantiation of the promise of the recognizer
      await delay(100)
      mockServer.sendContentChangeMessage()
      await expect(promise).toResolve()
    })
    test("should reject if receive error message", async () =>
    {
      const spyEmitError: jest.SpyInstance = jest.spyOn(oiRecognizer.event, "emitError")
      expect.assertions(3)
      await oiRecognizer.init()
      const promise = oiRecognizer.clear()
      //¯\_(ツ)_/¯  required to wait for the instantiation of the promise of the recognizer
      await delay(100)
      mockServer.sendNotGrantedErrorMessage()
      await expect(promise).rejects.toEqual(RecognizerError.WRONG_CREDENTIALS)
      await expect(spyEmitError).toHaveBeenCalledTimes(1)
      await expect(spyEmitError).toHaveBeenCalledWith(new Error(RecognizerError.WRONG_CREDENTIALS))
    })
  })

  describe("export", () =>
  {
    const serverConfig: TServerConfiguration = {
      ...ServerConfig,
      host: "export-test"
    }
    let mockServer: ServerOIWebsocketMock
    let oiRecognizer: OIRecognizer

    beforeEach(() =>
    {
      oiRecognizer = new OIRecognizer(serverConfig, RecognitionConfig)
      mockServer = new ServerOIWebsocketMock(oiRecognizer.url)
      mockServer.init()
    })
    afterEach(async () =>
    {
      await oiRecognizer.destroy()
      mockServer.close()
    })

    test("should send export", async () =>
    {
      await oiRecognizer.init()
      const promise = oiRecognizer.export()
      //¯\_(ツ)_/¯  required to wait server received message
      await delay(100)
      const exportMessageSent = mockServer.getLastMessage()

      //¯\_(ツ)_/¯  required to wait server received message
      await delay(100)
      const exportmessageSentExpected = JSON.stringify({
        type: "export",
        partId: partChangeMessage.partId,
        mimeTypes: ["application/vnd.myscript.jiix"]
      })
      //¯\_(ツ)_/¯  required to wait for the instantiation of the promise of the recognizer
      await delay(100)
      mockServer.sendHExportMessage()
      expect(exportMessageSent).toContain(exportmessageSentExpected)
      await expect(promise).resolves.toEqual(
        expect.objectContaining({
          "application/vnd.myscript.jiix": hTextJIIX
        })
      )
      oiRecognizer.destroy()
    })
    test("should resolve when receive fileChunckAck message", async () =>
    {
      expect.assertions(1)

      await oiRecognizer.init()
      const promise = oiRecognizer.export()
      //¯\_(ツ)_/¯  required to wait for the instantiation of the promise of the recognizer
      await delay(100)
      mockServer.sendHExportMessage()
      await expect(promise).resolves.toEqual(
        expect.objectContaining({
          "application/vnd.myscript.jiix": hTextJIIX
        })
      )
      oiRecognizer.destroy()
    })
    test("should reject if receive error message", async () =>
    {
      const spyEmitError: jest.SpyInstance = jest.spyOn(oiRecognizer.event, "emitError")
      expect.assertions(3)
      await oiRecognizer.init()
      const promise = oiRecognizer.export()
      //¯\_(ツ)_/¯  required to wait for the instantiation of the promise of the recognizer
      await delay(100)
      mockServer.sendNotGrantedErrorMessage()
      await expect(promise).rejects.toEqual(RecognizerError.WRONG_CREDENTIALS)
      await expect(spyEmitError).toHaveBeenCalledTimes(1)
      await expect(spyEmitError).toHaveBeenCalledWith(new Error(RecognizerError.WRONG_CREDENTIALS))
    })
  })

  describe("Connection lost", () =>
  {
    const serverConfig: TServerConfiguration = {
      ...ServerConfig,
      host: "close-test"
    }
    let mockServer: ServerOIWebsocketMock
    let oiRecognizer: OIRecognizer

    beforeEach(() =>
    {
      oiRecognizer = new OIRecognizer(serverConfig, RecognitionConfig)
      mockServer = new ServerOIWebsocketMock(oiRecognizer.url)
      mockServer.init()
    })
    afterEach(async () =>
    {
      await oiRecognizer.destroy()
      mockServer.close()
    })

    const closeMessageOptions = [
      { code: 1001, message: RecognizerError.GOING_AWAY },
      { code: 1002, message: RecognizerError.PROTOCOL_ERROR },
      { code: 1003, message: RecognizerError.UNSUPPORTED_DATA },
      { code: 1006, message: RecognizerError.ABNORMAL_CLOSURE },
      { code: 1007, message: RecognizerError.INVALID_FRAME_PAYLOAD },
      { code: 1008, message: RecognizerError.POLICY_VIOLATION },
      { code: 1009, message: RecognizerError.MESSAGE_TOO_BIG },
      { code: 1011, message: RecognizerError.INTERNAL_ERROR },
      { code: 1012, message: RecognizerError.SERVICE_RESTART },
      { code: 1013, message: RecognizerError.TRY_AGAIN },
      { code: 1014, message: RecognizerError.BAD_GATEWAY },
      { code: 1015, message: RecognizerError.TLS_HANDSHAKE },
      { code: 42, message: RecognizerError.CANT_ESTABLISH },
    ]
    closeMessageOptions.forEach(async (closeEvent) =>
    {
      test(`should emit error if the server closes the connection abnormally code == ${ closeEvent.code }`, async () =>
      {
        const spyEmitError: jest.SpyInstance = jest.spyOn(oiRecognizer.event, "emitError")
        expect.assertions(2)
        await oiRecognizer.init()
        mockServer.close({ code: closeEvent.code, reason: closeEvent.message, wasClean: false })
        expect(spyEmitError).toHaveBeenCalledTimes(1)
        expect(spyEmitError).toHaveBeenCalledWith(new Error(closeEvent.message))
      })
    })
  })

  describe("destroy", () =>
  {
    const serverConfig = {
      ...ServerConfig,
      host: "destroy-test"
    } as TServerConfiguration
    let mockServer: ServerOIWebsocketMock

    test("should close socket", async () =>
    {
      const oiRecognizer = new OIRecognizer(serverConfig, RecognitionConfig)
      mockServer = new ServerOIWebsocketMock(oiRecognizer.url)
      mockServer.init()
      await oiRecognizer.init()

      // 1 -> OPEN
      await expect(mockServer.server.clients()[0].readyState).toEqual(1)
      oiRecognizer.destroy()
      // 2 -> CLOSING
      await expect(mockServer.server.clients()[0].readyState).toEqual(2)
      mockServer.close()
    })
  })

})
