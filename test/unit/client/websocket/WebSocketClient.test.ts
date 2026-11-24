import { InteractiveInkCanvasOverrideConfiguration } from "../../__dataset__/configuration.dataset"
import { ServerWebSocketMock, contextlessGestureMessage, gestureDetectedMessage, hTextJIIX, partChangeMessage } from "../../__mocks__/ServerWebSocketMock"
import { buildIIStroke, delay } from "../../helpers"
import { WebSocketClient, ClientError, TMatrixTransform, MatrixTransform, TIIHistoryBackendChanges, TWebSocketClientConfiguration, TWebSocketClientMessage, TStroke, toWireStroke, LoggerManager, LoggerCategory, TWebSocketClientMessageType } from "@/iink"

import { toResolve } from "jest-extended"
expect.extend({ toResolve })

jest.mock("web-worker:../../worker/ping.worker.ts", () =>
  jest.fn().mockImplementation(() => ({ postMessage: jest.fn(), terminate: jest.fn() }))
)

describe("WebSocketClient.ts", () => {
  const configuration: TWebSocketClientConfiguration = {
    recognition: InteractiveInkCanvasOverrideConfiguration.recognition,
    server: InteractiveInkCanvasOverrideConfiguration.server,
  }

  test("should instanciate WebSocketClient", () => {
    const wsClient = new WebSocketClient(configuration)
    expect(wsClient).toBeDefined()
  })

  describe("Properties", () => {
    const conf = structuredClone(configuration)
    ;((conf.server.scheme = "http"), (conf.server.host = "pony"), (conf.server.applicationKey = "applicationKey"))
    test("should get url", () => {
      const wsClient = new WebSocketClient(conf)
      expect(wsClient.url).toEqual("ws://pony/api/v4.0/iink/offscreen?applicationKey=applicationKey")
    })
    test("should encode the application key in the url", () => {
      const wsClient = new WebSocketClient({ ...conf, server: { ...conf.server, applicationKey: "a&b=c" } })
      expect(wsClient.url).toEqual("ws://pony/api/v4.0/iink/offscreen?applicationKey=a%26b%3Dc")
    })

    test(`should get mimeTypes`, () => {
      const wsClient = new WebSocketClient(conf)
      expect(wsClient.mimeTypes).toEqual(["application/vnd.myscript.jiix"])
    })
  })

  describe("newSession", () => {
    const buildClient = () => {
      const wsClient = new WebSocketClient(structuredClone(configuration))
      wsClient.close = jest.fn(() => Promise.resolve())
      wsClient.init = jest.fn(() => Promise.resolve())
      return wsClient
    }

    test("should not duplicate the configuration arrays when the new one repeats them", async () => {
      const wsClient = buildClient()
      const types = [...wsClient.configuration.recognition["raw-content"].recognition!.types]

      await wsClient.newSession({ recognition: wsClient.configuration.recognition })

      expect(wsClient.configuration.recognition["raw-content"].recognition!.types).toEqual(types)
    })

    test("should replace an array given by the new configuration", async () => {
      const wsClient = buildClient()

      await wsClient.newSession({ recognition: { "raw-content": { recognition: { types: ["math"] } } } })

      expect(wsClient.configuration.recognition["raw-content"].recognition!.types).toEqual(["math"])
    })

    test("should keep the keys the new configuration leaves out", async () => {
      const wsClient = buildClient()
      const host = wsClient.configuration.server.host

      await wsClient.newSession({ recognition: { lang: "fr_FR" } })

      expect(wsClient.configuration.recognition.lang).toEqual("fr_FR")
      expect(wsClient.configuration.server.host).toEqual(host)
    })
  })

  describe("changeConfiguration", () => {
    const buildClient = () => {
      const wsClient = new WebSocketClient(structuredClone(configuration))
      wsClient.close = jest.fn(() => Promise.resolve())
      wsClient.init = jest.fn(() => Promise.resolve())
      // The server answers once the request is sent, in a later message event
      wsClient.send = jest.fn(async () => {
        setTimeout(() => wsClient["manageConfigurationChanged"]())
      })
      return wsClient
    }

    test("should send the new recognition configuration without closing the session", async () => {
      const wsClient = buildClient()

      await wsClient.changeConfiguration({ recognition: { math: { solver: { "angle-unit": "deg" } } } })

      expect(wsClient.close).not.toHaveBeenCalled()
      expect(wsClient.init).not.toHaveBeenCalled()
      expect(wsClient.send).toHaveBeenCalledWith({
        type: "changeConfiguration",
        configuration: wsClient.configuration.recognition,
      })
    })

    test("should not duplicate the configuration arrays when the new one repeats them", async () => {
      const wsClient = buildClient()
      const types = [...wsClient.configuration.recognition["raw-content"].recognition!.types]

      await wsClient.changeConfiguration({ recognition: wsClient.configuration.recognition })

      expect(wsClient.configuration.recognition["raw-content"].recognition!.types).toEqual(types)
    })

    test("should keep the keys the new configuration leaves out", async () => {
      const wsClient = buildClient()
      const host = wsClient.configuration.server.host

      await wsClient.changeConfiguration({ recognition: { math: { solver: { "angle-unit": "deg" } } } })

      expect(wsClient.configuration.recognition.math?.solver?.["angle-unit"]).toEqual("deg")
      expect(wsClient.configuration.server.host).toEqual(host)
    })
  })

  describe("init", () => {
    const conf = structuredClone(configuration)
    conf.server.host = "init-test"
    let mockServer: ServerWebSocketMock
    let wsClient: WebSocketClient

    beforeEach(() => {
      wsClient = new WebSocketClient(conf)
      mockServer = new ServerWebSocketMock(wsClient.url)
    })
    afterEach(async () => {
      await wsClient.destroy()
      mockServer.close()
    })

    test("should reject init when the HMAC signature cannot be resolved", async () => {
      const failingConf = structuredClone(conf)
      failingConf.server.host = "init-hmac-failure-test"
      const client = new WebSocketClient({
        ...failingConf,
        server: { ...failingConf.server, sign: () => Promise.reject(new Error("signing endpoint down")) },
      })
      client.event.emitError = jest.fn()
      const server = new ServerWebSocketMock(client.url)
      server.init()
      await expect(client.init()).rejects.toThrow("signing endpoint down")
      await client.destroy()
      server.close()
    })

    test("should answer the HMAC challenge with the signature of server.sign", async () => {
      const signingConf = structuredClone(conf)
      signingConf.server.host = "init-hmac-sign-test"
      const sign = jest.fn(async (message: string) => `signed-${message}`)
      const client = new WebSocketClient({ ...signingConf, server: { ...signingConf.server, sign } })
      const server = new ServerWebSocketMock(client.url)
      server.init()
      await client.init()
      expect(sign).toHaveBeenCalledWith("1f434e8b-cc46-4a8c-be76-708eea2ff305", signingConf.server.applicationKey)
      expect(JSON.parse(server.getMessages("hmac")[0] as string)).toEqual({
        type: "hmac",
        hmac: "signed-1f434e8b-cc46-4a8c-be76-708eea2ff305",
      })
      await client.destroy()
      server.close()
    })

    test("should have dialog sequence with hmacChallenge", async () => {
      expect(mockServer.getMessages("authenticate")).toHaveLength(0)
      const promise = wsClient.init()
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
      const promise = wsClient.init()
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
      const promise = wsClient.init()
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
      const spyEmitError: jest.SpyInstance = jest.spyOn(wsClient.event, "emitError")
      expect.assertions(3)
      const promise = wsClient.init()
      //¯\_(ツ)_/¯  required to wait for the instantiation of the promise of the client
      await delay(100)
      mockServer.sendNotGrantedErrorMessage()
      await expect(promise).rejects.toEqual(ClientError.WRONG_CREDENTIALS)
      await expect(spyEmitError).toHaveBeenCalledTimes(1)
      await expect(spyEmitError).toHaveBeenCalledWith(new Error(ClientError.WRONG_CREDENTIALS))
    })
  })

  describe("messageCallback error routing", () => {
    type WithCallback = { messageCallback: (message: MessageEvent<string>) => void }
    const invoke = (client: WebSocketClient, data: string) =>
      (client as unknown as WithCallback).messageCallback({ data } as MessageEvent<string>)

    test("should report the raw payload when it is not JSON at all", () => {
      const wsClient = new WebSocketClient(configuration)
      const spyEmitError = jest.spyOn(wsClient.event, "emitError")

      invoke(wsClient, "<html>502 Bad Gateway</html>")

      // For an unparseable payload the payload itself is the useful diagnostic.
      expect(spyEmitError).toHaveBeenCalledWith(new Error("<html>502 Bad Gateway</html>"))
    })

    test("should warn with the raw payload and not report an error when the type is unknown", () => {
      const wsClient = new WebSocketClient(configuration)
      const spyEmitError = jest.spyOn(wsClient.event, "emitError")
      const spyWarn = jest.spyOn(LoggerManager.getLogger(LoggerCategory.CLIENT), "warn")
      const payload = JSON.stringify({ type: "notAMessageType" })

      invoke(wsClient, payload)

      expect(spyWarn).toHaveBeenCalledWith("messageCallback", `Message type unknown: "${payload}".`)
      expect(spyEmitError).not.toHaveBeenCalled()
      spyWarn.mockRestore()
    })

    test("should report the whole undo/redo state a contentChanged message carries", () => {
      const wsClient = new WebSocketClient(configuration)
      const spyContentChanged = jest.spyOn(wsClient.event, "emitContentChanged")
      const payload = {
        type: "contentChanged",
        partId: "part",
        canUndo: true,
        canRedo: false,
        empty: false,
        undoStackIndex: 3,
        possibleUndoCount: 2,
      }

      invoke(wsClient, JSON.stringify(payload))

      expect(spyContentChanged).toHaveBeenCalledWith({
        canUndo: true,
        canRedo: false,
        empty: false,
        stackIndex: 3,
        possibleUndoCount: 2,
      })
    })

    test("should report a handler's own error rather than the payload", () => {
      const wsClient = new WebSocketClient(configuration)
      const boom = new Error("manageSessionDescriptionMessage blew up")
      ;(wsClient as unknown as { manageSessionDescriptionMessage: () => void }).manageSessionDescriptionMessage =
        () => {
          throw boom
        }
      const spyEmitError = jest.spyOn(wsClient.event, "emitError")

      const payload = JSON.stringify({ type: "sessionDescription" })
      invoke(wsClient, payload)

      // Reporting `new Error(payload)` here would hide every message-handling bug in the client
      // behind a message that only ever says "the server sent this".
      expect(spyEmitError).toHaveBeenCalledWith(boom)
      expect(spyEmitError).not.toHaveBeenCalledWith(new Error(payload))
    })
  })

  //TODO fix mock web worker
  describe.skip("Ping", () => {
    const conf = structuredClone(configuration)
    conf.server.host = "ping-test"
    let mockServer: ServerWebSocketMock
    let wsClient: WebSocketClient

    beforeEach(() => {
      wsClient = new WebSocketClient(conf)

      mockServer = new ServerWebSocketMock(wsClient.url)
      mockServer.init()
    })

    afterEach(async () => {
      await wsClient.destroy()
      mockServer.close()
    })

    test("should send ping message", async () => {
      expect.assertions(2)
      conf.server.websocket.pingEnabled = true
      const wsClient = new WebSocketClient(conf)
      await wsClient.init()
      await delay(conf.server.websocket.pingDelay * 1.5)
      expect(mockServer.getMessages("ping")).toHaveLength(1)
      await delay(conf.server.websocket.pingDelay)
      expect(mockServer.getMessages("ping")).toHaveLength(2)
      await wsClient.destroy()
    })
    test("should not send ping message", async () => {
      expect.assertions(2)
      conf.server.websocket.pingEnabled = false
      const wsClient = new WebSocketClient(conf)
      await wsClient.init()
      await delay(conf.server.websocket.pingDelay * 1.5)
      expect(mockServer.getMessages("ping")).toHaveLength(0)
      await delay(conf.server.websocket.pingDelay)
      expect(mockServer.getMessages("ping")).toHaveLength(0)
      await wsClient.destroy()
    })
    test("should close the connection when maxPingLostCount is reached", async () => {
      expect.assertions(3)
      conf.server.websocket.pingEnabled = true
      conf.server.websocket.maxPingLostCount = 2
      const wsClient = new WebSocketClient(conf)
      await wsClient.init()
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
    let wsClient: WebSocketClient

    beforeEach(() => {
      wsClient = new WebSocketClient(conf)
      mockServer = new ServerWebSocketMock(wsClient.url)
      mockServer.init()
    })
    afterEach(async () => {
      await wsClient.destroy()
      mockServer.close()
    })

    test("should send message", async () => {
      expect.assertions(1)
      await wsClient.init()
      const testDataToSend = { type: "test", data: "test-data" }
      await wsClient.send(testDataToSend)
      //¯\_(ツ)_/¯  required to wait server received message
      await delay(100)
      const messageSent = JSON.parse(mockServer.getLastMessage() as string)
      expect(messageSent).toEqual(testDataToSend)
    })
    test("should reconnect before send message", async () => {
      expect.assertions(1)
      await wsClient.init()
      await wsClient.close(1000, "CLOSE_CLIENT")
      const testDataToSend = { type: "test", data: "test-data" }
      await wsClient.send(testDataToSend)
      //¯\_(ツ)_/¯  required to wait server received message
      await delay(300)
      const messageSent = JSON.parse(mockServer.getLastMessage() as string)
      expect(messageSent).toEqual(testDataToSend)
    })
    test("should reject when the socket fails to send", async () => {
      await wsClient.init()
      const socket = (wsClient as unknown as { socket: WebSocket }).socket
      jest.spyOn(socket, "send").mockImplementation(() => {
        throw new Error("send failed")
      })
      await expect(wsClient.send({ type: "test" })).rejects.toThrow("send failed")
    })
  })

  describe("addStrokes", () => {
    const conf = structuredClone(configuration)
    conf.server.host = "add-strokes-test"
    let mockServer: ServerWebSocketMock
    let wsClient: WebSocketClient
    const strokes = [buildIIStroke()]

    beforeEach(() => {
      wsClient = new WebSocketClient(conf)
      mockServer = new ServerWebSocketMock(wsClient.url)
      mockServer.init()
    })
    afterEach(async () => {
      await wsClient.destroy()
      mockServer.close()
    })

    test("should not send addStrokes message if 0 strokes", async () => {
      expect.assertions(1)
      await wsClient.init()
      await wsClient.addStrokes([])
      //¯\_(ツ)_/¯  required to wait server received message
      await delay(100)
      const messageSent = JSON.parse(mockServer.getLastMessage() as string)
      await expect(messageSent.type).not.toEqual("addStrokes")
    })
    test("should send addStrokes message", async () => {
      expect.assertions(1)
      await wsClient.init()
      wsClient.addStrokes(strokes)
      //¯\_(ツ)_/¯  required to wait for the instantiation of the promise of the client
      await delay(100)
      const messageSent = JSON.parse(mockServer.getLastMessage() as string)
      const messageSentExpected = {
        type: "addStrokes",
        strokes: strokes.map((s) => toWireStroke(s)),
      }
      await expect(messageSent).toMatchObject(messageSentExpected)
    })
    test("should send t0 and dt instead of t to a server from 4.6.0", async () => {
      await wsClient.init()
      wsClient.configuration.server.version = "4.6.0"
      wsClient.addStrokes(strokes)
      //¯\_(ツ)_/¯  required to wait for the instantiation of the promise of the client
      await delay(100)
      const [sent] = JSON.parse(mockServer.getLastMessage() as string).strokes
      expect(sent).toEqual(toWireStroke(strokes[0], { relativeTimestamps: true }))
      expect(sent.t).toBeUndefined()
      expect(sent.t0).toEqual(expect.any(Number))
    })
    test("should emit event when received gestureDetected", async () => {
      expect.assertions(2)
      await wsClient.init()
      const spyEmitGesture: jest.SpyInstance = jest.spyOn(wsClient.event, "emitGestureDetected")
      wsClient.addStrokes(strokes)
      //¯\_(ツ)_/¯  required to wait for the instantiation of the promise of the client
      await delay(100)
      mockServer.sendGestureDetectedMessage()
      await expect(spyEmitGesture).toHaveBeenCalledTimes(1)
      await expect(spyEmitGesture).toHaveBeenCalledWith(gestureDetectedMessage)
    })
    test.skip("should reject if receive error message", async () => {
      const spyEmitError: jest.SpyInstance = jest.spyOn(wsClient.event, "emitError")
      expect.assertions(3)
      await wsClient.init()
      const promise = wsClient.addStrokes(strokes)
      //¯\_(ツ)_/¯  required to wait for the instantiation of the promise of the client
      await delay(100)
      mockServer.sendNotGrantedErrorMessage()
      await expect(promise).rejects.toEqual(ClientError.WRONG_CREDENTIALS)
      await expect(spyEmitError).toHaveBeenCalledTimes(1)
      await expect(spyEmitError).toHaveBeenCalledWith(new Error(ClientError.WRONG_CREDENTIALS))
    })

    test("should resolve addStrokes when only a contentChanged ack arrives (no gesture)", async () => {
      expect.assertions(1)
      await wsClient.init()
      const promise = wsClient.addStrokes(strokes)
      await delay(100)
      mockServer.sendContentChangeMessage()
      await expect(promise).resolves.toBeUndefined()
    })

    test.skip("should send overlapping addStrokes immediately and resolve acks in FIFO send order", async () => {
      expect.assertions(3)
      await wsClient.init()
      const firstPromise = wsClient.addStrokes(strokes)
      const secondPromise = wsClient.addStrokes(strokes)
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

  describe("message size", () => {
    const strokeBytes = (s: TStroke) => JSON.stringify(toWireStroke(s)).length
    const wireStrokesOf = (message: TWebSocketClientMessage): unknown[] =>
      Array.isArray(message.strokes) ? message.strokes : []
    const idOf = (wire: unknown) => (typeof wire === "object" && wire !== null && "id" in wire ? wire.id : undefined)

    // Not initialized, so the client counts as disconnected: without this the messages would wait in
    // the offline queue instead of reaching `send`.
    const onlineConf = (): TWebSocketClientConfiguration => {
      const conf = structuredClone(configuration)
      conf.server.websocket.autoReconnect = false
      return conf
    }

    class SmallFrameClient extends WebSocketClient {
      constructor(
        conf: TWebSocketClientConfiguration,
        protected readonly maxMessageBytes: number
      ) {
        super(conf)
      }
    }

    test("should split strokes over several messages so none outgrows the frame budget", async () => {
      const strokes = Array.from({ length: 6 }, () => buildIIStroke({ nbPoint: 40, box: { x: 0, y: 0, width: 400, height: 400 } }))
      const budget = strokeBytes(strokes[0]) * 2 + 200
      const wsClient = new SmallFrameClient(onlineConf(), budget)
      const sent: TWebSocketClientMessage[] = []
      jest.spyOn(wsClient, "send").mockImplementation((message) => {
        sent.push(message)
        return Promise.resolve()
      })

      await wsClient.addStrokes(strokes, false)

      expect(sent.length).toBeGreaterThan(1)
      sent.forEach((message) => expect(JSON.stringify(message).length).toBeLessThanOrEqual(budget))
      const sentIds = sent.flatMap((message) => wireStrokesOf(message).map(idOf))
      expect(sentIds).toEqual(strokes.map((s) => s.id))
    })

    test("should still send a stroke larger than the budget, alone", async () => {
      const strokes = [buildIIStroke(), buildIIStroke({ nbPoint: 200, box: { x: 0, y: 0, width: 2000, height: 2000 } }), buildIIStroke()]
      const wsClient = new SmallFrameClient(onlineConf(), strokeBytes(strokes[0]) + 200)
      const sent: TWebSocketClientMessage[] = []
      jest.spyOn(wsClient, "send").mockImplementation((message) => {
        sent.push(message)
        return Promise.resolve()
      })

      await wsClient.addStrokes(strokes, false)

      expect(sent.map((message) => wireStrokesOf(message).length)).toEqual([1, 1, 1])
    })

    const recordSends = (wsClient: WebSocketClient): TWebSocketClientMessage[] => {
      const sent: TWebSocketClientMessage[] = []
      jest.spyOn(wsClient, "send").mockImplementation((message) => {
        sent.push(message)
        return Promise.resolve()
      })
      return sent
    }
    const ids = Array.from({ length: 30 }, (_, i) => `stroke-${String(i).padStart(36, "0")}`)
    const idsOf = (message: TWebSocketClientMessage): unknown[] => (Array.isArray(message.strokeIds) ? message.strokeIds : [])

    test.each([
      ["transformTranslate", (c: WebSocketClient) => c.transformTranslate(ids, 1, 2)],
      ["transformRotate", (c: WebSocketClient) => c.transformRotate(ids, 0.5)],
      ["transformScale", (c: WebSocketClient) => c.transformScale(ids, 2, 2)],
      ["transformMatrix", (c: WebSocketClient) => c.transformMatrix(ids, MatrixTransform.identity())],
      ["eraseStrokes", (c: WebSocketClient) => c.eraseStrokes(ids)],
    ])("%s should split its stroke ids so no message outgrows the frame budget", async (_, call) => {
      const budget = 600
      const wsClient = new SmallFrameClient(onlineConf(), budget)
      const sent = recordSends(wsClient)

      await call(wsClient)

      expect(sent.length).toBeGreaterThan(1)
      sent.forEach((message) => expect(JSON.stringify(message).length).toBeLessThanOrEqual(budget))
      expect(sent.flatMap(idsOf)).toEqual(ids)
      expect(new Set(sent.map((message) => message.type)).size).toBe(1)
    })

    test.each([
      ["transformTranslate", (c: WebSocketClient) => c.transformTranslate([], 1, 2)],
      ["transformRotate", (c: WebSocketClient) => c.transformRotate([], 0.5)],
      ["transformScale", (c: WebSocketClient) => c.transformScale([], 2, 2)],
      ["transformMatrix", (c: WebSocketClient) => c.transformMatrix([], MatrixTransform.identity())],
      ["eraseStrokes", (c: WebSocketClient) => c.eraseStrokes([])],
    ])("%s should send nothing for no stroke", async (_, call) => {
      const wsClient = new SmallFrameClient(onlineConf(), 600)
      const sent = recordSends(wsClient)

      await call(wsClient)

      expect(sent).toHaveLength(0)
    })

    test("replaceStrokes should send the replacement first, then the strokes left over as additions", async () => {
      const newStrokes = Array.from({ length: 6 }, () => buildIIStroke({ nbPoint: 40, box: { x: 0, y: 0, width: 400, height: 400 } }))
      const budget = strokeBytes(newStrokes[0]) * 2 + 400
      const wsClient = new SmallFrameClient(onlineConf(), budget)
      const sent = recordSends(wsClient)

      await wsClient.replaceStrokes(["old-1", "old-2"], newStrokes)

      expect(sent.length).toBeGreaterThan(1)
      expect(sent[0]).toMatchObject({ type: "replaceStrokes", oldStrokeIds: ["old-1", "old-2"] })
      sent.slice(1).forEach((message) => expect(message.type).toBe("addStrokes"))
      sent.forEach((message) => expect(JSON.stringify(message).length).toBeLessThanOrEqual(budget))
      const sentIds = sent.flatMap((message) =>
        (Array.isArray(message.newStrokes) ? message.newStrokes : wireStrokesOf(message)).map(idOf)
      )
      expect(sentIds).toEqual(newStrokes.map((s) => s.id))
    })
  })

  describe("offline queue", () => {
    const conf = structuredClone(configuration)
    conf.server.host = "offline-queue-test"
    conf.server.websocket.autoReconnect = true
    conf.server.websocket.reconnectDelay = 50
    conf.server.websocket.maxReconnectAttempts = 5
    let mockServer: ServerWebSocketMock
    let wsClient: WebSocketClient
    const strokes = [buildIIStroke()]

    beforeEach(() => {
      wsClient = new WebSocketClient(conf)
      mockServer = new ServerWebSocketMock(wsClient.url)
      mockServer.init()
    })
    afterEach(async () => {
      await wsClient.destroy()
      mockServer.close()
    })

    test("should queue addStrokes instead of rejecting when disconnected", async () => {
      await wsClient.init()
      await wsClient.close(1000, "simulate-drop")
      const promise = wsClient.addStrokes(strokes)
      await delay(10)
      expect(wsClient.isOffline).toBe(true)
      // reconnectDelay (50ms) then handshake completes automatically via mockServer.init()
      await delay(200)
      mockServer.sendGestureDetectedMessage()
      await expect(promise).toResolve()
    })

    test.skip("should replay queued addStrokes in order once reconnected", async () => {
      await wsClient.init()
      await wsClient.close(1000, "simulate-drop")
      const promise = wsClient.addStrokes(strokes)
      // reconnectDelay (50ms) then handshake completes automatically via mockServer.init()
      await delay(200)
      const messageSent = JSON.parse(mockServer.getLastMessage() as string)
      expect(messageSent).toMatchObject({
        type: "addStrokes",
        strokes: strokes.map((s) => toWireStroke(s)),
      })
      mockServer.sendGestureDetectedMessage()
      await expect(promise).resolves.toEqual(gestureDetectedMessage)
      expect(wsClient.isOffline).toBe(false)
    })

    test("should queue every change made while disconnected and replay them in order", async () => {
      await wsClient.init()
      await wsClient.close(1000, "simulate-drop")
      const before = mockServer.messages.length

      const changes = Promise.all([
        wsClient.addStrokes(strokes),
        wsClient.eraseStrokes(["stroke-1"]),
        wsClient.transformTranslate(["stroke-2"], 1, 2),
        wsClient.replaceStrokes(["stroke-3"], strokes),
        wsClient.clear(),
      ])
      await delay(10)
      expect(wsClient.offlineQueueLength).toBe(5)
      await delay(200)

      await expect(changes).toResolve()
      const replayed = mockServer.messages
        .slice(before)
        .map((m) => (JSON.parse(m as string) as { type: string }).type)
        .filter((type) => !["authenticate", "hmac", "restoreSession", "openContentPart", "ping"].includes(type))
      expect(replayed).toEqual(["addStrokes", "eraseStrokes", "transform", "replaceStrokes", "clear"])
    })

    // initialized resolves when the handshake ends, before the queue is replayed: a request or a
    // change issued on the reconnected socket in between used to overtake the queue — an export
    // then answered with the content from before the drop.
    test("should not let a request or a change made during the reconnection overtake the queue", async () => {
      class EagerClient extends WebSocketClient {
        onOpen?: () => void
        protected openCallback(): void {
          const onOpen = this.onOpen
          this.onOpen = undefined
          onOpen?.()
          super.openCallback()
        }
      }
      const eagerConf = structuredClone(conf)
      eagerConf.server.host = "offline-queue-overtake-test"
      const eagerClient = new EagerClient(eagerConf)
      const server = new ServerWebSocketMock(eagerClient.url)
      server.init()
      await eagerClient.init()
      await eagerClient.close(1000, "simulate-drop")
      const before = server.messages.length
      const queued = eagerClient.addStrokes(strokes, false)
      let lateRequest: Promise<void> | undefined
      let lateChange: Promise<void> | undefined
      eagerClient.onOpen = () => {
        lateRequest = eagerClient.send({ type: "probe" })
        lateChange = eagerClient.eraseStrokes(["stroke-1"])
      }

      await waitUntil(() => server.getMessages("probe").length > 0 && server.getMessages("eraseStrokes").length > 0)
      await expect(Promise.all([queued, lateRequest, lateChange])).toResolve()
      const types = server.messages.slice(before).map((m) => (JSON.parse(m as string) as { type: string }).type)
      expect(types.indexOf("probe")).toBeGreaterThan(types.indexOf("addStrokes"))
      expect(types.indexOf("eraseStrokes")).toBeGreaterThan(types.indexOf("addStrokes"))
      await eagerClient.destroy()
      server.close()
    })

    test("should let a request wait for the reconnection, and send it after the queued changes", async () => {
      await wsClient.init()
      await wsClient.close(1000, "simulate-drop")
      const before = mockServer.messages.length

      const change = wsClient.addStrokes(strokes, false)
      const request = wsClient.send({ type: "probe" })
      await delay(200)

      await expect(change).toResolve()
      await expect(request).toResolve()
      const types = mockServer.messages.slice(before).map((m) => (JSON.parse(m as string) as { type: string }).type)
      expect(types.indexOf("probe")).toBeGreaterThan(types.indexOf("addStrokes"))
    })

    /** Polls `condition` rather than sleeping a fixed time: these tests run under parallel load. */
    const waitUntil = async (condition: () => boolean, timeout = 3000) => {
      const start = Date.now()
      while (!condition()) {
        if (Date.now() - start > timeout) throw new Error("waitUntil: condition never met")
        await delay(10)
      }
    }

    /**
     * A server that stays reachable but drops new connections with 1006: every one while `down` is
     * set, or only the next `dropNext` ones.
     */
    const flakyServer = (url: string) => {
      const server = new ServerWebSocketMock(url)
      const state = { down: false, dropNext: 0 }
      server.on("connection", (socket) => {
        if (state.down || state.dropNext > 0) {
          state.dropNext = Math.max(0, state.dropNext - 1)
          socket.close({ code: 1006, reason: "server down", wasClean: false })
        }
      })
      server.init()
      return { server, state }
    }

    test("should keep a request made while disconnected through a failed reconnection attempt", async () => {
      const retryConf = structuredClone(conf)
      retryConf.server.host = "offline-queue-retry-test"
      const retryClient = new WebSocketClient(retryConf)
      const { server, state } = flakyServer(retryClient.url)
      await retryClient.init()
      await retryClient.close(1000, "simulate-drop")
      // The first reconnection attempt is dropped with a 1006 close; the next one gets through
      state.dropNext = 1

      const request = retryClient.getVariables("block-1")
      await waitUntil(() => server.getMessages("mathSolver").length > 0)
      const socket = server.server.clients().at(-1)
      socket?.send(JSON.stringify({ type: "mathSolverResult", action: "get-variables", blockId: "block-1", result: [] }))

      await expect(request).resolves.toEqual([])
      await retryClient.destroy()
      server.close()
    })

    // A handshake step that fails late — e.g. the HMAC answered on a socket already closing — used
    // to reject the `initialized` of the attempt after it; that attempt then failed without a close
    // event to replace it, and so did every attempt after, until the client gave up.
    test("should give each connection attempt its own handshake, not one a late failure already rejected", async () => {
      const staleConf = structuredClone(conf)
      staleConf.server.host = "offline-queue-stale-init-test"
      const staleClient = new WebSocketClient(staleConf)
      const server = new ServerWebSocketMock(staleClient.url)
      server.init()
      await staleClient.init()
      await staleClient.close(1000, "simulate-drop")
      staleClient.initialized.reject(new Error("late handshake failure of a previous attempt"))
      staleClient.initialized.promise.catch(() => undefined)

      await expect(staleClient.init()).toResolve()
      await staleClient.destroy()
      server.close()
    })

    test("should ignore an HMAC challenge read on a socket that is no longer open", async () => {
      class HandshakeClient extends WebSocketClient {
        answerChallenge(): Promise<void> {
          return this.manageHMACChallenge({
            type: TWebSocketClientMessageType.HMAC_Challenge,
            hmacChallenge: "c",
            iinkSessionId: "s",
          })
        }
      }
      const handshakeConf = structuredClone(conf)
      handshakeConf.server.host = "offline-queue-closing-hmac-test"
      const handshakeClient = new HandshakeClient(handshakeConf)
      const server = new ServerWebSocketMock(handshakeClient.url)
      server.init()
      await handshakeClient.init()
      await handshakeClient.close(1000, "simulate-drop")
      const emitError = jest.spyOn(handshakeClient.event, "emitError")

      await expect(handshakeClient.answerChallenge()).toResolve()
      expect(emitError).not.toHaveBeenCalled()
      server.close()
    })

    test("should close the socket a failed handshake left open before opening the next one", async () => {
      const leakConf = structuredClone(conf)
      leakConf.server.host = "offline-queue-leak-test"
      let failKey = true
      const leakClient = new WebSocketClient({
        ...leakConf,
        server: {
          ...leakConf.server,
          sign: () => (failKey ? Promise.reject(new Error("signing endpoint down")) : Promise.resolve("signature")),
        },
      })
      leakClient.event.emitError = jest.fn()
      const server = new ServerWebSocketMock(leakClient.url)
      server.init()
      await expect(leakClient.init()).rejects.toThrow("signing endpoint down")
      failKey = false

      await leakClient.init()

      expect(server.server.clients()).toHaveLength(1)
      await leakClient.destroy()
      server.close()
    })

    test("should reject a request waiting for the reconnection once the client gives up", async () => {
      const giveUpConf = structuredClone(conf)
      giveUpConf.server.host = "offline-queue-give-up-test"
      giveUpConf.server.websocket.maxReconnectAttempts = 2
      const giveUpClient = new WebSocketClient(giveUpConf)
      const { server, state } = flakyServer(giveUpClient.url)
      await giveUpClient.init()
      await giveUpClient.close(1000, "simulate-drop")
      state.down = true

      const request = giveUpClient.send({ type: "probe" })

      await expect(request).rejects.toThrow("Unable to reconnect")
      await giveUpClient.destroy()
      server.close()
    })

    test("should reject new addStrokes once offline queue is full", async () => {
      const fullQueueConf = structuredClone(conf)
      fullQueueConf.server.host = "offline-queue-full-test"
      fullQueueConf.server.websocket.offlineQueueMaxSize = 1
      const fullQueueClient = new WebSocketClient(fullQueueConf)
      const fullQueueMockServer = new ServerWebSocketMock(fullQueueClient.url)
      fullQueueMockServer.init()
      await fullQueueClient.init()
      await fullQueueClient.close(1000, "simulate-drop")
      const firstPromise = fullQueueClient.addStrokes(strokes)
      const secondPromise = fullQueueClient.addStrokes(strokes)
      await expect(secondPromise).rejects.toThrow("Offline queue full")
      // let the reconnect loop drain the first (still valid) item before teardown
      await delay(200)
      fullQueueMockServer.sendGestureDetectedMessage()
      await expect(firstPromise).toResolve()
      await fullQueueClient.destroy()
      fullQueueMockServer.close()
    })

    test("should emit connectionStatusChanged offline then connected", async () => {
      const spyStatus: jest.SpyInstance = jest.spyOn(wsClient.event, "emitConnectionStatusChanged")
      await wsClient.init()
      await wsClient.close(1000, "simulate-drop")
      const promise = wsClient.addStrokes(strokes)
      await delay(10)
      expect(spyStatus).toHaveBeenCalledWith("offline")
      await delay(200)
      expect(spyStatus).toHaveBeenCalledWith("connected")
      mockServer.sendGestureDetectedMessage()
      await expect(promise).toResolve()
    })

    test("should report offline while disconnected, nothing queued, and online once reconnected", async () => {
      expect(wsClient.isOffline).toBe(false)
      await wsClient.init()
      const [client] = mockServer.server.clients()
      client.close({ code: 1006, reason: "network drop", wasClean: false })
      await delay(10)

      expect(wsClient.isOffline).toBe(true)
      expect(wsClient.offlineQueueLength).toBe(0)

      await wsClient.send({ type: "probe" })
      expect(wsClient.isOffline).toBe(false)
    })

    test("should neither queue nor reconnect when autoReconnect is false", async () => {
      const disabledConf = structuredClone(conf)
      disabledConf.server.host = "offline-queue-disabled-test"
      disabledConf.server.websocket.autoReconnect = false
      const disabledClient = new WebSocketClient(disabledConf)
      const disabledMockServer = new ServerWebSocketMock(disabledClient.url)
      disabledMockServer.init()
      await disabledClient.init()
      await disabledClient.close(1000, "simulate-drop")
      await expect(disabledClient.addStrokes(strokes)).rejects.toThrow()
      expect(disabledClient.offlineQueueLength).toBe(0)
      await disabledClient.destroy()
      disabledMockServer.close()
    })

    // A dropped network shows as 1006, and so does each failed reconnection attempt. Reported as
    // errors, they opened the canvas error modal every few seconds, right over the ink the
    // offline queue is there to keep.
    test("should not report a network drop as an error once connected: the queue keeps the ink", async () => {
      await wsClient.init()
      const spyEmitError: jest.SpyInstance = jest.spyOn(wsClient.event, "emitError")
      const statuses: string[] = []
      wsClient.event.addConnectionStatusChangedListener((status) => statuses.push(status))
      const [client] = mockServer.server.clients()
      client.close({ code: 1006, reason: "network drop", wasClean: false })
      await delay(10)
      expect(spyEmitError).not.toHaveBeenCalled()
      expect(statuses).toContain("offline")
    })

    test("should still report a network drop as an error when autoReconnect is false", async () => {
      const disabledConf = structuredClone(conf)
      disabledConf.server.host = "offline-queue-drop-disabled-test"
      disabledConf.server.websocket.autoReconnect = false
      const disabledClient = new WebSocketClient(disabledConf)
      const disabledMockServer = new ServerWebSocketMock(disabledClient.url)
      disabledMockServer.init()
      await disabledClient.init()
      const spyEmitError: jest.SpyInstance = jest.spyOn(disabledClient.event, "emitError")
      const [client] = disabledMockServer.server.clients()
      client.close({ code: 1006, reason: "network drop", wasClean: false })
      await delay(10)
      expect(spyEmitError).toHaveBeenCalledTimes(1)
      await disabledClient.destroy()
      disabledMockServer.close()
    })

    test("should still report an error the server closes with, network drop aside", async () => {
      await wsClient.init()
      const spyEmitError: jest.SpyInstance = jest.spyOn(wsClient.event, "emitError")
      const [client] = mockServer.server.clients()
      client.close({ code: 1011, reason: ClientError.INTERNAL_ERROR, wasClean: false })
      await delay(10)
      expect(spyEmitError).toHaveBeenCalledTimes(1)
    })

    test("should open only one socket when a direct send() races the offline-queue reconnect loop", async () => {
      // send() used to reconnect on its own, racing the reconnect loop; it now waits for that loop.
      const raceConf = structuredClone(conf)
      raceConf.server.host = "offline-queue-race-test"
      raceConf.server.websocket.autoReconnect = true
      const raceClient = new WebSocketClient(raceConf)
      const raceMockServer = new ServerWebSocketMock(raceClient.url)
      raceMockServer.init()
      await raceClient.init()

      // Close just this one connection abnormally (not code 1000, so closeCallback itself
      // starts the reconnect loop), like an unexpected network drop — the mock server itself
      // stays up so a reconnection attempt can actually succeed.
      const [client] = raceMockServer.server.clients()
      client.close({ code: 1006, reason: "simulate-drop", wasClean: false })
      await delay(10)
      // A request, not a change: it waits for the reconnect loop rather than the queue.
      const sendPromise = raceClient.send({ type: "test", data: "race" }).catch(() => undefined)
      // Let the reconnect-loop attempt (reconnectDelay = 50ms) run.
      await delay(300)
      expect(raceMockServer.server.clients()).toHaveLength(1)
      await sendPromise
      await raceClient.destroy()
      raceMockServer.close()
    })
  })

  describe("replaceStrokes", () => {
    const conf = structuredClone(configuration)
    conf.server.host = "replace-strokes-test"
    let mockServer: ServerWebSocketMock
    let wsClient: WebSocketClient
    const strokes = [buildIIStroke()]
    const oldStrokeIds = ["id-1", "id-2"]

    beforeEach(() => {
      wsClient = new WebSocketClient(conf)
      mockServer = new ServerWebSocketMock(wsClient.url)
      mockServer.init()
    })
    afterEach(async () => {
      await wsClient.destroy()
      mockServer.close()
    })

    test("should not send replaceStrokes message if 0 strokes", async () => {
      expect.assertions(1)
      await wsClient.init()
      await wsClient.replaceStrokes([], [])
      //¯\_(ツ)_/¯  required to wait server received message
      await delay(100)
      const messageSent = JSON.parse(mockServer.getLastMessage() as string)
      await expect(messageSent.type).not.toEqual("replaceStrokes")
    })
    test("should send replaceStrokes message", async () => {
      expect.assertions(1)
      await wsClient.init()
      wsClient.replaceStrokes(oldStrokeIds, strokes)
      //¯\_(ツ)_/¯  required to wait for the instantiation of the promise of the client
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
      await wsClient.init()
      const promise = wsClient.replaceStrokes(oldStrokeIds, strokes)
      //¯\_(ツ)_/¯  required to wait for the instantiation of the promise of the client
      await delay(100)
      mockServer.sendContentChangeMessage()
      await expect(promise).toResolve()
    })
    test.skip("should reject if receive error message", async () => {
      const spyEmitError: jest.SpyInstance = jest.spyOn(wsClient.event, "emitError")
      expect.assertions(3)
      await wsClient.init()
      const promise = wsClient.replaceStrokes(oldStrokeIds, strokes)
      //¯\_(ツ)_/¯  required to wait for the instantiation of the promise of the client
      await delay(100)
      mockServer.sendNotGrantedErrorMessage()
      await expect(promise).rejects.toEqual(ClientError.WRONG_CREDENTIALS)
      await expect(spyEmitError).toHaveBeenCalledTimes(1)
      await expect(spyEmitError).toHaveBeenCalledWith(new Error(ClientError.WRONG_CREDENTIALS))
    })
  })

  describe("transformTranslate", () => {
    const conf = structuredClone(configuration)
    conf.server.host = "transform-translate-test"
    let mockServer: ServerWebSocketMock
    let wsClient: WebSocketClient
    const strokeIds = ["id-1", "id-2"]
    const tx = 5,
      ty = 10

    beforeEach(() => {
      wsClient = new WebSocketClient(conf)
      mockServer = new ServerWebSocketMock(wsClient.url)
      mockServer.init()
    })
    afterEach(async () => {
      await wsClient.destroy()
      mockServer.close()
    })

    test("should not send transformTranslate message if 0 strokes", async () => {
      expect.assertions(1)
      await wsClient.init()
      await wsClient.transformTranslate([], tx, ty)
      //¯\_(ツ)_/¯  required to wait server received message
      await delay(100)
      const messageSent = JSON.parse(mockServer.getLastMessage() as string)
      await expect(messageSent.type).not.toEqual("transformTranslate")
    })
    test("should send transformTranslate message", async () => {
      expect.assertions(1)
      await wsClient.init()
      wsClient.transformTranslate(strokeIds, tx, ty)
      //¯\_(ツ)_/¯  required to wait for the instantiation of the promise of the client
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
      await wsClient.init()
      const promise = wsClient.transformTranslate(strokeIds, tx, ty)
      //¯\_(ツ)_/¯  required to wait for the instantiation of the promise of the client
      await delay(100)
      mockServer.sendContentChangeMessage()
      await expect(promise).toResolve()
    })
    test.skip("should reject if receive error message", async () => {
      const spyEmitError: jest.SpyInstance = jest.spyOn(wsClient.event, "emitError")
      expect.assertions(3)
      await wsClient.init()
      const promise = wsClient.transformTranslate(strokeIds, tx, ty)
      //¯\_(ツ)_/¯  required to wait for the instantiation of the promise of the client
      await delay(100)
      mockServer.sendNotGrantedErrorMessage()
      await expect(promise).rejects.toEqual(ClientError.WRONG_CREDENTIALS)
      await expect(spyEmitError).toHaveBeenCalledTimes(1)
      await expect(spyEmitError).toHaveBeenCalledWith(new Error(ClientError.WRONG_CREDENTIALS))
    })
  })

  describe("transformRotate", () => {
    const conf = structuredClone(configuration)
    conf.server.host = "transform-rotate-test"
    let mockServer: ServerWebSocketMock
    let wsClient: WebSocketClient
    const strokeIds = ["id-1", "id-2"]
    const angle = Math.PI / 2,
      x0 = 10,
      y0 = 20

    beforeEach(() => {
      wsClient = new WebSocketClient(conf)
      mockServer = new ServerWebSocketMock(wsClient.url)
      mockServer.init()
    })
    afterEach(async () => {
      await wsClient.destroy()
      mockServer.close()
    })

    test("should not send transformRotate message if 0 strokes", async () => {
      expect.assertions(1)
      await wsClient.init()
      await wsClient.transformRotate([], angle, x0, y0)
      //¯\_(ツ)_/¯  required to wait server received message
      await delay(100)
      const messageSent = JSON.parse(mockServer.getLastMessage() as string)
      await expect(messageSent.type).not.toEqual("transformRotate")
    })
    test("should send transformRotate message", async () => {
      expect.assertions(1)
      await wsClient.init()
      wsClient.transformRotate(strokeIds, angle, x0, y0)
      //¯\_(ツ)_/¯  required to wait for the instantiation of the promise of the client
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
      await wsClient.init()
      const promise = wsClient.transformRotate(strokeIds, angle, x0, y0)
      //¯\_(ツ)_/¯  required to wait for the instantiation of the promise of the client
      await delay(100)
      mockServer.sendContentChangeMessage()
      await expect(promise).toResolve()
    })
    test.skip("should reject if receive error message", async () => {
      const spyEmitError: jest.SpyInstance = jest.spyOn(wsClient.event, "emitError")
      expect.assertions(3)
      await wsClient.init()
      const promise = wsClient.transformRotate(strokeIds, angle, x0, y0)
      //¯\_(ツ)_/¯  required to wait for the instantiation of the promise of the client
      await delay(100)
      mockServer.sendNotGrantedErrorMessage()
      await expect(promise).rejects.toEqual(ClientError.WRONG_CREDENTIALS)
      await expect(spyEmitError).toHaveBeenCalledTimes(1)
      await expect(spyEmitError).toHaveBeenCalledWith(new Error(ClientError.WRONG_CREDENTIALS))
    })
  })

  describe("transformScale", () => {
    const conf = structuredClone(configuration)
    conf.server.host = "transform-scale-test"
    let mockServer: ServerWebSocketMock
    let wsClient: WebSocketClient
    const strokeIds = ["id-1", "id-2"]
    const scaleX = 2,
      scaleY = 2,
      x0 = 10,
      y0 = 20

    beforeEach(() => {
      wsClient = new WebSocketClient(conf)
      mockServer = new ServerWebSocketMock(wsClient.url)
      mockServer.init()
    })
    afterEach(async () => {
      await wsClient.destroy()
      mockServer.close()
    })

    test("should not send transformScale message if 0 strokes", async () => {
      expect.assertions(1)
      await wsClient.init()
      await wsClient.transformScale([], scaleX, scaleY, x0, y0)
      //¯\_(ツ)_/¯  required to wait server received message
      await delay(100)
      const messageSent = JSON.parse(mockServer.getLastMessage() as string)
      await expect(messageSent.type).not.toEqual("transformScale")
    })
    test("should send transformScale message", async () => {
      expect.assertions(1)
      await wsClient.init()
      wsClient.transformScale(strokeIds, scaleX, scaleY, x0, y0)
      //¯\_(ツ)_/¯  required to wait for the instantiation of the promise of the client
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
      await wsClient.init()
      const promise = wsClient.transformScale(strokeIds, scaleX, scaleY, x0, y0)
      //¯\_(ツ)_/¯  required to wait for the instantiation of the promise of the client
      await delay(100)
      mockServer.sendContentChangeMessage()
      await expect(promise).toResolve()
    })
    test.skip("should reject if receive error message", async () => {
      const spyEmitError: jest.SpyInstance = jest.spyOn(wsClient.event, "emitError")
      expect.assertions(3)
      await wsClient.init()
      const promise = wsClient.transformScale(strokeIds, scaleX, scaleY, x0, y0)
      //¯\_(ツ)_/¯  required to wait for the instantiation of the promise of the client
      await delay(100)
      mockServer.sendNotGrantedErrorMessage()
      await expect(promise).rejects.toEqual(ClientError.WRONG_CREDENTIALS)
      await expect(spyEmitError).toHaveBeenCalledTimes(1)
      await expect(spyEmitError).toHaveBeenCalledWith(new Error(ClientError.WRONG_CREDENTIALS))
    })
  })

  describe("transformMatrix", () => {
    const conf = structuredClone(configuration)
    conf.server.host = "transform-matrix-test"
    let mockServer: ServerWebSocketMock
    let wsClient: WebSocketClient
    const strokeIds = ["id-1", "id-2"]
    const matrix: TMatrixTransform = new MatrixTransform(6, 5, 4, 3, 2, 1)

    beforeEach(() => {
      wsClient = new WebSocketClient(conf)
      mockServer = new ServerWebSocketMock(wsClient.url)
      mockServer.init()
    })
    afterEach(async () => {
      await wsClient.destroy()
      mockServer.close()
    })

    test("should not send transformMatrix message if 0 strokes", async () => {
      expect.assertions(1)
      await wsClient.init()
      await wsClient.transformMatrix([], matrix)
      //¯\_(ツ)_/¯  required to wait server received message
      await delay(100)
      const messageSent = JSON.parse(mockServer.getLastMessage() as string)
      await expect(messageSent.type).not.toEqual("transformMatrix")
    })
    test("should send transformMatrix message", async () => {
      expect.assertions(1)
      await wsClient.init()
      wsClient.transformMatrix(strokeIds, matrix)
      //¯\_(ツ)_/¯  required to wait for the instantiation of the promise of the client
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
      await wsClient.init()
      const promise = wsClient.transformMatrix(strokeIds, matrix)
      //¯\_(ツ)_/¯  required to wait for the instantiation of the promise of the client
      await delay(100)
      mockServer.sendContentChangeMessage()
      await expect(promise).toResolve()
    })
    test.skip("should reject if receive error message", async () => {
      const spyEmitError: jest.SpyInstance = jest.spyOn(wsClient.event, "emitError")
      expect.assertions(3)
      await wsClient.init()
      const promise = wsClient.transformMatrix(strokeIds, matrix)
      //¯\_(ツ)_/¯  required to wait for the instantiation of the promise of the client
      await delay(100)
      mockServer.sendNotGrantedErrorMessage()
      await expect(promise).rejects.toEqual(ClientError.WRONG_CREDENTIALS)
      await expect(spyEmitError).toHaveBeenCalledTimes(1)
      await expect(spyEmitError).toHaveBeenCalledWith(new Error(ClientError.WRONG_CREDENTIALS))
    })
  })

  describe("eraseStrokes", () => {
    const conf = structuredClone(configuration)
    conf.server.host = "erase-strokes-test"
    let mockServer: ServerWebSocketMock
    let wsClient: WebSocketClient
    const strokeIds = ["erase-1"]

    beforeEach(() => {
      wsClient = new WebSocketClient(conf)
      mockServer = new ServerWebSocketMock(wsClient.url)
      mockServer.init()
    })
    afterEach(async () => {
      await wsClient.destroy()
      mockServer.close()
    })

    test("should not send eraseStrokes message if 0 strokes", async () => {
      expect.assertions(1)
      await wsClient.init()
      await wsClient.eraseStrokes([])
      //¯\_(ツ)_/¯  required to wait server received message
      await delay(100)
      const messageSent = JSON.parse(mockServer.getLastMessage() as string)
      await expect(messageSent.type).not.toEqual("eraseStrokes")
    })
    test("should send eraseStrokes message", async () => {
      expect.assertions(1)
      await wsClient.init()
      wsClient.eraseStrokes(strokeIds)
      //¯\_(ツ)_/¯  required to wait for the instantiation of the promise of the client
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
      await wsClient.init()
      const promise = wsClient.eraseStrokes(strokeIds)
      //¯\_(ツ)_/¯  required to wait for the instantiation of the promise of the client
      await delay(100)
      mockServer.sendContentChangeMessage()
      await expect(promise).toResolve()
    })
    test.skip("should reject if receive error message", async () => {
      const spyEmitError: jest.SpyInstance = jest.spyOn(wsClient.event, "emitError")
      expect.assertions(3)
      await wsClient.init()
      const promise = wsClient.eraseStrokes(strokeIds)
      //¯\_(ツ)_/¯  required to wait for the instantiation of the promise of the client
      await delay(100)
      mockServer.sendNotGrantedErrorMessage()
      await expect(promise).rejects.toEqual(ClientError.WRONG_CREDENTIALS)
      await expect(spyEmitError).toHaveBeenCalledTimes(1)
      await expect(spyEmitError).toHaveBeenCalledWith(new Error(ClientError.WRONG_CREDENTIALS))
    })
  })

  describe("recognizeGesture", () => {
    const conf = structuredClone(configuration)
    conf.server.host = "recognize-gesture-test"
    let mockServer: ServerWebSocketMock
    let wsClient: WebSocketClient
    const stroke = buildIIStroke()

    beforeEach(() => {
      wsClient = new WebSocketClient(conf)
      mockServer = new ServerWebSocketMock(wsClient.url)
      mockServer.init()
    })
    afterEach(async () => {
      await wsClient.destroy()
      mockServer.close()
    })

    test("should not send recognizeGesture message if 0 strokes", async () => {
      expect.assertions(1)
      await wsClient.init()
      //@ts-ignore
      await wsClient.recognizeGesture()
      //¯\_(ツ)_/¯  required to wait server received message
      await delay(100)
      const messageSent = JSON.parse(mockServer.getLastMessage() as string)
      await expect(messageSent.type).not.toEqual("recognizeGesture")
    })
    test("should send recognizeGesture message", async () => {
      expect.assertions(1)
      await wsClient.init()
      wsClient.recognizeGesture(stroke)
      //¯\_(ツ)_/¯  required to wait for the instantiation of the promise of the client
      await delay(100)
      const messageSent = JSON.parse(mockServer.getLastMessage() as string)
      const messageSentExpected = {
        type: "contextlessGesture",
        stroke: toWireStroke(stroke),
      }
      await expect(messageSent).toMatchObject(messageSentExpected)
    })
    test("should resolve recognizeGesture when received contextlessGesture", async () => {
      expect.assertions(1)
      await wsClient.init()
      stroke.id = contextlessGestureMessage.strokeId
      const promise = wsClient.recognizeGesture(stroke)
      //¯\_(ツ)_/¯  required to wait for the instantiation of the promise of the client
      await delay(100)
      mockServer.sendContextlessGestureMessage()
      await expect(promise).toResolve()
    })
    test.skip("should reject if receive error message", async () => {
      const spyEmitError: jest.SpyInstance = jest.spyOn(wsClient.event, "emitError")
      expect.assertions(3)
      await wsClient.init()
      const promise = wsClient.recognizeGesture(stroke)
      //¯\_(ツ)_/¯  required to wait for the instantiation of the promise of the client
      await delay(100)
      mockServer.sendNotGrantedErrorMessage()
      await expect(promise).rejects.toEqual(ClientError.WRONG_CREDENTIALS)
      await expect(spyEmitError).toHaveBeenCalledTimes(1)
      await expect(spyEmitError).toHaveBeenCalledWith(new Error(ClientError.WRONG_CREDENTIALS))
    })
  })

  describe("waitForIdle", () => {
    const conf = structuredClone(configuration)
    conf.server.host = "wait-for-idle-test"
    let mockServer: ServerWebSocketMock
    let wsClient: WebSocketClient

    beforeEach(() => {
      wsClient = new WebSocketClient(conf)
      mockServer = new ServerWebSocketMock(wsClient.url)
      mockServer.init({ withIdle: false })
    })
    afterEach(async () => {
      await wsClient.destroy()
      mockServer.close()
    })

    test("should send waitForIdle & resolve when receive idle message", async () => {
      expect.assertions(2)
      await wsClient.init()
      const promise = wsClient.waitForIdle()
      //¯\_(ツ)_/¯  required to wait server received message
      await delay(100)
      const wfiMessageSent = mockServer.getLastMessage()
      expect(wfiMessageSent).toEqual(JSON.stringify({ type: "waitForIdle" }))
      //¯\_(ツ)_/¯  required to wait for the instantiation of the promise of the client
      await delay(100)
      mockServer.send(JSON.stringify({ type: "idle" }))
      await delay(100)
      await expect(promise).resolves.toBeUndefined()
    })
    test.skip("should reject if receive error message", async () => {
      const spyEmitError: jest.SpyInstance = jest.spyOn(wsClient.event, "emitError")
      expect.assertions(3)
      await wsClient.init()
      const promise = wsClient.waitForIdle()
      //¯\_(ツ)_/¯  required to wait for the instantiation of the promise of the client
      await delay(100)
      mockServer.sendNotGrantedErrorMessage()
      await expect(promise).rejects.toEqual(ClientError.WRONG_CREDENTIALS)
      await expect(spyEmitError).toHaveBeenCalledTimes(1)
      await expect(spyEmitError).toHaveBeenCalledWith(new Error(ClientError.WRONG_CREDENTIALS))
    })
  })

  describe("undo", () => {
    const conf = structuredClone(configuration)
    conf.server.host = "undo-test"
    let mockServer: ServerWebSocketMock
    let wsClient: WebSocketClient

    beforeEach(() => {
      wsClient = new WebSocketClient(conf)
      mockServer = new ServerWebSocketMock(wsClient.url)
      mockServer.init()
    })
    afterEach(async () => {
      await wsClient.destroy()
      mockServer.close()
    })

    test("should not send message if no changes", async () => {
      expect.assertions(2)
      await wsClient.init()
      wsClient.send = jest.fn()
      wsClient.undo({})
      await delay(100)
      expect(wsClient.send).toHaveBeenCalledTimes(0)
      const changes: TIIHistoryBackendChanges = { added: [buildIIStroke()] }
      wsClient.undo(changes)
      await delay(100)
      expect(wsClient.send).toHaveBeenCalledTimes(1)
    })
    test("should send undo message with changes", async () => {
      await wsClient.init()
      const changes: TIIHistoryBackendChanges = {
        added: [buildIIStroke()],
        erased: [buildIIStroke()],
        replaced: { newStrokes: [buildIIStroke()], oldStrokes: [buildIIStroke()] },
      }
      wsClient.undo(changes)
      //¯\_(ツ)_/¯  required to wait for the instantiation of the promise of the client
      await delay(100)
      const messageSent = JSON.parse(mockServer.getLastMessage() as string)
      expect(messageSent.type).toEqual("undo")
      expect(messageSent.changes).toHaveLength(Object.keys(changes).length)
      expect(messageSent.changes).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: "addStrokes",
          }),
        ])
      )
      expect(messageSent.changes).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: "replaceStrokes",
          }),
        ])
      )
      // No transform message reaches the server on undo any more. A transform is recorded as a
      // before/after pair like every other change, and a pair travels as a stroke replacement —
      // the wire form carries the moved coordinates, since the serializer bakes the matrix in.
      expect(
        messageSent.changes.filter((change: { type?: string }) => change.type === "transform")
      ).toEqual([])
    })
    test("should resolve undo when received contentChanged", async () => {
      expect.assertions(1)
      await wsClient.init()
      const changes: TIIHistoryBackendChanges = { added: [buildIIStroke()] }
      const promise = wsClient.undo(changes)
      //¯\_(ツ)_/¯  required to wait for the instantiation of the promise of the client
      await delay(100)
      mockServer.sendContentChangeMessage()
      await expect(promise).toResolve()
    })
    test.skip("should reject if receive error message", async () => {
      const spyEmitError: jest.SpyInstance = jest.spyOn(wsClient.event, "emitError")
      expect.assertions(3)
      await wsClient.init()
      const changes: TIIHistoryBackendChanges = { added: [buildIIStroke()] }
      const promise = wsClient.undo(changes)
      //¯\_(ツ)_/¯  required to wait for the instantiation of the promise of the client
      await delay(100)
      mockServer.sendNotGrantedErrorMessage()
      await expect(promise).rejects.toEqual(ClientError.WRONG_CREDENTIALS)
      expect(spyEmitError).toHaveBeenCalledTimes(1)
      expect(spyEmitError).toHaveBeenCalledWith(new Error(ClientError.WRONG_CREDENTIALS))
    })
  })

  describe("redo", () => {
    const conf = structuredClone(configuration)
    conf.server.host = "redo-test"
    let mockServer: ServerWebSocketMock
    let wsClient: WebSocketClient

    beforeEach(() => {
      wsClient = new WebSocketClient(conf)
      mockServer = new ServerWebSocketMock(wsClient.url)
      mockServer.init()
    })
    afterEach(async () => {
      await wsClient.destroy()
      mockServer.close()
    })

    test("should send redo message", async () => {
      expect.assertions(1)
      await wsClient.init()
      const changes: TIIHistoryBackendChanges = { added: [buildIIStroke()] }
      wsClient.redo(changes)
      //¯\_(ツ)_/¯  required to wait for the instantiation of the promise of the client
      await delay(100)
      const messageSent = JSON.parse(mockServer.getLastMessage() as string)
      const messageSentExpected = { type: "redo" }
      await expect(messageSent).toMatchObject(messageSentExpected)
    })
    test("should resolve redo when received contentChanged", async () => {
      expect.assertions(1)
      await wsClient.init()
      const changes: TIIHistoryBackendChanges = { added: [buildIIStroke()] }
      const promise = wsClient.redo(changes)
      //¯\_(ツ)_/¯  required to wait for the instantiation of the promise of the client
      await delay(100)
      mockServer.sendContentChangeMessage()
      await expect(promise).toResolve()
    })
    test.skip("should reject if receive error message", async () => {
      const spyEmitError: jest.SpyInstance = jest.spyOn(wsClient.event, "emitError")
      expect.assertions(3)
      await wsClient.init()
      const changes: TIIHistoryBackendChanges = { added: [buildIIStroke()] }
      const promise = wsClient.redo(changes)
      //¯\_(ツ)_/¯  required to wait for the instantiation of the promise of the client
      await delay(100)
      mockServer.sendNotGrantedErrorMessage()
      await expect(promise).rejects.toEqual(ClientError.WRONG_CREDENTIALS)
      await expect(spyEmitError).toHaveBeenCalledTimes(1)
      await expect(spyEmitError).toHaveBeenCalledWith(new Error(ClientError.WRONG_CREDENTIALS))
    })
  })

  describe("clear", () => {
    const conf = structuredClone(configuration)
    conf.server.host = "clear-test"
    let mockServer: ServerWebSocketMock
    let wsClient: WebSocketClient

    beforeEach(() => {
      wsClient = new WebSocketClient(conf)
      mockServer = new ServerWebSocketMock(wsClient.url)
      mockServer.init()
    })
    afterEach(async () => {
      await wsClient.destroy()
      mockServer.close()
    })

    test("should send clear message", async () => {
      expect.assertions(1)
      await wsClient.init()
      wsClient.clear()
      //¯\_(ツ)_/¯  required to wait for the instantiation of the promise of the client
      await delay(100)
      const messageSent = JSON.parse(mockServer.getLastMessage() as string)
      const messageSentExpected = { type: "clear" }
      await expect(messageSent).toMatchObject(messageSentExpected)
    })
    test("should resolve clear when received contentChanged", async () => {
      expect.assertions(1)
      await wsClient.init()
      const promise = wsClient.clear()
      //¯\_(ツ)_/¯  required to wait for the instantiation of the promise of the client
      await delay(100)
      mockServer.sendContentChangeMessage()
      await expect(promise).toResolve()
    })
    test.skip("should reject if receive error message", async () => {
      const spyEmitError: jest.SpyInstance = jest.spyOn(wsClient.event, "emitError")
      expect.assertions(3)
      await wsClient.init()
      const promise = wsClient.clear()
      //¯\_(ツ)_/¯  required to wait for the instantiation of the promise of the client
      await delay(100)
      mockServer.sendNotGrantedErrorMessage()
      await expect(promise).rejects.toEqual(ClientError.WRONG_CREDENTIALS)
      await expect(spyEmitError).toHaveBeenCalledTimes(1)
      await expect(spyEmitError).toHaveBeenCalledWith(new Error(ClientError.WRONG_CREDENTIALS))
    })
  })

  describe("export", () => {
    const conf = structuredClone(configuration)
    conf.server.host = "export-test"
    let mockServer: ServerWebSocketMock
    let wsClient: WebSocketClient

    beforeEach(() => {
      wsClient = new WebSocketClient(conf)
      mockServer = new ServerWebSocketMock(wsClient.url)
      mockServer.init()
    })
    afterEach(async () => {
      await wsClient.destroy()
      mockServer.close()
    })

    test("should send export", async () => {
      await wsClient.init()
      const promise = wsClient.export()
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
      //¯\_(ツ)_/¯  required to wait for the instantiation of the promise of the client
      await delay(100)
      mockServer.sendHExportMessage()
      expect(exportMessageSent).toContain(exportmessageSentExpected)
      await expect(promise).resolves.toEqual(
        expect.objectContaining({
          "application/vnd.myscript.jiix": hTextJIIX,
        })
      )
      wsClient.destroy()
    })
    test("should resolve every export of concurrent calls for the same mime type", async () => {
      // The bug this guards: both calls waited on the same previous export, then each stored its
      // own pending answer under the same mime type, the second overwriting the first. The server
      // answers resolved the second twice and the first never — a synchronizer awaiting it hung
      // for the rest of the session.
      await wsClient.init()
      const settled = (promise: Promise<unknown>) =>
        Promise.race([promise.then(() => "resolved"), delay(1000).then(() => "pending")])
      const first = settled(wsClient.export())
      const second = settled(wsClient.export())
      //¯\_(ツ)_/¯  required to wait server received message
      await delay(100)
      mockServer.sendHExportMessage()
      await delay(100)
      mockServer.sendHExportMessage()

      await expect(Promise.all([first, second])).resolves.toEqual(["resolved", "resolved"])
      expect(mockServer.getMessages("export")).toHaveLength(2)
    })
    test("should not replay into the next session a message sent while the previous one closes", async () => {
      await wsClient.init()
      const closing = wsClient.close(1000, "new-session")
      const sending = wsClient.send({ type: "export", partId: "part-of-the-closing-session", mimeTypes: [] })
      await closing
      await wsClient.init()

      await expect(sending).resolves.toBeUndefined()
      //¯\_(ツ)_/¯  required to wait server received message
      await delay(100)
      expect(mockServer.getMessages("export")).toHaveLength(0)
    })
    test("should resolve when receive fileChunckAck message", async () => {
      expect.assertions(1)

      await wsClient.init()
      const promise = wsClient.export()
      //¯\_(ツ)_/¯  required to wait for the instantiation of the promise of the client
      await delay(100)
      mockServer.sendHExportMessage()
      await expect(promise).resolves.toEqual(
        expect.objectContaining({
          "application/vnd.myscript.jiix": hTextJIIX,
        })
      )
      wsClient.destroy()
    })
    test.skip("should reject if receive error message", async () => {
      const spyEmitError: jest.SpyInstance = jest.spyOn(wsClient.event, "emitError")
      expect.assertions(3)
      await wsClient.init()
      const promise = wsClient.export()
      //¯\_(ツ)_/¯  required to wait for the instantiation of the promise of the client
      await delay(100)
      mockServer.sendNotGrantedErrorMessage()
      await expect(promise).rejects.toEqual(ClientError.WRONG_CREDENTIALS)
      await expect(spyEmitError).toHaveBeenCalledTimes(1)
      await expect(spyEmitError).toHaveBeenCalledWith(new Error(ClientError.WRONG_CREDENTIALS))
    })
  })

  describe("sendToSupport", () => {
    const conf = structuredClone(configuration)
    conf.server.host = "send-to-support-test"
    let mockServer: ServerWebSocketMock
    let wsClient: WebSocketClient

    beforeEach(() => {
      wsClient = new WebSocketClient(conf)
      mockServer = new ServerWebSocketMock(wsClient.url)
      mockServer.init()
    })
    afterEach(async () => {
      await wsClient.destroy()
      mockServer.close()
    })

    test("should send ackSendToSupport message with given data", async () => {
      expect.assertions(1)
      await wsClient.init()
      wsClient.sendToSupport({ ticketId: "TICKET-123", comment: "help" })
      //¯\_(ツ)_/¯  required to wait server received message
      await delay(100)
      const messageSent = JSON.parse(mockServer.getLastMessage() as string)
      expect(messageSent).toEqual({
        type: "sendToSupport",
        metadata: {
          ticketId: "TICKET-123",
          comment: "help",
        },
      })
    })
    test("should resolve when receiving ack", async () => {
      expect.assertions(1)
      await wsClient.init()
      const promise = wsClient.sendToSupport({ ticketId: "TICKET-123" })
      //¯\_(ツ)_/¯  required to wait for the instantiation of the promise of the client
      await delay(100)
      mockServer.sendAckMessage()
      await expect(promise).toResolve()
    })
    test("should resolve concurrent calls in the order they were sent", async () => {
      expect.assertions(3)
      await wsClient.init()
      const firstPromise = wsClient.sendToSupport({ ticketId: "FIRST" })
      const secondPromise = wsClient.sendToSupport({ ticketId: "SECOND" })
      //¯\_(ツ)_/¯  required to wait for the instantiation of the promise of the client
      await delay(100)

      const order: string[] = []
      firstPromise.then(() => order.push("first"))
      secondPromise.then(() => order.push("second"))

      mockServer.sendAckMessage()
      await delay(50)
      expect(order).toEqual(["first"])

      mockServer.sendAckMessage()
      await delay(50)
      expect(order).toEqual(["first", "second"])

      await expect(Promise.all([firstPromise, secondPromise])).toResolve()
    })
  })

  describe("math solver", () => {
    const conf = structuredClone(configuration)
    conf.server.host = "math-solver-test"
    let mockServer: ServerWebSocketMock
    let wsClient: WebSocketClient

    const sendResult = (result: Record<string, unknown>) =>
      mockServer.send(JSON.stringify({ type: "mathSolverResult", ...result }))

    beforeEach(() => {
      wsClient = new WebSocketClient(conf)
      mockServer = new ServerWebSocketMock(wsClient.url)
      mockServer.init()
    })
    afterEach(async () => {
      await wsClient.destroy()
      mockServer.close()
    })

    test("should send the action with its parameters", async () => {
      await wsClient.init()
      wsClient.getVariableValue("block-1", "x")
      //¯\_(ツ)_/¯  required to wait server received message
      await delay(50)
      expect(JSON.parse(mockServer.getLastMessage() as string)).toEqual({
        type: "mathSolver",
        action: "get-variable-value",
        blockId: "block-1",
        variableName: "x",
      })
    })

    test("should resolve a request with the result of the same action and block", async () => {
      await wsClient.init()
      const promise = wsClient.getVariables("block-1")
      //¯\_(ツ)_/¯  required to wait for the instantiation of the promise of the client
      await delay(50)
      sendResult({ action: "get-variables", blockId: "block-2", result: [{ name: "y" }] })
      sendResult({ action: "get-diagnostic", blockId: "block-1", result: "ok" })
      sendResult({ action: "get-variables", blockId: "block-1", result: [{ name: "x" }] })
      await expect(promise).resolves.toEqual([{ name: "x" }])
    })

    test("should resolve get-variable-definitions, which is tied to no block", async () => {
      await wsClient.init()
      const promise = wsClient.getVariableDefinitions()
      //¯\_(ツ)_/¯  required to wait for the instantiation of the promise of the client
      await delay(50)
      sendResult({ action: "get-variable-definitions", result: [{ name: "x", definitions: [] }] })
      await expect(promise).resolves.toEqual([{ name: "x", definitions: [] }])
    })

    test("should resolve two concurrent evaluate calls on the same block", async () => {
      await wsClient.init()
      const evaluation = { inputVariableName: "x", outputVariableName: "y", from: 0, to: 1, pointCount: 2 }
      const first = wsClient.evaluate("block-1", evaluation)
      const second = wsClient.evaluate("block-1", evaluation)
      //¯\_(ツ)_/¯  required to wait for the instantiation of the promise of the client
      await delay(50)
      sendResult({ action: "evaluate", blockId: "block-1", result: [[0, 1]] })
      await expect(first).resolves.toEqual([[{ x: 0, y: 1 }]])
      sendResult({ action: "evaluate", blockId: "block-1", result: [[0, 2]] })
      await expect(second).resolves.toEqual([[{ x: 0, y: 2 }]])
    })

    test("should reject pending requests when the server closes abnormally", async () => {
      await wsClient.init()
      jest.spyOn(wsClient.event, "emitError").mockImplementation(() => undefined)
      const pending = [
        wsClient.getVariables("block-1"),
        wsClient.getVariableDefinitions(),
        wsClient.sendToSupport({ ticketId: "TICKET-1" }),
      ]
      //¯\_(ツ)_/¯  required to wait for the instantiation of the promise of the client
      await delay(50)
      const [client] = mockServer.server.clients()
      client.close({ code: 1011, reason: ClientError.INTERNAL_ERROR, wasClean: false })
      const settled = await Promise.allSettled(pending)
      expect(settled.map((s) => s.status)).toEqual(["rejected", "rejected", "rejected"])
    })

    test("should not let a request that was never sent take the answer to the next one", async () => {
      await expect(wsClient.getVariables("block-1")).rejects.toThrow()
      await wsClient.init()
      const promise = wsClient.getVariables("block-1")
      //¯\_(ツ)_/¯  required to wait for the instantiation of the promise of the client
      await delay(50)
      sendResult({ action: "get-variables", blockId: "block-1", result: [{ name: "x" }] })
      await expect(promise).resolves.toEqual([{ name: "x" }])
    })

    test("should settle pending requests with a neutral value on a deliberate close", async () => {
      await wsClient.init()
      const variables = wsClient.getVariables("block-1")
      const value = wsClient.getVariableValue("block-1", "x")
      const definitions = wsClient.getVariableDefinitions()
      //¯\_(ツ)_/¯  required to wait for the instantiation of the promise of the client
      await delay(50)
      await wsClient.close(1000, "new-session")
      await expect(variables).resolves.toEqual([])
      await expect(value).resolves.toBeNaN()
      await expect(definitions).resolves.toEqual([])
    })
  })

  describe("Connection lost", () => {
    const conf = structuredClone(configuration)
    conf.server.host = "close-test"
    let mockServer: ServerWebSocketMock
    let wsClient: WebSocketClient

    beforeEach(() => {
      wsClient = new WebSocketClient(conf)
      mockServer = new ServerWebSocketMock(wsClient.url)
      mockServer.init()
    })
    afterEach(async () => {
      await wsClient.destroy()
      mockServer.close()
    })

    const closeMessageOptions = [
      { code: 1001, message: ClientError.GOING_AWAY },
      { code: 1002, message: ClientError.PROTOCOL_ERROR },
      { code: 1003, message: ClientError.UNSUPPORTED_DATA },
      // 1006 once connected is a network drop the offline queue recovers from: see "offline queue"
      { code: 1007, message: ClientError.INVALID_FRAME_PAYLOAD },
      { code: 1008, message: ClientError.POLICY_VIOLATION },
      { code: 1009, message: ClientError.MESSAGE_TOO_BIG },
      { code: 1011, message: ClientError.INTERNAL_ERROR },
      { code: 1012, message: ClientError.SERVICE_RESTART },
      { code: 1013, message: ClientError.TRY_AGAIN },
      { code: 1014, message: ClientError.BAD_GATEWAY },
      { code: 1015, message: ClientError.TLS_HANDSHAKE },
      { code: 42, message: ClientError.CANT_ESTABLISH },
    ]
    closeMessageOptions.forEach(async (closeEvent) => {
      test(`should emit error if the server closes the connection abnormally code == ${closeEvent.code}`, async () => {
        const spyEmitError: jest.SpyInstance = jest.spyOn(wsClient.event, "emitError")
        expect.assertions(2)
        await wsClient.init()
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
      const wsClient = new WebSocketClient(conf)
      mockServer = new ServerWebSocketMock(wsClient.url)
      mockServer.init()
      await wsClient.init()

      // 1 -> OPEN
      await expect(mockServer.server.clients()[0].readyState).toEqual(1)
      wsClient.destroy()
      // 2 -> CLOSING
      await expect(mockServer.server.clients()[0].readyState).toEqual(2)
      mockServer.close()
    })
  })

  describe("pending requests", () => {
    class PendingClient extends WebSocketClient {
      failAll(error: string): void {
        this.rejectDeferredPending(error)
      }
      answerAllNeutrally(): void {
        this.resolveDeferredPending()
      }
      forgetAll(): void {
        this.resetAllDeferred()
      }
    }

    /** One request of every kind left waiting on an answer the server never sends. */
    const startEveryKind = (wsClient: PendingClient) => {
      jest.spyOn(wsClient, "send").mockResolvedValue()
      return {
        initialized: wsClient.initialized.promise,
        gesture: wsClient.recognizeGesture(buildIIStroke()),
        exported: wsClient.export(),
        idle: wsClient.waitForIdle(),
        math: wsClient.getVariables("block-1"),
        support: wsClient.sendToSupport({ note: "x" }),
      }
    }

    test("should reject every kind of pending request on an error", async () => {
      const wsClient = new PendingClient(structuredClone(configuration))
      const pending = startEveryKind(wsClient)
      await delay(0)

      wsClient.failAll("boom")

      for (const promise of Object.values(pending)) {
        await expect(promise).rejects.toBe("boom")
      }
    })

    test("should answer every kind of pending request neutrally on a deliberate close", async () => {
      const wsClient = new PendingClient(structuredClone(configuration))
      const pending = startEveryKind(wsClient)
      await delay(0)

      wsClient.answerAllNeutrally()

      await expect(pending.initialized).resolves.toBeUndefined()
      await expect(pending.gesture).resolves.toMatchObject({ gestureType: "none" })
      await expect(pending.exported).resolves.toEqual({})
      await expect(pending.idle).resolves.toBeUndefined()
      await expect(pending.math).resolves.toEqual([])
      await expect(pending.support).resolves.toBeUndefined()
    })

    test("should forget every pending request on reset", async () => {
      const wsClient = new PendingClient(structuredClone(configuration))
      const previousInit = wsClient.initialized
      startEveryKind(wsClient)
      await delay(0)

      wsClient.forgetAll()

      expect(wsClient.initialized).not.toBe(previousInit)
      // A late answer from the server settles nothing once forgotten
      wsClient.answerAllNeutrally()
      await expect(wsClient.initialized.promise).resolves.toBeUndefined()
    })
  })

  describe("ping", () => {
    class PingWebSocketClient extends WebSocketClient {
      startPing(): void {
        this.initPing()
      }
      get currentPingWorker(): Worker | undefined {
        return this.pingWorker
      }
    }

    test("should terminate the previous ping worker before starting a new one", () => {
      const wsClient = new PingWebSocketClient(structuredClone(configuration))
      wsClient.startPing()
      const firstWorker = wsClient.currentPingWorker
      wsClient.startPing()
      expect(firstWorker?.terminate).toHaveBeenCalledTimes(1)
      expect(wsClient.currentPingWorker).not.toBe(firstWorker)
    })
  })
})
