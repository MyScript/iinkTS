import Server from "jest-websocket-mock"
import { DeserializedMessage } from "jest-websocket-mock/lib/websocket"
import { buildOIStroke, delay } from "../helpers"

import {
  OIRecognizer,
  DefaultRecognitionConfiguration,
  DefaultServerConfiguration,
  Error as ErrorConst,
  TOIMessageEvent,
  TServerConfiguration,
  TRecognitionConfiguration,
  TMatrixTransform,
  MatrixTransform,
 } from "../../../src/iink"


const ackMessage = { "type": "ack", "hmacChallenge": "1f434e8b-cc46-4a8c-be76-708eea2ff305", "iinkSessionId": "c7e72186-6299-4782-b612-3e725aa126f1" }
const contentPackageDescriptionMessage = { "type": "contentPackageDescription", "contentPartCount": 0 }
const partChangeMessage = { "type": "partChanged", "partIdx": 0, "partId": "yyrrutgk", "partCount": 1 }
const newPartMessage = { "type": "newPart", "idx": 0, "id": "lqrcoxjl" }
const contentChangeMessage = { "type": "contentChanged", "partId": "mknnilfn", "canUndo": null, "canRedo": null, "empty": null, "undoStackIndex": 0, "possibleUndoCount": 0 }

const hJIIX = {
  "type": "Text",
  "label": "hello",
  "words": [{
    "label": "H",
    "candidates": ["h"]
  }]
}
const hExportedMessage = {
  "type": "exported",
  "partid": 0,
  "exports": {
    "application/vnd.myscript.jiix": JSON.stringify(hJIIX)
  }
}
const errorMessage = { "type": "error", "message": "Access not granted", "code": "access.not.granted" }

const getMessages = (messages: DeserializedMessage<object>[], type: string): DeserializedMessage<object>[] =>
{
  return messages.filter((m: DeserializedMessage<object>) =>
  {
    const parseMessage = JSON.parse(m as string) as TOIMessageEvent
    return parseMessage.type === type
  })
}

describe("OIRecognizer.ts", () =>
{
  let mockServer: Server
  beforeEach(() =>
  {
    mockServer = new Server(`wss://${ DefaultServerConfiguration.host }/api/v4.0/iink/offscreen`, {})

    mockServer.on("connection", (socket) =>
    {
      socket.on("message", (message: string | Blob | ArrayBuffer | ArrayBufferView) =>
      {
        const parsedMessage: TOIMessageEvent = JSON.parse(message as string)
        switch (parsedMessage.type) {
          case "newContentPackage":
            socket.send(JSON.stringify(ackMessage))
            break
          case "hmac":
            socket.send(JSON.stringify(contentPackageDescriptionMessage))
            break
          case "configuration":
            socket.send(JSON.stringify(partChangeMessage))
            break
          case "newContentPart":
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

  test("should instanciate OIRecognizer", () =>
  {
    const wsr = new OIRecognizer(DefaultServerConfiguration, DefaultRecognitionConfiguration)
    expect(wsr).toBeDefined()
  })

  describe("Properties", () =>
  {
    test("should get url", () =>
    {
      const serverConfig = {
        ...DefaultServerConfiguration,
        scheme: "http",
        host: "pony",
        applicationKey: "applicationKey"
      } as TServerConfiguration
      const wsr = new OIRecognizer(serverConfig, DefaultRecognitionConfiguration)
      expect(wsr.url).toEqual("ws://pony/api/v4.0/iink/offscreen?applicationKey=applicationKey")
    })

    test(`should get mimeTypes`, () =>
    {
      const wsr = new OIRecognizer(DefaultServerConfiguration, DefaultRecognitionConfiguration)
      expect(wsr.mimeTypes).toEqual(["application/vnd.myscript.jiix"])
    })
  })

  describe("init", () =>
  {
    const serverConfigToInitTest: TServerConfiguration = {
      ...DefaultServerConfiguration,
      host: "init-test"
    }
    let addStroMockServerForInitTest: Server
    let wsr: OIRecognizer
    let spyEmitError: jest.SpyInstance

    beforeEach(() =>
    {
      addStroMockServerForInitTest = new Server(`wss://${ serverConfigToInitTest.host }/api/v4.0/iink/offscreen`, {})
      wsr = new OIRecognizer(serverConfigToInitTest, DefaultRecognitionConfiguration)
      spyEmitError = jest.spyOn(wsr.internalEvent, "emitError")
      spyEmitError.mockResolvedValue(() => Promise.resolve())
    })
    afterEach(async () =>
    {
      await wsr.destroy()
      addStroMockServerForInitTest.close()
    })
    test("should have dialog sequence", async () =>
    {
      expect(getMessages(addStroMockServerForInitTest.messages, "newContentPackage")).toHaveLength(0)
      const promise = wsr.init()
      //¯\_(ツ)_/¯  required to wait server received message
      await delay(100)
      expect(getMessages(addStroMockServerForInitTest.messages, "newContentPackage")).toHaveLength(1)

      expect(getMessages(addStroMockServerForInitTest.messages, "hmac")).toHaveLength(0)
      addStroMockServerForInitTest.send(JSON.stringify(ackMessage))
      //¯\_(ツ)_/¯  required to wait server received message
      await delay(100)
      expect(getMessages(addStroMockServerForInitTest.messages, "hmac")).toHaveLength(1)

      expect(getMessages(addStroMockServerForInitTest.messages, "configuration")).toHaveLength(0)
      expect(getMessages(addStroMockServerForInitTest.messages, "newContentPart")).toHaveLength(0)
      addStroMockServerForInitTest.send(JSON.stringify(contentPackageDescriptionMessage))
      //¯\_(ツ)_/¯  required to wait server received message
      await delay(100)
      expect(getMessages(addStroMockServerForInitTest.messages, "configuration")).toHaveLength(1)
      expect(getMessages(addStroMockServerForInitTest.messages, "newContentPart")).toHaveLength(1)

      addStroMockServerForInitTest.send(JSON.stringify(newPartMessage))
      await promise
      expect(1).toEqual(1)
    })
    test("should reject if receive error message", async () =>
    {
      expect.assertions(3)
      const promise = wsr.init()
      //¯\_(ツ)_/¯  required to wait for the instantiation of the promise of the recognizer
      await delay(100)
      addStroMockServerForInitTest.send(JSON.stringify(errorMessage))
      await expect(promise).rejects.toEqual(ErrorConst.WRONG_CREDENTIALS)
      await expect(spyEmitError).toHaveBeenCalledTimes(2)
      await expect(spyEmitError).toHaveBeenCalledWith(new Error(ErrorConst.WRONG_CREDENTIALS))
    })
  })

  describe("Ping", () =>
  {
    test("should send ping message", async () =>
    {
      expect.assertions(2)
      const conf = JSON.parse(JSON.stringify(DefaultServerConfiguration)) as TServerConfiguration
      conf.websocket.pingDelay = 200
      const wsr = new OIRecognizer(conf, DefaultRecognitionConfiguration)
      await wsr.init()
      await delay(conf.websocket.pingDelay)
      await delay(100)
      expect(getMessages(mockServer.messages, "ping")).toHaveLength(1)
      await delay(conf.websocket.pingDelay)
      expect(getMessages(mockServer.messages, "ping")).toHaveLength(2)
    })
    test("should not send ping message", async () =>
    {
      expect.assertions(2)
      const conf = JSON.parse(JSON.stringify(DefaultServerConfiguration)) as TServerConfiguration
      conf.websocket.pingDelay = 200
      conf.websocket.pingEnabled = false
      const wsr = new OIRecognizer(conf, DefaultRecognitionConfiguration)
      await wsr.init()
      await delay(conf.websocket.pingDelay)
      await delay(100)
      expect(getMessages(mockServer.messages, "ping")).toHaveLength(0)
      await delay(conf.websocket.pingDelay)
      expect(getMessages(mockServer.messages, "ping")).toHaveLength(0)
    })
  })

  describe("send", () =>
  {
    let wsr: OIRecognizer
    beforeEach(async () =>
    {
      wsr = new OIRecognizer(DefaultServerConfiguration, DefaultRecognitionConfiguration)
    })
    afterEach(async () =>
    {
      await wsr.destroy()
    })
    test("should throw error if recognizer has not been initialize", async () =>
    {
      expect.assertions(1)
      const testDataToSend = { type: "test", data: "test-data" }
      await expect(wsr.send(testDataToSend)).rejects.toEqual(new Error("Recognizer must be initilized"))
    })
    test("should send message", async () =>
    {
      expect.assertions(1)
      await wsr.init()
      const testDataToSend = { type: "test", data: "test-data" }
      await wsr.send(testDataToSend)
      //¯\_(ツ)_/¯  required to wait server received message
      await delay(100)
      const messageSent = JSON.parse(mockServer.messages[mockServer.messages.length - 1] as string)
      expect(messageSent).toEqual(testDataToSend)
    })
    //TODO fix test
    test.skip("should reconnect before send message", async () =>
    {
      expect.assertions(1)
      await wsr.init()
      await wsr.close(1000, "CLOSE_RECOGNIZER")
      const testDataToSend = { type: "test", data: "test-data" }
      await wsr.send(testDataToSend)
      //¯\_(ツ)_/¯  required to wait server received message
      await delay(100)
      const messageSent = JSON.parse(mockServer.messages[mockServer.messages.length - 1] as string)
      expect(messageSent).toEqual(testDataToSend)
    })
  })

  describe("addStrokes", () =>
  {
    const strokes = [buildOIStroke()]
    let wsr: OIRecognizer
    let spyEmitError: jest.SpyInstance
    beforeEach(async () =>
    {
      wsr = new OIRecognizer(DefaultServerConfiguration, DefaultRecognitionConfiguration)
      spyEmitError = jest.spyOn(wsr.internalEvent, "emitError")
    })
    afterEach(async () =>
    {
      await wsr.destroy()
    })
    test("should throw error if recognizer has not been initialize", async () =>
    {
      expect.assertions(1)
      await expect(wsr.addStrokes(strokes)).rejects.toEqual(new Error("Recognizer must be initilized"))
    })
    test("should not send addStrokes message if 0 strokes", async () =>
    {
      expect.assertions(1)
      await wsr.init()
      await wsr.addStrokes([])
      //¯\_(ツ)_/¯  required to wait server received message
      await delay(100)
      const messageSent = JSON.parse(mockServer.messages[mockServer.messages.length - 1] as string)
      await expect(messageSent.type).not.toEqual("addStrokes")
    })
    test("should send addStrokes message & resolve when receive contentChanged message", async () =>
    {
      expect.assertions(1)
      await wsr.init()
      const promise = wsr.addStrokes(strokes)
      //¯\_(ツ)_/¯  required to wait for the instantiation of the promise of the recognizer
      await delay(100)
      mockServer.send(JSON.stringify(contentChangeMessage))
      await promise
      const messageSent = JSON.parse(mockServer.messages[mockServer.messages.length - 1] as string)
      const messageSentExpected = {
        type: "addStrokes",
        strokes: strokes.map(s => s.formatToSend())
      }
      await expect(messageSent).toMatchObject(messageSentExpected)
    })
    test("should reject if receive error message", async () =>
    {
      expect.assertions(3)
      await wsr.init()
      const promise = wsr.addStrokes(strokes)
      //¯\_(ツ)_/¯  required to wait for the instantiation of the promise of the recognizer
      await delay(100)
      mockServer.send(JSON.stringify(errorMessage))
      await expect(promise).rejects.toEqual(ErrorConst.WRONG_CREDENTIALS)
      await expect(spyEmitError).toHaveBeenCalledTimes(1)
      await expect(spyEmitError).toHaveBeenCalledWith(new Error(ErrorConst.WRONG_CREDENTIALS))
    })
  })

  describe("replaceStrokes", () =>
  {
    const strokes = [buildOIStroke()]
    const oldStrokeIds = ["id-1", "id-2"]
    let wsr: OIRecognizer
    let spyEmitError: jest.SpyInstance
    beforeEach(async () =>
    {
      wsr = new OIRecognizer(DefaultServerConfiguration, DefaultRecognitionConfiguration)
      spyEmitError = jest.spyOn(wsr.internalEvent, "emitError")
    })
    afterEach(async () =>
    {
      await wsr.destroy()
    })
    test("should throw error if recognizer has not been initialize", async () =>
    {
      expect.assertions(1)
      await expect(wsr.replaceStrokes(oldStrokeIds, strokes)).rejects.toEqual(new Error("Recognizer must be initilized"))
    })
    test("should not send replaceStrokes message if 0 strokes", async () =>
    {
      expect.assertions(1)
      await wsr.init()
      await wsr.replaceStrokes([], [])
      //¯\_(ツ)_/¯  required to wait server received message
      await delay(100)
      const messageSent = JSON.parse(mockServer.messages[mockServer.messages.length - 1] as string)
      await expect(messageSent.type).not.toEqual("replaceStrokes")
    })
    test("should send replaceStrokes message & resolve when receive contentChanged message", async () =>
    {
      expect.assertions(1)
      await wsr.init()
      const promise = wsr.replaceStrokes(oldStrokeIds, strokes)
      //¯\_(ツ)_/¯  required to wait for the instantiation of the promise of the recognizer
      await delay(100)
      mockServer.send(JSON.stringify(contentChangeMessage))
      await promise
      const messageSent = JSON.parse(mockServer.messages[mockServer.messages.length - 1] as string)
      const messageSentExpected = {
        type: "replaceStrokes",
        oldStrokeIds,
      }
      await expect(messageSent).toMatchObject(messageSentExpected)
    })
    test("should reject if receive error message", async () =>
    {
      expect.assertions(3)
      await wsr.init()
      const promise = wsr.replaceStrokes(oldStrokeIds, strokes)
      //¯\_(ツ)_/¯  required to wait for the instantiation of the promise of the recognizer
      await delay(100)
      mockServer.send(JSON.stringify(errorMessage))
      await expect(promise).rejects.toEqual(ErrorConst.WRONG_CREDENTIALS)
      await expect(spyEmitError).toHaveBeenCalledTimes(1)
      await expect(spyEmitError).toHaveBeenCalledWith(new Error(ErrorConst.WRONG_CREDENTIALS))
    })
  })

  describe("translateStrokes", () =>
  {
    const strokeIds = ["id-1", "id-2"]
    const tx = 5, ty = 10
    let wsr: OIRecognizer
    let spyEmitError: jest.SpyInstance
    beforeEach(async () =>
    {
      wsr = new OIRecognizer(DefaultServerConfiguration, DefaultRecognitionConfiguration)
      spyEmitError = jest.spyOn(wsr.internalEvent, "emitError")
    })
    afterEach(async () =>
    {
      await wsr.destroy()
    })
    test("should throw error if recognizer has not been initialize", async () =>
    {
      expect.assertions(1)
      await expect(wsr.translateStrokes(strokeIds, tx, ty)).rejects.toEqual(new Error("Recognizer must be initilized"))
    })
    test("should not send translateStrokes message if 0 strokes", async () =>
    {
      expect.assertions(1)
      await wsr.init()
      await wsr.translateStrokes([], tx, ty)
      //¯\_(ツ)_/¯  required to wait server received message
      await delay(100)
      const messageSent = JSON.parse(mockServer.messages[mockServer.messages.length - 1] as string)
      await expect(messageSent.type).not.toEqual("translateStrokes")
    })
    test("should send translateStrokes message & resolve when receive contentChanged message", async () =>
    {
      expect.assertions(1)
      await wsr.init()
      const promise = wsr.translateStrokes(strokeIds, tx, ty)
      //¯\_(ツ)_/¯  required to wait for the instantiation of the promise of the recognizer
      await delay(100)
      mockServer.send(JSON.stringify(contentChangeMessage))
      await promise
      const messageSent = JSON.parse(mockServer.messages[mockServer.messages.length - 1] as string)
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
      expect.assertions(3)
      await wsr.init()
      const promise = wsr.translateStrokes(strokeIds, tx, ty)
      //¯\_(ツ)_/¯  required to wait for the instantiation of the promise of the recognizer
      await delay(100)
      mockServer.send(JSON.stringify(errorMessage))
      await expect(promise).rejects.toEqual(ErrorConst.WRONG_CREDENTIALS)
      await expect(spyEmitError).toHaveBeenCalledTimes(1)
      await expect(spyEmitError).toHaveBeenCalledWith(new Error(ErrorConst.WRONG_CREDENTIALS))
    })
  })

  describe("transformStrokes", () =>
  {
    const strokeIds = ["id-1", "id-2"]
    const matrix: TMatrixTransform = new MatrixTransform(6, 5, 4, 3, 2, 1)
    let wsr: OIRecognizer
    let spyEmitError: jest.SpyInstance
    beforeEach(async () =>
    {
      wsr = new OIRecognizer(DefaultServerConfiguration, DefaultRecognitionConfiguration)
      spyEmitError = jest.spyOn(wsr.internalEvent, "emitError")
    })
    afterEach(async () =>
    {
      await wsr.destroy()
    })
    test("should throw error if recognizer has not been initialize", async () =>
    {
      expect.assertions(1)
      await expect(wsr.transformStrokes(strokeIds, matrix)).rejects.toEqual(new Error("Recognizer must be initilized"))
    })
    test("should not send transformStrokes message if 0 strokes", async () =>
    {
      expect.assertions(1)
      await wsr.init()
      await wsr.transformStrokes([], matrix)
      //¯\_(ツ)_/¯  required to wait server received message
      await delay(100)
      const messageSent = JSON.parse(mockServer.messages[mockServer.messages.length - 1] as string)
      await expect(messageSent.type).not.toEqual("transformStrokes")
    })
    test("should send transformStrokes message & resolve when receive contentChanged message", async () =>
    {
      expect.assertions(1)
      await wsr.init()
      const promise = wsr.transformStrokes(strokeIds, matrix)
      //¯\_(ツ)_/¯  required to wait for the instantiation of the promise of the recognizer
      await delay(100)
      mockServer.send(JSON.stringify(contentChangeMessage))
      await promise
      const messageSent = JSON.parse(mockServer.messages[mockServer.messages.length - 1] as string)
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
      expect.assertions(3)
      await wsr.init()
      const promise = wsr.transformStrokes(strokeIds, matrix)
      //¯\_(ツ)_/¯  required to wait for the instantiation of the promise of the recognizer
      await delay(100)
      mockServer.send(JSON.stringify(errorMessage))
      await expect(promise).rejects.toEqual(ErrorConst.WRONG_CREDENTIALS)
      await expect(spyEmitError).toHaveBeenCalledTimes(1)
      await expect(spyEmitError).toHaveBeenCalledWith(new Error(ErrorConst.WRONG_CREDENTIALS))
    })
  })

  describe("eraseStrokes", () =>
  {
    const strokeIds = ["erase-1"]
    let wsr: OIRecognizer
    let spyEmitError: jest.SpyInstance
    beforeEach(async () =>
    {
      wsr = new OIRecognizer(DefaultServerConfiguration, DefaultRecognitionConfiguration)
      spyEmitError = jest.spyOn(wsr.internalEvent, "emitError")
    })
    afterEach(async () =>
    {
      await wsr.destroy()
    })
    test("should throw error if recognizer has not been initialize", async () =>
    {
      expect.assertions(1)
      await expect(wsr.eraseStrokes(strokeIds)).rejects.toEqual(new Error("Recognizer must be initilized"))
    })
    test("should not send eraseStrokes message if 0 strokes", async () =>
    {
      expect.assertions(1)
      await wsr.init()
      await wsr.eraseStrokes([])
      //¯\_(ツ)_/¯  required to wait server received message
      await delay(100)
      const messageSent = JSON.parse(mockServer.messages[mockServer.messages.length - 1] as string)
      await expect(messageSent.type).not.toEqual("eraseStrokes")
    })
    test("should send eraseStrokes message & resolve when receive contentChanged message", async () =>
    {
      expect.assertions(1)
      await wsr.init()
      const promise = wsr.eraseStrokes(strokeIds)
      //¯\_(ツ)_/¯  required to wait for the instantiation of the promise of the recognizer
      await delay(100)
      mockServer.send(JSON.stringify(contentChangeMessage))
      await promise
      const messageSent = JSON.parse(mockServer.messages[mockServer.messages.length - 1] as string)
      const messageSentExpected = {
        type: "eraseStrokes",
        strokeIds
      }
      await expect(messageSent).toMatchObject(messageSentExpected)
    })
    test("should reject if receive error message", async () =>
    {
      expect.assertions(3)
      await wsr.init()
      const promise = wsr.eraseStrokes(strokeIds)
      //¯\_(ツ)_/¯  required to wait for the instantiation of the promise of the recognizer
      await delay(100)
      mockServer.send(JSON.stringify(errorMessage))
      await expect(promise).rejects.toEqual(ErrorConst.WRONG_CREDENTIALS)
      await expect(spyEmitError).toHaveBeenCalledTimes(1)
      await expect(spyEmitError).toHaveBeenCalledWith(new Error(ErrorConst.WRONG_CREDENTIALS))
    })
  })

  describe("waitForIdle", () =>
  {
    let wsr: OIRecognizer
    let spyEmitError: jest.SpyInstance
    beforeEach(async () =>
    {
      wsr = new OIRecognizer(DefaultServerConfiguration, DefaultRecognitionConfiguration)
      spyEmitError = jest.spyOn(wsr.internalEvent, "emitError")
    })
    afterEach(async () =>
    {
      await wsr.destroy()
    })
    test("should throw error if recognizer has not been initialize", async () =>
    {
      expect.assertions(1)
      await expect(wsr.export()).rejects.toEqual(new Error("Recognizer must be initilized"))
    })
    test("should send waitForIdle & resolve when receive idle message", async () =>
    {
      expect.assertions(2)
      await wsr.init()
      const promise = wsr.waitForIdle()
      //¯\_(ツ)_/¯  required to wait server received message
      await delay(100)
      const wfiMessageSent = mockServer.messages[mockServer.messages.length - 1]
      expect(wfiMessageSent).toEqual(JSON.stringify({ type: "waitForIdle" }))
      //¯\_(ツ)_/¯  required to wait for the instantiation of the promise of the recognizer
      await delay(100)
      mockServer.send(JSON.stringify({ type: "idle" }))
      await delay(100)
      await expect(promise).resolves.toBeUndefined()
    })
    test("should reject if receive error message", async () =>
    {
      expect.assertions(3)
      await wsr.init()
      const promise = wsr.waitForIdle()
      //¯\_(ツ)_/¯  required to wait for the instantiation of the promise of the recognizer
      await delay(100)
      mockServer.send(JSON.stringify(errorMessage))
      await expect(promise).rejects.toEqual(ErrorConst.WRONG_CREDENTIALS)
      await expect(spyEmitError).toHaveBeenCalledTimes(1)
      await expect(spyEmitError).toHaveBeenCalledWith(new Error(ErrorConst.WRONG_CREDENTIALS))
    })
  })

  describe("export", () =>
  {
    let wsr: OIRecognizer
    let spyEmitError: jest.SpyInstance
    beforeEach(async () =>
    {
      wsr = new OIRecognizer(DefaultServerConfiguration, DefaultRecognitionConfiguration)
      spyEmitError = jest.spyOn(wsr.internalEvent, "emitError")
    })
    afterEach(async () =>
    {
      await wsr.destroy()
    })
    test("should throw error if recognizer has not been initialize", async () =>
    {
      expect.assertions(1)
      await expect(wsr.export()).rejects.toEqual(new Error("Recognizer must be initilized"))
    })
    test("should send export", async () =>
    {
      const recognitionConfig: TRecognitionConfiguration = {
        ...DefaultRecognitionConfiguration,
        type: "Raw Content"
      }
      const my_wsr = new OIRecognizer(DefaultServerConfiguration, recognitionConfig)
      await my_wsr.init()
      const promise = my_wsr.export()
      //¯\_(ツ)_/¯  required to wait server received message
      await delay(100)
      const exportMessageSent = mockServer.messages[mockServer.messages.length - 1]

      //¯\_(ツ)_/¯  required to wait server received message
      await delay(100)
      const exportmessageSentExpected = JSON.stringify({
        type: "export",
        partId: partChangeMessage.partId,
        mimeTypes: ["application/vnd.myscript.jiix"]
      })
      //¯\_(ツ)_/¯  required to wait for the instantiation of the promise of the recognizer
      await delay(100)
      mockServer.send(JSON.stringify(hExportedMessage))
      expect(exportMessageSent).toContain(exportmessageSentExpected)
      await expect(promise).resolves.toEqual(
        expect.objectContaining({
          "application/vnd.myscript.jiix": hJIIX
        })
      )
    })
    test("should resolve when receive fileChunckAck message", async () =>
    {
      expect.assertions(1)
      await wsr.init()
      const promise = wsr.export()
      //¯\_(ツ)_/¯  required to wait for the instantiation of the promise of the recognizer
      await delay(100)
      mockServer.send(JSON.stringify(hExportedMessage))
      await expect(promise).resolves.toEqual(
        expect.objectContaining({
          "application/vnd.myscript.jiix": hJIIX
        })
      )
    })
    test("should reject if receive error message", async () =>
    {
      expect.assertions(3)
      await wsr.init()
      const promise = wsr.export()
      //¯\_(ツ)_/¯  required to wait for the instantiation of the promise of the recognizer
      await delay(100)
      mockServer.send(JSON.stringify(errorMessage))
      await expect(promise).rejects.toEqual(ErrorConst.WRONG_CREDENTIALS)
      await expect(spyEmitError).toHaveBeenCalledTimes(1)
      await expect(spyEmitError).toHaveBeenCalledWith(new Error(ErrorConst.WRONG_CREDENTIALS))
    })
  })

  describe("Connection lost", () =>
  {
    const serverConfigToCloseTest: TServerConfiguration = {
      ...DefaultServerConfiguration,
      host: "close-test"
    }
    let mockServerForCloseTest: Server
    let wsr: OIRecognizer
    let spyEmitError: jest.SpyInstance
    beforeEach(() =>
    {
      mockServerForCloseTest = new Server(`wss://${ serverConfigToCloseTest.host }/api/v4.0/iink/offscreen`, {})
      mockServerForCloseTest.on("connection", (socket) =>
      {
        socket.on("message", (message: string | Blob | ArrayBuffer | ArrayBufferView) =>
        {
          const parsedMessage: TOIMessageEvent = JSON.parse(message as string)
          switch (parsedMessage.type) {
            case "newContentPackage":
              socket.send(JSON.stringify(ackMessage))
              break
            case "hmac":
              socket.send(JSON.stringify(contentPackageDescriptionMessage))
              break
            case "configuration":
              socket.send(JSON.stringify(partChangeMessage))
              break
            case "newContentPart":
              socket.send(JSON.stringify(newPartMessage))
              break
            default:
              break
          }
        })
      })
      wsr = new OIRecognizer(serverConfigToCloseTest, DefaultRecognitionConfiguration)
      spyEmitError = jest.spyOn(wsr.internalEvent, "emitError")
    })
    afterEach(async () =>
    {
      spyEmitError.mockReset()
      await wsr.destroy()
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
        expect.assertions(2)
        await wsr.init()
        mockServerForCloseTest.server.close({ code: closeEvent.code, reason: closeEvent.message, wasClean: false })
        expect(spyEmitError).toHaveBeenCalledTimes(1)
        expect(spyEmitError).toHaveBeenCalledWith(new Error(closeEvent.message))
      })
    })
  })

  describe("destroy", () =>
  {
    test("should close socket", async () =>
    {
      const wsr = new OIRecognizer(DefaultServerConfiguration, DefaultRecognitionConfiguration)
      await wsr.init()
      await expect(mockServer.server.clients()).toHaveLength(1)
      await wsr.destroy()
      await expect(mockServer.server.clients()).toHaveLength(0)
    })
  })
})
