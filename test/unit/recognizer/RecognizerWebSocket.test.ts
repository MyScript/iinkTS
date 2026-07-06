import { InteractiveInkEditorOverrideConfiguration } from "../__dataset__/configuration.dataset"
import {
  ServerWebSocketMock,
  contextlessGestureMessage,
  gestureDetectedMessage,
  hTextJIIX,
  partChangeMessage,
} from "../__mocks__/ServerWebSocketMock"
import { buildIIStroke, delay } from "../helpers"
import {
  RecognizerWebSocket,
  RecognizerError,
  StrokeOps,
  TMatrixTransform,
  MatrixTransform,
  TIIHistoryBackendChanges,
  TRecognizerWebSocketConfiguration,
} from "@/iink"

import { toResolve } from "jest-extended"
expect.extend({ toResolve })

describe("RecognizerWebSocket.ts", () => {
  const configuration: TRecognizerWebSocketConfiguration = {
    recognition: InteractiveInkEditorOverrideConfiguration.recognition,
    server: InteractiveInkEditorOverrideConfiguration.server,
  }

  test("should instanciate RecognizerWebSocket", () => {
    const oiRecognizer = new RecognizerWebSocket(configuration)
    expect(oiRecognizer).toBeDefined()
  })

  describe("Properties", () => {
    const conf = structuredClone(configuration)
    ;((conf.server.scheme = "http"), (conf.server.host = "pony"), (conf.server.applicationKey = "applicationKey"))
    test("should get url", () => {
      const oiRecognizer = new RecognizerWebSocket(conf)
      expect(oiRecognizer.url).toEqual("ws://pony/api/v4.0/iink/offscreen?applicationKey=applicationKey")
    })

    test(`should get mimeTypes`, () => {
      const oiRecognizer = new RecognizerWebSocket(conf)
      expect(oiRecognizer.mimeTypes).toEqual(["application/vnd.myscript.jiix"])
    })
  })

  describe("init", () => {
    const conf = structuredClone(configuration)
    conf.server.host = "init-test"
    let mockServer: ServerWebSocketMock
    let oiRecognizer: RecognizerWebSocket

    beforeEach(() => {
      oiRecognizer = new RecognizerWebSocket(conf)
      mockServer = new ServerWebSocketMock(oiRecognizer.url)
    })
    afterEach(async () => {
      await oiRecognizer.destroy()
      mockServer.close()
    })

    test("should have dialog sequence with hmacChallenge", async () => {
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
    test("should have dialog sequence without hmacChallenge", async () => {
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
    test("should have dialog sequence with newPart", async () => {
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
    test.skip("should reject if receive error message", async () => {
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
  describe.skip("Ping", () => {
    const conf = structuredClone(configuration)
    conf.server.host = "ping-test"
    let mockServer: ServerWebSocketMock
    let oiRecognizer: RecognizerWebSocket

    beforeEach(() => {
      oiRecognizer = new RecognizerWebSocket(conf)

      mockServer = new ServerWebSocketMock(oiRecognizer.url)
      mockServer.init()
    })

    afterEach(async () => {
      await oiRecognizer.destroy()
      mockServer.close()
    })

    test("should send ping message", async () => {
      expect.assertions(2)
      conf.server.websocket.pingEnabled = true
      const oiRecognizer = new RecognizerWebSocket(conf)
      await oiRecognizer.init()
      await delay(conf.server.websocket.pingDelay * 1.5)
      expect(mockServer.getMessages("ping")).toHaveLength(1)
      await delay(conf.server.websocket.pingDelay)
      expect(mockServer.getMessages("ping")).toHaveLength(2)
      await oiRecognizer.destroy()
    })
    test("should not send ping message", async () => {
      expect.assertions(2)
      conf.server.websocket.pingEnabled = false
      const oiRecognizer = new RecognizerWebSocket(conf)
      await oiRecognizer.init()
      await delay(conf.server.websocket.pingDelay * 1.5)
      expect(mockServer.getMessages("ping")).toHaveLength(0)
      await delay(conf.server.websocket.pingDelay)
      expect(mockServer.getMessages("ping")).toHaveLength(0)
      await oiRecognizer.destroy()
    })
    test("should close the connection when maxPingLostCount is reached", async () => {
      expect.assertions(3)
      conf.server.websocket.pingEnabled = true
      conf.server.websocket.maxPingLostCount = 2
      const oiRecognizer = new RecognizerWebSocket(conf)
      await oiRecognizer.init()
      await delay(conf.server.websocket.pingDelay * 1.5)
      expect(mockServer.server.clients()).toHaveLength(1)
      await delay(conf.server.websocket.pingDelay * conf.server.websocket.maxPingLostCount + 100)
      expect(mockServer.getMessages("ping")).toHaveLength(conf.server.websocket.maxPingLostCount + 1)
      expect(mockServer.server.clients()).toHaveLength(0)
    })
  })

  describe("send", () => {
    const conf = structuredClone(configuration)
    conf.server.host = "send-test"
    conf.server.websocket.autoReconnect = true
    let mockServer: ServerWebSocketMock
    let oiRecognizer: RecognizerWebSocket

    beforeEach(() => {
      oiRecognizer = new RecognizerWebSocket(conf)
      mockServer = new ServerWebSocketMock(oiRecognizer.url)
      mockServer.init()
    })
    afterEach(async () => {
      await oiRecognizer.destroy()
      mockServer.close()
    })

    test("should send message", async () => {
      expect.assertions(1)
      await oiRecognizer.init()
      const testDataToSend = { type: "test", data: "test-data" }
      await oiRecognizer.send(testDataToSend)
      //¯\_(ツ)_/¯  required to wait server received message
      await delay(100)
      const messageSent = JSON.parse(mockServer.getLastMessage() as string)
      expect(messageSent).toEqual(testDataToSend)
    })
    test("should reconnect before send message", async () => {
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

  describe("addStrokes", () => {
    const conf = structuredClone(configuration)
    conf.server.host = "add-strokes-test"
    let mockServer: ServerWebSocketMock
    let oiRecognizer: RecognizerWebSocket
    const strokes = [buildIIStroke()]

    beforeEach(() => {
      oiRecognizer = new RecognizerWebSocket(conf)
      mockServer = new ServerWebSocketMock(oiRecognizer.url)
      mockServer.init()
    })
    afterEach(async () => {
      await oiRecognizer.destroy()
      mockServer.close()
    })

    test("should not send addStrokes message if 0 strokes", async () => {
      expect.assertions(1)
      await oiRecognizer.init()
      await oiRecognizer.addStrokes([])
      //¯\_(ツ)_/¯  required to wait server received message
      await delay(100)
      const messageSent = JSON.parse(mockServer.getLastMessage() as string)
      await expect(messageSent.type).not.toEqual("addStrokes")
    })
    test("should send addStrokes message", async () => {
      expect.assertions(1)
      await oiRecognizer.init()
      oiRecognizer.addStrokes(strokes)
      //¯\_(ツ)_/¯  required to wait for the instantiation of the promise of the recognizer
      await delay(100)
      const messageSent = JSON.parse(mockServer.getLastMessage() as string)
      const messageSentExpected = {
        type: "addStrokes",
        strokes: strokes.map((s) => StrokeOps.formatToSend(s)),
      }
      await expect(messageSent).toMatchObject(messageSentExpected)
    })
    test("should emit event when received gestureDetected", async () => {
      expect.assertions(2)
      await oiRecognizer.init()
      const spyEmitGesture: jest.SpyInstance = jest.spyOn(oiRecognizer.event, "emitGestureDetected")
      oiRecognizer.addStrokes(strokes)
      //¯\_(ツ)_/¯  required to wait for the instantiation of the promise of the recognizer
      await delay(100)
      mockServer.sendGestureDetectedMessage()
      await expect(spyEmitGesture).toHaveBeenCalledTimes(1)
      await expect(spyEmitGesture).toHaveBeenCalledWith(gestureDetectedMessage)
    })
    test.skip("should reject if receive error message", async () => {
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

    test("should resolve addStrokes when only a contentChanged ack arrives (no gesture)", async () => {
      expect.assertions(1)
      await oiRecognizer.init()
      const promise = oiRecognizer.addStrokes(strokes)
      await delay(100)
      mockServer.sendContentChangeMessage()
      await expect(promise).resolves.toBeUndefined()
    })

    test.skip("should send overlapping addStrokes immediately and resolve acks in FIFO send order", async () => {
      expect.assertions(3)
      await oiRecognizer.init()
      const firstPromise = oiRecognizer.addStrokes(strokes)
      const secondPromise = oiRecognizer.addStrokes(strokes)
      await delay(100)
      // Both messages reach the server right away — no wait for the first ack before sending the second.
      expect(mockServer.getMessages("addStrokes")).toHaveLength(2)
      // First ack received (gesture) settles the first-sent call; second ack (contentChanged) settles the second.
      mockServer.sendGestureDetectedMessage()
      mockServer.sendContentChangeMessage()
      await expect(firstPromise).resolves.toEqual(gestureDetectedMessage)
      await expect(secondPromise).resolves.toBeUndefined()
    })
  })

  describe("offline queue", () => {
    const conf = structuredClone(configuration)
    conf.server.host = "offline-queue-test"
    conf.server.websocket.offlineQueueEnabled = true
    conf.server.websocket.reconnectDelay = 50
    conf.server.websocket.maxReconnectAttempts = 5
    let mockServer: ServerWebSocketMock
    let oiRecognizer: RecognizerWebSocket
    const strokes = [buildIIStroke()]

    beforeEach(() => {
      oiRecognizer = new RecognizerWebSocket(conf)
      mockServer = new ServerWebSocketMock(oiRecognizer.url)
      mockServer.init()
    })
    afterEach(async () => {
      await oiRecognizer.destroy()
      mockServer.close()
    })

    test("should queue addStrokes instead of rejecting when disconnected", async () => {
      await oiRecognizer.init()
      await oiRecognizer.close(1000, "simulate-drop")
      const promise = oiRecognizer.addStrokes(strokes)
      await delay(10)
      expect(oiRecognizer.isOffline).toBe(true)
      // reconnectDelay (50ms) then handshake completes automatically via mockServer.init()
      await delay(200)
      mockServer.sendGestureDetectedMessage()
      await expect(promise).toResolve()
    })

    test.skip("should replay queued addStrokes in order once reconnected", async () => {
      await oiRecognizer.init()
      await oiRecognizer.close(1000, "simulate-drop")
      const promise = oiRecognizer.addStrokes(strokes)
      // reconnectDelay (50ms) then handshake completes automatically via mockServer.init()
      await delay(200)
      const messageSent = JSON.parse(mockServer.getLastMessage() as string)
      expect(messageSent).toMatchObject({
        type: "addStrokes",
        strokes: strokes.map((s) => StrokeOps.formatToSend(s)),
      })
      mockServer.sendGestureDetectedMessage()
      await expect(promise).resolves.toEqual(gestureDetectedMessage)
      expect(oiRecognizer.isOffline).toBe(false)
    })

    test("should reject new addStrokes once offline queue is full", async () => {
      const fullQueueConf = structuredClone(conf)
      fullQueueConf.server.host = "offline-queue-full-test"
      fullQueueConf.server.websocket.offlineQueueMaxSize = 1
      const fullQueueRecognizer = new RecognizerWebSocket(fullQueueConf)
      const fullQueueMockServer = new ServerWebSocketMock(fullQueueRecognizer.url)
      fullQueueMockServer.init()
      await fullQueueRecognizer.init()
      await fullQueueRecognizer.close(1000, "simulate-drop")
      const firstPromise = fullQueueRecognizer.addStrokes(strokes)
      const secondPromise = fullQueueRecognizer.addStrokes(strokes)
      await expect(secondPromise).rejects.toThrow("Offline queue full")
      // let the reconnect loop drain the first (still valid) item before teardown
      await delay(200)
      fullQueueMockServer.sendGestureDetectedMessage()
      await expect(firstPromise).toResolve()
      await fullQueueRecognizer.destroy()
      fullQueueMockServer.close()
    })

    test("should emit connectionStatusChanged offline then connected", async () => {
      const spyStatus: jest.SpyInstance = jest.spyOn(oiRecognizer.event, "emitConnectionStatusChanged")
      await oiRecognizer.init()
      await oiRecognizer.close(1000, "simulate-drop")
      const promise = oiRecognizer.addStrokes(strokes)
      await delay(10)
      expect(spyStatus).toHaveBeenCalledWith("offline")
      await delay(200)
      expect(spyStatus).toHaveBeenCalledWith("connected")
      mockServer.sendGestureDetectedMessage()
      await expect(promise).toResolve()
    })

    test("should not queue when offlineQueueEnabled is false", async () => {
      const disabledConf = structuredClone(conf)
      disabledConf.server.host = "offline-queue-disabled-test"
      disabledConf.server.websocket.offlineQueueEnabled = false
      disabledConf.server.websocket.autoReconnect = false
      const disabledRecognizer = new RecognizerWebSocket(disabledConf)
      const disabledMockServer = new ServerWebSocketMock(disabledRecognizer.url)
      disabledMockServer.init()
      await disabledRecognizer.init()
      await disabledRecognizer.close(1000, "simulate-drop")
      await expect(disabledRecognizer.addStrokes(strokes)).rejects.toThrow()
      expect(disabledRecognizer.isOffline).toBe(false)
      await disabledRecognizer.destroy()
      disabledMockServer.close()
    })

    test("should open only one socket when a direct send() races the offline-queue reconnect loop", async () => {
      // autoReconnect must be on here: it's what makes send() attempt its own immediate
      // reconnect (e.g. via recognizeGesture during contextless gesture detection while
      // writing a stroke) instead of just rejecting — the path that used to race the
      // offline-queue reconnect loop below.
      const raceConf = structuredClone(conf)
      raceConf.server.host = "offline-queue-race-test"
      raceConf.server.websocket.autoReconnect = true
      const raceRecognizer = new RecognizerWebSocket(raceConf)
      const raceMockServer = new ServerWebSocketMock(raceRecognizer.url)
      raceMockServer.init()
      await raceRecognizer.init()

      // Close just this one connection abnormally (not code 1000, so closeCallback itself
      // starts the reconnect loop), like an unexpected network drop — the mock server itself
      // stays up so a reconnection attempt can actually succeed.
      const [client] = raceMockServer.server.clients()
      client.close({ code: 1006, reason: "simulate-drop", wasClean: false })
      await delay(10)
      // This call bypasses the offline queue and goes straight through send()'s own
      // auto-reconnect, racing the reconnect loop's already-scheduled attempt.
      const sendPromise = raceRecognizer.send({ type: "test", data: "race" }).catch(() => undefined)
      // Let both the immediate send()-triggered reconnect and the delayed reconnect-loop
      // attempt (reconnectDelay = 50ms) have a chance to run.
      await delay(300)
      expect(raceMockServer.server.clients()).toHaveLength(1)
      await sendPromise
      await raceRecognizer.destroy()
      raceMockServer.close()
    })
  })

  describe("replaceStrokes", () => {
    const conf = structuredClone(configuration)
    conf.server.host = "replace-strokes-test"
    let mockServer: ServerWebSocketMock
    let oiRecognizer: RecognizerWebSocket
    const strokes = [buildIIStroke()]
    const oldStrokeIds = ["id-1", "id-2"]

    beforeEach(() => {
      oiRecognizer = new RecognizerWebSocket(conf)
      mockServer = new ServerWebSocketMock(oiRecognizer.url)
      mockServer.init()
    })
    afterEach(async () => {
      await oiRecognizer.destroy()
      mockServer.close()
    })

    test("should not send replaceStrokes message if 0 strokes", async () => {
      expect.assertions(1)
      await oiRecognizer.init()
      await oiRecognizer.replaceStrokes([], [])
      //¯\_(ツ)_/¯  required to wait server received message
      await delay(100)
      const messageSent = JSON.parse(mockServer.getLastMessage() as string)
      await expect(messageSent.type).not.toEqual("replaceStrokes")
    })
    test("should send replaceStrokes message", async () => {
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
    test("should resolve replaceStrokes when received contentChanged", async () => {
      expect.assertions(1)
      await oiRecognizer.init()
      const promise = oiRecognizer.replaceStrokes(oldStrokeIds, strokes)
      //¯\_(ツ)_/¯  required to wait for the instantiation of the promise of the recognizer
      await delay(100)
      mockServer.sendContentChangeMessage()
      await expect(promise).toResolve()
    })
    test.skip("should reject if receive error message", async () => {
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

  describe("transformTranslate", () => {
    const conf = structuredClone(configuration)
    conf.server.host = "transform-translate-test"
    let mockServer: ServerWebSocketMock
    let oiRecognizer: RecognizerWebSocket
    const strokeIds = ["id-1", "id-2"]
    const tx = 5,
      ty = 10

    beforeEach(() => {
      oiRecognizer = new RecognizerWebSocket(conf)
      mockServer = new ServerWebSocketMock(oiRecognizer.url)
      mockServer.init()
    })
    afterEach(async () => {
      await oiRecognizer.destroy()
      mockServer.close()
    })

    test("should not send transformTranslate message if 0 strokes", async () => {
      expect.assertions(1)
      await oiRecognizer.init()
      await oiRecognizer.transformTranslate([], tx, ty)
      //¯\_(ツ)_/¯  required to wait server received message
      await delay(100)
      const messageSent = JSON.parse(mockServer.getLastMessage() as string)
      await expect(messageSent.type).not.toEqual("transformTranslate")
    })
    test("should send transformTranslate message", async () => {
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
        ty,
      }
      await expect(messageSent).toMatchObject(messageSentExpected)
    })
    test("should resolve transformTranslate when received contentChanged", async () => {
      expect.assertions(1)
      await oiRecognizer.init()
      const promise = oiRecognizer.transformTranslate(strokeIds, tx, ty)
      //¯\_(ツ)_/¯  required to wait for the instantiation of the promise of the recognizer
      await delay(100)
      mockServer.sendContentChangeMessage()
      await expect(promise).toResolve()
    })
    test.skip("should reject if receive error message", async () => {
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

  describe("transformRotate", () => {
    const conf = structuredClone(configuration)
    conf.server.host = "transform-rotate-test"
    let mockServer: ServerWebSocketMock
    let oiRecognizer: RecognizerWebSocket
    const strokeIds = ["id-1", "id-2"]
    const angle = Math.PI / 2,
      x0 = 10,
      y0 = 20

    beforeEach(() => {
      oiRecognizer = new RecognizerWebSocket(conf)
      mockServer = new ServerWebSocketMock(oiRecognizer.url)
      mockServer.init()
    })
    afterEach(async () => {
      await oiRecognizer.destroy()
      mockServer.close()
    })

    test("should not send transformRotate message if 0 strokes", async () => {
      expect.assertions(1)
      await oiRecognizer.init()
      await oiRecognizer.transformRotate([], angle, x0, y0)
      //¯\_(ツ)_/¯  required to wait server received message
      await delay(100)
      const messageSent = JSON.parse(mockServer.getLastMessage() as string)
      await expect(messageSent.type).not.toEqual("transformRotate")
    })
    test("should send transformRotate message", async () => {
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
        y0,
      }
      await expect(messageSent).toMatchObject(messageSentExpected)
    })
    test("should resolve transformRotate when received contentChanged", async () => {
      expect.assertions(1)
      await oiRecognizer.init()
      const promise = oiRecognizer.transformRotate(strokeIds, angle, x0, y0)
      //¯\_(ツ)_/¯  required to wait for the instantiation of the promise of the recognizer
      await delay(100)
      mockServer.sendContentChangeMessage()
      await expect(promise).toResolve()
    })
    test.skip("should reject if receive error message", async () => {
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

  describe("transformScale", () => {
    const conf = structuredClone(configuration)
    conf.server.host = "transform-scale-test"
    let mockServer: ServerWebSocketMock
    let oiRecognizer: RecognizerWebSocket
    const strokeIds = ["id-1", "id-2"]
    const scaleX = 2,
      scaleY = 2,
      x0 = 10,
      y0 = 20

    beforeEach(() => {
      oiRecognizer = new RecognizerWebSocket(conf)
      mockServer = new ServerWebSocketMock(oiRecognizer.url)
      mockServer.init()
    })
    afterEach(async () => {
      await oiRecognizer.destroy()
      mockServer.close()
    })

    test("should not send transformScale message if 0 strokes", async () => {
      expect.assertions(1)
      await oiRecognizer.init()
      await oiRecognizer.transformScale([], scaleX, scaleY, x0, y0)
      //¯\_(ツ)_/¯  required to wait server received message
      await delay(100)
      const messageSent = JSON.parse(mockServer.getLastMessage() as string)
      await expect(messageSent.type).not.toEqual("transformScale")
    })
    test("should send transformScale message", async () => {
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
        y0,
      }
      await expect(messageSent).toMatchObject(messageSentExpected)
    })
    test("should resolve transformScale when received contentChanged", async () => {
      expect.assertions(1)
      await oiRecognizer.init()
      const promise = oiRecognizer.transformScale(strokeIds, scaleX, scaleY, x0, y0)
      //¯\_(ツ)_/¯  required to wait for the instantiation of the promise of the recognizer
      await delay(100)
      mockServer.sendContentChangeMessage()
      await expect(promise).toResolve()
    })
    test.skip("should reject if receive error message", async () => {
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

  describe("transformMatrix", () => {
    const conf = structuredClone(configuration)
    conf.server.host = "transform-matrix-test"
    let mockServer: ServerWebSocketMock
    let oiRecognizer: RecognizerWebSocket
    const strokeIds = ["id-1", "id-2"]
    const matrix: TMatrixTransform = new MatrixTransform(6, 5, 4, 3, 2, 1)

    beforeEach(() => {
      oiRecognizer = new RecognizerWebSocket(conf)
      mockServer = new ServerWebSocketMock(oiRecognizer.url)
      mockServer.init()
    })
    afterEach(async () => {
      await oiRecognizer.destroy()
      mockServer.close()
    })

    test("should not send transformMatrix message if 0 strokes", async () => {
      expect.assertions(1)
      await oiRecognizer.init()
      await oiRecognizer.transformMatrix([], matrix)
      //¯\_(ツ)_/¯  required to wait server received message
      await delay(100)
      const messageSent = JSON.parse(mockServer.getLastMessage() as string)
      await expect(messageSent.type).not.toEqual("transformMatrix")
    })
    test("should send transformMatrix message", async () => {
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
        ...matrix,
      }
      await expect(messageSent).toMatchObject(messageSentExpected)
    })
    test("should resolve transformMatrix when received contentChanged", async () => {
      expect.assertions(1)
      await oiRecognizer.init()
      const promise = oiRecognizer.transformMatrix(strokeIds, matrix)
      //¯\_(ツ)_/¯  required to wait for the instantiation of the promise of the recognizer
      await delay(100)
      mockServer.sendContentChangeMessage()
      await expect(promise).toResolve()
    })
    test.skip("should reject if receive error message", async () => {
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

  describe("eraseStrokes", () => {
    const conf = structuredClone(configuration)
    conf.server.host = "erase-strokes-test"
    let mockServer: ServerWebSocketMock
    let oiRecognizer: RecognizerWebSocket
    const strokeIds = ["erase-1"]

    beforeEach(() => {
      oiRecognizer = new RecognizerWebSocket(conf)
      mockServer = new ServerWebSocketMock(oiRecognizer.url)
      mockServer.init()
    })
    afterEach(async () => {
      await oiRecognizer.destroy()
      mockServer.close()
    })

    test("should not send eraseStrokes message if 0 strokes", async () => {
      expect.assertions(1)
      await oiRecognizer.init()
      await oiRecognizer.eraseStrokes([])
      //¯\_(ツ)_/¯  required to wait server received message
      await delay(100)
      const messageSent = JSON.parse(mockServer.getLastMessage() as string)
      await expect(messageSent.type).not.toEqual("eraseStrokes")
    })
    test("should send eraseStrokes message", async () => {
      expect.assertions(1)
      await oiRecognizer.init()
      oiRecognizer.eraseStrokes(strokeIds)
      //¯\_(ツ)_/¯  required to wait for the instantiation of the promise of the recognizer
      await delay(100)
      const messageSent = JSON.parse(mockServer.getLastMessage() as string)
      const messageSentExpected = {
        type: "eraseStrokes",
        strokeIds,
      }
      await expect(messageSent).toMatchObject(messageSentExpected)
    })
    test("should resolve eraseStrokes when received contentChanged", async () => {
      expect.assertions(1)
      await oiRecognizer.init()
      const promise = oiRecognizer.eraseStrokes(strokeIds)
      //¯\_(ツ)_/¯  required to wait for the instantiation of the promise of the recognizer
      await delay(100)
      mockServer.sendContentChangeMessage()
      await expect(promise).toResolve()
    })
    test.skip("should reject if receive error message", async () => {
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

  describe("recognizeGesture", () => {
    const conf = structuredClone(configuration)
    conf.server.host = "recognize-gesture-test"
    let mockServer: ServerWebSocketMock
    let oiRecognizer: RecognizerWebSocket
    const stroke = buildIIStroke()

    beforeEach(() => {
      oiRecognizer = new RecognizerWebSocket(conf)
      mockServer = new ServerWebSocketMock(oiRecognizer.url)
      mockServer.init()
    })
    afterEach(async () => {
      await oiRecognizer.destroy()
      mockServer.close()
    })

    test("should not send recognizeGesture message if 0 strokes", async () => {
      expect.assertions(1)
      await oiRecognizer.init()
      //@ts-ignore
      await oiRecognizer.recognizeGesture()
      //¯\_(ツ)_/¯  required to wait server received message
      await delay(100)
      const messageSent = JSON.parse(mockServer.getLastMessage() as string)
      await expect(messageSent.type).not.toEqual("recognizeGesture")
    })
    test("should send recognizeGesture message", async () => {
      expect.assertions(1)
      await oiRecognizer.init()
      oiRecognizer.recognizeGesture(stroke)
      //¯\_(ツ)_/¯  required to wait for the instantiation of the promise of the recognizer
      await delay(100)
      const messageSent = JSON.parse(mockServer.getLastMessage() as string)
      const messageSentExpected = {
        type: "contextlessGesture",
        stroke: StrokeOps.formatToSend(stroke),
      }
      await expect(messageSent).toMatchObject(messageSentExpected)
    })
    test("should resolve recognizeGesture when received contextlessGesture", async () => {
      expect.assertions(1)
      await oiRecognizer.init()
      stroke.id = contextlessGestureMessage.strokeId
      const promise = oiRecognizer.recognizeGesture(stroke)
      //¯\_(ツ)_/¯  required to wait for the instantiation of the promise of the recognizer
      await delay(100)
      mockServer.sendContextlessGestureMessage()
      await expect(promise).toResolve()
    })
    test.skip("should reject if receive error message", async () => {
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

  describe("waitForIdle", () => {
    const conf = structuredClone(configuration)
    conf.server.host = "wait-for-idle-test"
    let mockServer: ServerWebSocketMock
    let oiRecognizer: RecognizerWebSocket

    beforeEach(() => {
      oiRecognizer = new RecognizerWebSocket(conf)
      mockServer = new ServerWebSocketMock(oiRecognizer.url)
      mockServer.init({ withIdle: false })
    })
    afterEach(async () => {
      await oiRecognizer.destroy()
      mockServer.close()
    })

    test("should send waitForIdle & resolve when receive idle message", async () => {
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
    test.skip("should reject if receive error message", async () => {
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

  describe("undo", () => {
    const conf = structuredClone(configuration)
    conf.server.host = "undo-test"
    let mockServer: ServerWebSocketMock
    let oiRecognizer: RecognizerWebSocket

    beforeEach(() => {
      oiRecognizer = new RecognizerWebSocket(conf)
      mockServer = new ServerWebSocketMock(oiRecognizer.url)
      mockServer.init()
    })
    afterEach(async () => {
      await oiRecognizer.destroy()
      mockServer.close()
    })

    test("should not send message if no changes", async () => {
      expect.assertions(2)
      await oiRecognizer.init()
      oiRecognizer.send = jest.fn()
      oiRecognizer.undo({})
      await delay(100)
      expect(oiRecognizer.send).toHaveBeenCalledTimes(0)
      const changes: TIIHistoryBackendChanges = { added: [buildIIStroke()] }
      oiRecognizer.undo(changes)
      await delay(100)
      expect(oiRecognizer.send).toHaveBeenCalledTimes(1)
    })
    test("should send undo message with changes", async () => {
      await oiRecognizer.init()
      const changes: TIIHistoryBackendChanges = {
        added: [buildIIStroke()],
        erased: [buildIIStroke()],
        replaced: { newStrokes: [buildIIStroke()], oldStrokes: [buildIIStroke()] },
        matrix: { matrix: new MatrixTransform(1, 2, 3, 4, 5, 6), strokes: [buildIIStroke()] },
        rotate: [{ angle: Math.PI / 2, center: { x: 5, y: 10 }, strokes: [buildIIStroke()] }],
        scale: [{ origin: { x: 2, y: 4 }, scaleX: 2, scaleY: 3, strokes: [buildIIStroke()] }],
        translate: [{ strokes: [buildIIStroke()], tx: 12, ty: 42 }],
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
            strokes: changes.added!.map((s) => StrokeOps.formatToSend(s)),
            processGestures: false,
          }),
        ])
      )
      expect(messageSent.changes).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: "eraseStrokes",
            strokeIds: changes.erased!.map((s) => s.id),
          }),
        ])
      )
      expect(messageSent.changes).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: "replaceStrokes",
            oldStrokeIds: changes.replaced!.oldStrokes.map((s) => s.id),
            newStrokes: changes.replaced!.newStrokes.map((s) => StrokeOps.formatToSend(s)),
          }),
        ])
      )
      expect(messageSent.changes).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: "transform",
            transformationType: "MATRIX",
            strokeIds: changes.matrix!.strokes.map((s) => s.id),
            ...changes.matrix!.matrix,
          }),
        ])
      )
      expect(messageSent.changes).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: "transform",
            transformationType: "ROTATE",
            strokeIds: changes.rotate![0].strokes.map((s) => s.id),
            angle: changes.rotate![0].angle,
            x0: changes.rotate![0].center.x,
            y0: changes.rotate![0].center.y,
          }),
        ])
      )
      expect(messageSent.changes).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: "transform",
            transformationType: "SCALE",
            strokeIds: changes.scale![0].strokes.map((s) => s.id),
            scaleX: changes.scale![0].scaleX,
            scaleY: changes.scale![0].scaleY,
            x0: changes.scale![0].origin.x,
            y0: changes.scale![0].origin.y,
          }),
        ])
      )
      expect(messageSent.changes).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: "transform",
            transformationType: "TRANSLATE",
            strokeIds: changes.translate![0].strokes.map((s) => s.id),
            tx: changes.translate![0].tx,
            ty: changes.translate![0].ty,
          }),
        ])
      )
    })
    test("should resolve undo when received contentChanged", async () => {
      expect.assertions(1)
      await oiRecognizer.init()
      const changes: TIIHistoryBackendChanges = { added: [buildIIStroke()] }
      const promise = oiRecognizer.undo(changes)
      //¯\_(ツ)_/¯  required to wait for the instantiation of the promise of the recognizer
      await delay(100)
      mockServer.sendContentChangeMessage()
      await expect(promise).toResolve()
    })
    test.skip("should reject if receive error message", async () => {
      const spyEmitError: jest.SpyInstance = jest.spyOn(oiRecognizer.event, "emitError")
      expect.assertions(3)
      await oiRecognizer.init()
      const changes: TIIHistoryBackendChanges = { added: [buildIIStroke()] }
      const promise = oiRecognizer.undo(changes)
      //¯\_(ツ)_/¯  required to wait for the instantiation of the promise of the recognizer
      await delay(100)
      mockServer.sendNotGrantedErrorMessage()
      await expect(promise).rejects.toEqual(RecognizerError.WRONG_CREDENTIALS)
      expect(spyEmitError).toHaveBeenCalledTimes(1)
      expect(spyEmitError).toHaveBeenCalledWith(new Error(RecognizerError.WRONG_CREDENTIALS))
    })
  })

  describe("redo", () => {
    const conf = structuredClone(configuration)
    conf.server.host = "redo-test"
    let mockServer: ServerWebSocketMock
    let oiRecognizer: RecognizerWebSocket

    beforeEach(() => {
      oiRecognizer = new RecognizerWebSocket(conf)
      mockServer = new ServerWebSocketMock(oiRecognizer.url)
      mockServer.init()
    })
    afterEach(async () => {
      await oiRecognizer.destroy()
      mockServer.close()
    })

    test("should send redo message", async () => {
      expect.assertions(1)
      await oiRecognizer.init()
      const changes: TIIHistoryBackendChanges = { added: [buildIIStroke()] }
      oiRecognizer.redo(changes)
      //¯\_(ツ)_/¯  required to wait for the instantiation of the promise of the recognizer
      await delay(100)
      const messageSent = JSON.parse(mockServer.getLastMessage() as string)
      const messageSentExpected = { type: "redo" }
      await expect(messageSent).toMatchObject(messageSentExpected)
    })
    test("should resolve redo when received contentChanged", async () => {
      expect.assertions(1)
      await oiRecognizer.init()
      const changes: TIIHistoryBackendChanges = { added: [buildIIStroke()] }
      const promise = oiRecognizer.redo(changes)
      //¯\_(ツ)_/¯  required to wait for the instantiation of the promise of the recognizer
      await delay(100)
      mockServer.sendContentChangeMessage()
      await expect(promise).toResolve()
    })
    test.skip("should reject if receive error message", async () => {
      const spyEmitError: jest.SpyInstance = jest.spyOn(oiRecognizer.event, "emitError")
      expect.assertions(3)
      await oiRecognizer.init()
      const changes: TIIHistoryBackendChanges = { added: [buildIIStroke()] }
      const promise = oiRecognizer.redo(changes)
      //¯\_(ツ)_/¯  required to wait for the instantiation of the promise of the recognizer
      await delay(100)
      mockServer.sendNotGrantedErrorMessage()
      await expect(promise).rejects.toEqual(RecognizerError.WRONG_CREDENTIALS)
      await expect(spyEmitError).toHaveBeenCalledTimes(1)
      await expect(spyEmitError).toHaveBeenCalledWith(new Error(RecognizerError.WRONG_CREDENTIALS))
    })
  })

  describe("clear", () => {
    const conf = structuredClone(configuration)
    conf.server.host = "clear-test"
    let mockServer: ServerWebSocketMock
    let oiRecognizer: RecognizerWebSocket

    beforeEach(() => {
      oiRecognizer = new RecognizerWebSocket(conf)
      mockServer = new ServerWebSocketMock(oiRecognizer.url)
      mockServer.init()
    })
    afterEach(async () => {
      await oiRecognizer.destroy()
      mockServer.close()
    })

    test("should send clear message", async () => {
      expect.assertions(1)
      await oiRecognizer.init()
      oiRecognizer.clear()
      //¯\_(ツ)_/¯  required to wait for the instantiation of the promise of the recognizer
      await delay(100)
      const messageSent = JSON.parse(mockServer.getLastMessage() as string)
      const messageSentExpected = { type: "clear" }
      await expect(messageSent).toMatchObject(messageSentExpected)
    })
    test("should resolve clear when received contentChanged", async () => {
      expect.assertions(1)
      await oiRecognizer.init()
      const promise = oiRecognizer.clear()
      //¯\_(ツ)_/¯  required to wait for the instantiation of the promise of the recognizer
      await delay(100)
      mockServer.sendContentChangeMessage()
      await expect(promise).toResolve()
    })
    test.skip("should reject if receive error message", async () => {
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

  describe("export", () => {
    const conf = structuredClone(configuration)
    conf.server.host = "export-test"
    let mockServer: ServerWebSocketMock
    let oiRecognizer: RecognizerWebSocket

    beforeEach(() => {
      oiRecognizer = new RecognizerWebSocket(conf)
      mockServer = new ServerWebSocketMock(oiRecognizer.url)
      mockServer.init()
    })
    afterEach(async () => {
      await oiRecognizer.destroy()
      mockServer.close()
    })

    test("should send export", async () => {
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
        mimeTypes: ["application/vnd.myscript.jiix"],
      })
      //¯\_(ツ)_/¯  required to wait for the instantiation of the promise of the recognizer
      await delay(100)
      mockServer.sendHExportMessage()
      expect(exportMessageSent).toContain(exportmessageSentExpected)
      await expect(promise).resolves.toEqual(
        expect.objectContaining({
          "application/vnd.myscript.jiix": hTextJIIX,
        })
      )
      oiRecognizer.destroy()
    })
    test("should resolve when receive fileChunckAck message", async () => {
      expect.assertions(1)

      await oiRecognizer.init()
      const promise = oiRecognizer.export()
      //¯\_(ツ)_/¯  required to wait for the instantiation of the promise of the recognizer
      await delay(100)
      mockServer.sendHExportMessage()
      await expect(promise).resolves.toEqual(
        expect.objectContaining({
          "application/vnd.myscript.jiix": hTextJIIX,
        })
      )
      oiRecognizer.destroy()
    })
    test.skip("should reject if receive error message", async () => {
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

  describe("Connection lost", () => {
    const conf = structuredClone(configuration)
    conf.server.host = "close-test"
    let mockServer: ServerWebSocketMock
    let oiRecognizer: RecognizerWebSocket

    beforeEach(() => {
      oiRecognizer = new RecognizerWebSocket(conf)
      mockServer = new ServerWebSocketMock(oiRecognizer.url)
      mockServer.init()
    })
    afterEach(async () => {
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
    closeMessageOptions.forEach(async (closeEvent) => {
      test(`should emit error if the server closes the connection abnormally code == ${closeEvent.code}`, async () => {
        const spyEmitError: jest.SpyInstance = jest.spyOn(oiRecognizer.event, "emitError")
        expect.assertions(2)
        await oiRecognizer.init()
        mockServer.close({ code: closeEvent.code, reason: closeEvent.message, wasClean: false })
        expect(spyEmitError).toHaveBeenCalledTimes(1)
        expect(spyEmitError).toHaveBeenCalledWith(new Error(closeEvent.message))
      })
    })
  })

  describe("destroy", () => {
    const conf = structuredClone(configuration)
    conf.server.host = "destroy-test"
    let mockServer: ServerWebSocketMock

    test("should close socket", async () => {
      const oiRecognizer = new RecognizerWebSocket(conf)
      mockServer = new ServerWebSocketMock(oiRecognizer.url)
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
