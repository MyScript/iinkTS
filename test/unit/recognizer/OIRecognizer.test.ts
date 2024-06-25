import { OffScreenOverrideConfiguration } from "../__dataset__/configuration.dataset"
import { ServerOIWebsocketMock, hJIIX, partChangeMessage } from "../__mocks__/ServerOIWebsocketMock"
import { buildOIStroke, delay } from "../helpers"

import
{
  OIRecognizer,
  Error as ErrorConst,
  TServerConfiguration,
  TRecognitionConfiguration,
  TMatrixTransform,
  MatrixTransform,
  TOIActions,
  OIStroke,
} from "../../../src/iink"

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
    test("should reject if receive error message", async () =>
    {
      const spyEmitError: jest.SpyInstance = jest.spyOn(oiRecognizer.internalEvent, "emitError")
      expect.assertions(3)
      const promise = oiRecognizer.init()
      //¯\_(ツ)_/¯  required to wait for the instantiation of the promise of the recognizer
      await delay(100)
      mockServer.sendNotGrantedErrorMessage()
      await expect(promise).rejects.toEqual(ErrorConst.WRONG_CREDENTIALS)
      await expect(spyEmitError).toHaveBeenCalledTimes(2)
      await expect(spyEmitError).toHaveBeenCalledWith(new Error(ErrorConst.WRONG_CREDENTIALS))
    })
  })

  describe("Ping", () =>
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

    test("should throw error if recognizer has not been initialize", async () =>
    {
      expect.assertions(1)
      const testDataToSend = { type: "test", data: "test-data" }
      await expect(oiRecognizer.send(testDataToSend)).rejects.toEqual(new Error("Recognizer must be initilized"))
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
    //TODO fix test
    test.skip("should reconnect before send message", async () =>
    {
      expect.assertions(1)
      await oiRecognizer.init()
      await oiRecognizer.close(1000, "CLOSE_RECOGNIZER")
      const testDataToSend = { type: "test", data: "test-data" }
      await oiRecognizer.send(testDataToSend)
      //¯\_(ツ)_/¯  required to wait server received message
      await delay(100)
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

    test("should throw error if recognizer has not been initialize", async () =>
    {
      expect.assertions(1)
      await expect(oiRecognizer.addStrokes(strokes)).rejects.toEqual(new Error("Recognizer must be initilized"))
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
    test("should reject if receive error message", async () =>
    {
      const spyEmitError: jest.SpyInstance = jest.spyOn(oiRecognizer.internalEvent, "emitError")
      expect.assertions(3)
      await oiRecognizer.init()
      const promise = oiRecognizer.addStrokes(strokes)
      //¯\_(ツ)_/¯  required to wait for the instantiation of the promise of the recognizer
      await delay(100)
      mockServer.sendNotGrantedErrorMessage()
      await expect(promise).rejects.toEqual(ErrorConst.WRONG_CREDENTIALS)
      await expect(spyEmitError).toHaveBeenCalledTimes(1)
      await expect(spyEmitError).toHaveBeenCalledWith(new Error(ErrorConst.WRONG_CREDENTIALS))
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

    test("should throw error if recognizer has not been initialize", async () =>
    {
      expect.assertions(1)
      await expect(oiRecognizer.replaceStrokes(oldStrokeIds, strokes)).rejects.toEqual(new Error("Recognizer must be initilized"))
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
    test("should reject if receive error message", async () =>
    {
      const spyEmitError: jest.SpyInstance = jest.spyOn(oiRecognizer.internalEvent, "emitError")
      expect.assertions(3)
      await oiRecognizer.init()
      const promise = oiRecognizer.replaceStrokes(oldStrokeIds, strokes)
      //¯\_(ツ)_/¯  required to wait for the instantiation of the promise of the recognizer
      await delay(100)
      mockServer.sendNotGrantedErrorMessage()
      await expect(promise).rejects.toEqual(ErrorConst.WRONG_CREDENTIALS)
      await expect(spyEmitError).toHaveBeenCalledTimes(1)
      await expect(spyEmitError).toHaveBeenCalledWith(new Error(ErrorConst.WRONG_CREDENTIALS))
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

    test("should throw error if recognizer has not been initialize", async () =>
    {
      expect.assertions(1)
      await expect(oiRecognizer.transformTranslate(strokeIds, tx, ty)).rejects.toEqual(new Error("Recognizer must be initilized"))
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
    test("should reject if receive error message", async () =>
    {
      const spyEmitError: jest.SpyInstance = jest.spyOn(oiRecognizer.internalEvent, "emitError")
      expect.assertions(3)
      await oiRecognizer.init()
      const promise = oiRecognizer.transformTranslate(strokeIds, tx, ty)
      //¯\_(ツ)_/¯  required to wait for the instantiation of the promise of the recognizer
      await delay(100)
      mockServer.sendNotGrantedErrorMessage()
      await expect(promise).rejects.toEqual(ErrorConst.WRONG_CREDENTIALS)
      await expect(spyEmitError).toHaveBeenCalledTimes(1)
      await expect(spyEmitError).toHaveBeenCalledWith(new Error(ErrorConst.WRONG_CREDENTIALS))
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

    test("should throw error if recognizer has not been initialize", async () =>
    {
      expect.assertions(1)
      await expect(oiRecognizer.transformMatrix(strokeIds, matrix)).rejects.toEqual(new Error("Recognizer must be initilized"))
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
    test("should reject if receive error message", async () =>
    {
      const spyEmitError: jest.SpyInstance = jest.spyOn(oiRecognizer.internalEvent, "emitError")
      expect.assertions(3)
      await oiRecognizer.init()
      const promise = oiRecognizer.transformMatrix(strokeIds, matrix)
      //¯\_(ツ)_/¯  required to wait for the instantiation of the promise of the recognizer
      await delay(100)
      mockServer.sendNotGrantedErrorMessage()
      await expect(promise).rejects.toEqual(ErrorConst.WRONG_CREDENTIALS)
      await expect(spyEmitError).toHaveBeenCalledTimes(1)
      await expect(spyEmitError).toHaveBeenCalledWith(new Error(ErrorConst.WRONG_CREDENTIALS))
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

    test("should throw error if recognizer has not been initialize", async () =>
    {
      expect.assertions(1)
      await expect(oiRecognizer.eraseStrokes(strokeIds)).rejects.toEqual(new Error("Recognizer must be initilized"))
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
    test("should reject if receive error message", async () =>
    {
      const spyEmitError: jest.SpyInstance = jest.spyOn(oiRecognizer.internalEvent, "emitError")
      expect.assertions(3)
      await oiRecognizer.init()
      const promise = oiRecognizer.eraseStrokes(strokeIds)
      //¯\_(ツ)_/¯  required to wait for the instantiation of the promise of the recognizer
      await delay(100)
      mockServer.sendNotGrantedErrorMessage()
      await expect(promise).rejects.toEqual(ErrorConst.WRONG_CREDENTIALS)
      await expect(spyEmitError).toHaveBeenCalledTimes(1)
      await expect(spyEmitError).toHaveBeenCalledWith(new Error(ErrorConst.WRONG_CREDENTIALS))
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
      mockServer.init()
    })
    afterEach(async () =>
    {
      await oiRecognizer.destroy()
      mockServer.close()
    })

    test("should throw error if recognizer has not been initialize", async () =>
    {
      expect.assertions(1)
      await expect(oiRecognizer.export()).rejects.toEqual(new Error("Recognizer must be initilized"))
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
      const spyEmitError: jest.SpyInstance = jest.spyOn(oiRecognizer.internalEvent, "emitError")
      expect.assertions(3)
      await oiRecognizer.init()
      const promise = oiRecognizer.waitForIdle()
      //¯\_(ツ)_/¯  required to wait for the instantiation of the promise of the recognizer
      await delay(100)
      mockServer.sendNotGrantedErrorMessage()
      await expect(promise).rejects.toEqual(ErrorConst.WRONG_CREDENTIALS)
      await expect(spyEmitError).toHaveBeenCalledTimes(1)
      await expect(spyEmitError).toHaveBeenCalledWith(new Error(ErrorConst.WRONG_CREDENTIALS))
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

    test("should throw error if recognizer has not been initialize", async () =>
    {
      expect.assertions(1)
      await expect(oiRecognizer.undo({})).rejects.toEqual(new Error("Recognizer must be initilized"))
    })
    test("should send undo message", async () =>
    {
      expect.assertions(1)
      await oiRecognizer.init()
      oiRecognizer.undo({})
      //¯\_(ツ)_/¯  required to wait for the instantiation of the promise of the recognizer
      await delay(100)
      const messageSent = JSON.parse(mockServer.getLastMessage() as string)
      const messageSentExpected = { type: "undo" }
      expect(messageSent).toMatchObject(messageSentExpected)
    })
    test("should send undo message with changes added", async () =>
    {
      expect.assertions(1)
      await oiRecognizer.init()
      const actions: TOIActions = { added: [buildOIStroke()] }
      oiRecognizer.undo(actions)
      //¯\_(ツ)_/¯  required to wait for the instantiation of the promise of the recognizer
      await delay(100)
      const messageSent = JSON.parse(mockServer.getLastMessage() as string)
      const messageSentExpected = { type: "undo", changes: [{ type: "addStrokes", strokes: [(actions.added![0] as OIStroke).formatToSend()] }] }
      await expect(messageSent).toMatchObject(messageSentExpected)
    })
    test("should reject if receive error message", async () =>
    {
      const spyEmitError: jest.SpyInstance = jest.spyOn(oiRecognizer.internalEvent, "emitError")
      expect.assertions(3)
      await oiRecognizer.init()
      const promise = oiRecognizer.undo({})
      //¯\_(ツ)_/¯  required to wait for the instantiation of the promise of the recognizer
      await delay(100)
      mockServer.sendNotGrantedErrorMessage()
      await expect(promise).rejects.toEqual(ErrorConst.WRONG_CREDENTIALS)
      expect(spyEmitError).toHaveBeenCalledTimes(1)
      expect(spyEmitError).toHaveBeenCalledWith(new Error(ErrorConst.WRONG_CREDENTIALS))
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

    test("should throw error if recognizer has not been initialize", async () =>
    {
      expect.assertions(1)
      await expect(oiRecognizer.redo({})).rejects.toEqual(new Error("Recognizer must be initilized"))
    })
    test("should send redo message", async () =>
    {
      expect.assertions(1)
      await oiRecognizer.init()
      oiRecognizer.redo({})
      //¯\_(ツ)_/¯  required to wait for the instantiation of the promise of the recognizer
      await delay(100)
      const messageSent = JSON.parse(mockServer.getLastMessage() as string)
      const messageSentExpected = { type: "redo" }
      await expect(messageSent).toMatchObject(messageSentExpected)
    })
    test("should reject if receive error message", async () =>
    {
      const spyEmitError: jest.SpyInstance = jest.spyOn(oiRecognizer.internalEvent, "emitError")
      expect.assertions(3)
      await oiRecognizer.init()
      const promise = oiRecognizer.redo({})
      //¯\_(ツ)_/¯  required to wait for the instantiation of the promise of the recognizer
      await delay(100)
      mockServer.sendNotGrantedErrorMessage()
      await expect(promise).rejects.toEqual(ErrorConst.WRONG_CREDENTIALS)
      await expect(spyEmitError).toHaveBeenCalledTimes(1)
      await expect(spyEmitError).toHaveBeenCalledWith(new Error(ErrorConst.WRONG_CREDENTIALS))
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

    test("should throw error if recognizer has not been initialize", async () =>
    {
      expect.assertions(1)
      await expect(oiRecognizer.clear()).rejects.toEqual(new Error("Recognizer must be initilized"))
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
    test("should reject if receive error message", async () =>
    {
      const spyEmitError: jest.SpyInstance = jest.spyOn(oiRecognizer.internalEvent, "emitError")
      expect.assertions(3)
      await oiRecognizer.init()
      const promise = oiRecognizer.clear()
      //¯\_(ツ)_/¯  required to wait for the instantiation of the promise of the recognizer
      await delay(100)
      mockServer.sendNotGrantedErrorMessage()
      await expect(promise).rejects.toEqual(ErrorConst.WRONG_CREDENTIALS)
      await expect(spyEmitError).toHaveBeenCalledTimes(1)
      await expect(spyEmitError).toHaveBeenCalledWith(new Error(ErrorConst.WRONG_CREDENTIALS))
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

    test("should throw error if recognizer has not been initialize", async () =>
    {
      expect.assertions(1)
      await expect(oiRecognizer.export()).rejects.toEqual(new Error("Recognizer must be initilized"))
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
          "application/vnd.myscript.jiix": hJIIX
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
          "application/vnd.myscript.jiix": hJIIX
        })
      )
      oiRecognizer.destroy()
    })
    test("should reject if receive error message", async () =>
    {
      const spyEmitError: jest.SpyInstance = jest.spyOn(oiRecognizer.internalEvent, "emitError")
      expect.assertions(3)
      await oiRecognizer.init()
      const promise = oiRecognizer.export()
      //¯\_(ツ)_/¯  required to wait for the instantiation of the promise of the recognizer
      await delay(100)
      mockServer.sendNotGrantedErrorMessage()
      await expect(promise).rejects.toEqual(ErrorConst.WRONG_CREDENTIALS)
      await expect(spyEmitError).toHaveBeenCalledTimes(1)
      await expect(spyEmitError).toHaveBeenCalledWith(new Error(ErrorConst.WRONG_CREDENTIALS))
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
    closeMessageOptions.forEach(async (closeEvent) =>
    {
      test(`should emit error if the server closes the connection abnormally code == ${ closeEvent.code }`, async () =>
      {
        const spyEmitError: jest.SpyInstance = jest.spyOn(oiRecognizer.internalEvent, "emitError")
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
