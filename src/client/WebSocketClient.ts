import PingWorker from "web-worker:../worker/ping.worker.ts"

import type { THistoryContext, TIIHistoryBackendChanges } from "@/history"
import { LoggerCategory, LoggerManager } from "@/logger"
import type { TExport, TJIIXExport, TJIIXMathElement } from "@/model"
import type { TStroke } from "@/symbol"
import { StrokeOps } from "@/symbol/stroke/Stroke"
import type { TMatrixTransform } from "@/transform"
import type { TPartialDeep } from "@/utils"
import { computeHmac, DeferredPromise, getApiInfos, isVersionSuperiorOrEqual, mergeDeep } from "@/utils"

import { ClientError, mapCloseCodeToMessage } from "./ClientError"
import { ClientEvent } from "./ClientEvent"
import type { TWebSocketClientConfiguration } from "./WebSocketClientConfiguration"
import { WebSocketClientConfiguration } from "./WebSocketClientConfiguration"
import type {
  TInteractiveInkSessionDescriptionMessage,
  TMathEvaluable,
  TMathVariable,
  TMathVariableDefinition,
  TMathVariableDefinitions,
  TWebSocketClientMessage,
  TWebSocketClientMessageContentChange,
  TWebSocketClientMessageContextlessGesture,
  TWebSocketClientMessageError,
  TWebSocketClientMessageExport,
  TWebSocketClientMessageGesture,
  TWebSocketClientMessageHMACChallenge,
  TWebSocketClientMessageMathSolverResult,
  TWebSocketClientMessageNewPart,
  TWebSocketClientMessagePartChange,
  TWebSocketClientMessageReceived,
} from "./WebSocketClientMessage"
import { TWebSocketClientMessageType } from "./WebSocketClientMessage"

/**
 * A websocket dialog have this sequence :
 * --------------- Client --------------------------------------------------------------- Server ---------------
 * { type: "authenticate" }                           ==================>
 *                                                    <==================       { type: "hmacChallenge" }
 * { type: "hmac" }                                   ==================>
 *                                                    <==================       { type: "authenticated" }
 * { type: "initSession" | "restoreSession" }         ==================>
 *                                                    <==================       { type: "sessionDescription" }
 * { type: "sendToSupport", [key]:[value] }        ==================>
 *                                                    <==================        { type: "ack" }
 * { type: "newContentPart" | "openContentPart" }     ==================>
 *                                                    <==================       { type: "partChanged" }
 * { type: "addStrokes" }                             ==================>
 *                                                    <==================       { type: "contentChanged" }
 * { type: "transform" }                              ==================>
 *                                                    <==================       { type: "contentChanged" }
 * { type: "eraseStrokes" }                           ==================>
 *                                                    <==================       { type: "contentChanged" }
 */

/**
 * @group Client
 */
export class WebSocketClient {
  #logger = LoggerManager.getLogger(LoggerCategory.CLIENT)

  protected socket!: WebSocket
  protected pingWorker?: Worker
  protected pingCount = 0
  protected reconnectionCount = 0
  protected sessionId?: string

  protected boundOpenCallback: () => void
  protected boundCloseCallback: (evt: CloseEvent) => void
  protected boundMessageCallback: (message: MessageEvent<string>) => void
  protected currentPartId?: string
  protected currentErrorCode?: string | number

  protected contextlessGestureDeferred: Map<string, DeferredPromise<TWebSocketClientMessageContextlessGesture>>
  protected exportDeferredMap: Map<string, DeferredPromise<TExport>>
  protected closeDeferred?: DeferredPromise<void>
  protected waitForIdleDeferred?: DeferredPromise<void>
  protected availableActionsDeferred: Map<string, DeferredPromise<string[]>[]>
  protected numericalComputationDeferred: Map<string, DeferredPromise<string>[]>
  protected getDiagnosticDeferred: Map<string, DeferredPromise<string>[]>
  protected getVariablesDeferred: Map<string, DeferredPromise<TMathVariable[]>[]>
  protected setVariableValueDeferred: Map<string, DeferredPromise<void>[]>
  protected getVariableValueDeferred: Map<string, DeferredPromise<number>[]>
  protected removeVariableValueDeferred: Map<string, DeferredPromise<void>[]>
  protected asVariableDefinitionDeferred: Map<string, DeferredPromise<TMathVariableDefinition>[]>
  protected getVariableDefinitionsDeferred: DeferredPromise<TMathVariableDefinitions[]>[]
  protected getEvaluablesDeferred: Map<string, DeferredPromise<TMathEvaluable[]>[]>
  protected evaluateDeferred: Map<string, DeferredPromise<number[][]>[]>
  protected sendToSupportDeferred: DeferredPromise<void>[]

  // Resolved once the queued message is actually sent (post-reconnect), not once any server ack
  // arrives — mutating calls (addStrokes, undo, etc.) never wait for a server ack; there's no
  // correlation id on "contentChanged"/"gestureDetected" to safely match one to a specific call.
  #offlineQueue: {
    message: TWebSocketClientMessage
    deferred: DeferredPromise<void>
  }[] = []
  #reconnectTimer?: ReturnType<typeof setTimeout>
  #reconnectAttempts = 0
  // Guards against concurrent init() calls: the offline-queue reconnect loop and the legacy
  // auto-reconnect in `send()` can both observe a closed socket and call init() around the same
  // time. Without this, each would create its own `new WebSocket()`, leaving two live sockets
  // with only the last one referenced by `this.socket`.
  #connectingPromise: Promise<void> | null = null
  // Set for the duration of a deliberate `close()` (e.g. `newSession()` switching language).
  // `send()`'s legacy auto-reconnect must wait for this instead of racing its own `init()` against
  // the one `newSession()` issues right after — starting a second socket before the first one's
  // close handshake completes has left the server never answering on either connection.
  #closingPromise: Promise<void> | null = null

  configuration: WebSocketClientConfiguration
  initialized: DeferredPromise<void>
  url: string
  event: ClientEvent

  constructor(config: TPartialDeep<TWebSocketClientConfiguration>, event?: ClientEvent) {
    this.#logger.info("constructor", { config })
    this.configuration = new WebSocketClientConfiguration(config)
    const scheme = this.configuration.server.scheme === "https" ? "wss" : "ws"
    this.url = `${scheme}://${this.configuration.server.host}/api/v4.0/iink/offscreen?applicationKey=${this.configuration.server.applicationKey}`

    this.event = event || new ClientEvent()
    this.initialized = new DeferredPromise<void>()
    this.boundOpenCallback = this.openCallback.bind(this)
    this.boundCloseCallback = this.closeCallback.bind(this)
    this.boundMessageCallback = this.messageCallback.bind(this)
    this.exportDeferredMap = new Map()
    this.contextlessGestureDeferred = new Map()
    this.availableActionsDeferred = new Map()
    this.numericalComputationDeferred = new Map()
    this.getDiagnosticDeferred = new Map()
    this.getVariablesDeferred = new Map()
    this.setVariableValueDeferred = new Map()
    this.getVariableValueDeferred = new Map()
    this.removeVariableValueDeferred = new Map()
    this.asVariableDefinitionDeferred = new Map()
    this.getVariableDefinitionsDeferred = []
    this.getEvaluablesDeferred = new Map()
    this.evaluateDeferred = new Map()
    this.sendToSupportDeferred = []
  }

  get mimeTypes(): string[] {
    return ["application/vnd.myscript.jiix"]
  }

  /**
   * Number of addStrokes batches currently queued locally while disconnected.
   */
  get offlineQueueLength(): number {
    return this.#offlineQueue.length
  }

  /**
   * True while strokes are queued locally waiting for reconnection (see `server.websocket.offlineQueueEnabled`).
   */
  get isOffline(): boolean {
    return this.offlineQueueLength > 0
  }

  async #send(message: TWebSocketClientMessage): Promise<void> {
    if (!this.socket) {
      throw new Error("Client must be initilized")
    }
    if (this.socket.readyState === this.socket.OPEN) {
      this.socket.send(JSON.stringify(message))
    } else {
      throw new Error(`Can not send message: ${message.type}, connection not ready, state: ${this.socket.readyState}`)
    }
  }

  protected rejectDeferredPending(error: Error | string): void {
    this.initialized.reject(error)
    Array.from(this.contextlessGestureDeferred.values()).forEach((v) => {
      v.reject(error)
    })
    Array.from(this.exportDeferredMap.values()).forEach((v) => {
      v.reject(error)
    })
    this.waitForIdleDeferred?.reject(error)
  }

  /**
   * Settle completion-signal promises (no payload) as resolved rather than rejected — used on a
   * deliberate close (`close()`/`newSession()`), which isn't an error: the operation the caller
   * was waiting on (init, idle) is simply moot now, not failed.
   */
  protected resolveDeferredPending(): void {
    this.initialized.resolve()
    this.waitForIdleDeferred?.resolve()

    Array.from(this.contextlessGestureDeferred.entries()).forEach(([strokeId, deferred]) => {
      deferred.resolve({
        type: TWebSocketClientMessageType.ContextlessGesture,
        strokeId,
        gestureType: "none",
      })
    })
    Array.from(this.exportDeferredMap.values()).forEach((deferred) => {
      deferred.resolve({})
    })

    this.resolveAllInQueue(this.availableActionsDeferred, [])
    // "null" (not "") so callers doing `JSON.parse(await promise)` (see `getNumericalComputation`) get `null` instead of throwing
    this.resolveAllInQueue(this.numericalComputationDeferred, "null")
    this.resolveAllInQueue(this.getDiagnosticDeferred, "")
    this.resolveAllInQueue(this.getVariablesDeferred, [])
    this.resolveAllInQueue(this.setVariableValueDeferred, undefined)
    // NaN, not 0 — 0 would read as a real value; NaN clearly signals "no value"
    this.resolveAllInQueue(this.getVariableValueDeferred, NaN)
    this.resolveAllInQueue(this.removeVariableValueDeferred, undefined)
    this.resolveAllInQueue(this.asVariableDefinitionDeferred, { name: "", value: NaN })
    this.getVariableDefinitionsDeferred.forEach((deferred) => deferred.resolve([]))
    this.resolveAllInQueue(this.getEvaluablesDeferred, [])
    this.resolveAllInQueue(this.evaluateDeferred, [])
    this.sendToSupportDeferred.forEach((deferred) => deferred.resolve())
  }

  /** Resolve every still-pending deferred in every queue of `map` with the same neutral `value`. */
  protected resolveAllInQueue<T>(map: Map<string, DeferredPromise<T>[]>, value: T): void {
    Array.from(map.values()).forEach((queue) => {
      queue.forEach((deferred) => deferred.resolve(value))
    })
  }

  protected resetAllDeferred(): void {
    this.initialized = new DeferredPromise<void>()
    this.contextlessGestureDeferred.clear()
    this.exportDeferredMap.clear()
    this.waitForIdleDeferred = undefined
    this.closeDeferred = undefined
    this.availableActionsDeferred.clear()
    this.numericalComputationDeferred.clear()
    this.getDiagnosticDeferred.clear()
    this.getVariablesDeferred.clear()
    this.setVariableValueDeferred.clear()
    this.getVariableValueDeferred.clear()
    this.removeVariableValueDeferred.clear()
    this.asVariableDefinitionDeferred.clear()
    this.getVariableDefinitionsDeferred = []
    this.getEvaluablesDeferred.clear()
    this.evaluateDeferred.clear()
    this.sendToSupportDeferred = []
  }

  #isDisconnected(): boolean {
    return (
      !this.socket || this.socket.readyState === this.socket.CLOSING || this.socket.readyState === this.socket.CLOSED
    )
  }

  #enqueueOfflineMessage(message: TWebSocketClientMessage, deferred: DeferredPromise<void>): void {
    if (this.#offlineQueue.length >= this.configuration.server.websocket.offlineQueueMaxSize) {
      deferred.reject(new Error("Offline queue full: unable to queue addStrokes while disconnected"))
      return
    }
    this.#offlineQueue.push({ message, deferred })
    this.event.emitConnectionStatusChanged("offline")
    this.#startReconnectLoop()
  }

  #startReconnectLoop(): void {
    if (this.#reconnectTimer) {
      return
    }
    this.#scheduleReconnectAttempt()
  }

  #scheduleReconnectAttempt(): void {
    const { reconnectDelay, maxReconnectAttempts } = this.configuration.server.websocket
    this.#reconnectTimer = setTimeout(async () => {
      this.#reconnectTimer = undefined
      this.#reconnectAttempts++
      try {
        await this.init()
      } catch {
        if (this.#reconnectAttempts >= maxReconnectAttempts) {
          this.#giveUpReconnecting()
        } else {
          this.#scheduleReconnectAttempt()
        }
      }
    }, reconnectDelay)
  }

  /**
   * Runs once per successful connection, regardless of which caller triggered it (the
   * reconnect loop above, or the legacy auto-reconnect in `send()`). Cancels any reconnect
   * attempt still scheduled by the other path so it doesn't open a redundant second socket
   * once this one is up, and drains the offline queue since nothing else would.
   */
  #onConnected(): Promise<void> {
    this.#clearReconnectLoop()
    this.#reconnectAttempts = 0
    this.event.emitConnectionStatusChanged("connected")
    return this.#drainOfflineQueue()
  }

  async #drainOfflineQueue(): Promise<void> {
    while (this.#offlineQueue.length > 0) {
      if (this.#isDisconnected()) {
        this.#startReconnectLoop()
        return
      }
      const item = this.#offlineQueue[0]
      await this.#send(item.message)
      item.deferred.resolve()
      this.#offlineQueue.shift()
    }
  }

  /**
   * Reconnection attempts exhausted: reject and clear the queue, emit "error", and
   * reset the attempt counter so the next `addStrokes()` (or drop) gets a fresh retry budget.
   */
  #giveUpReconnecting(): void {
    this.#reconnectAttempts = 0
    this.#clearOfflineQueue(new Error("Unable to reconnect after offline queueing; queued strokes were not sent"))
    this.event.emitConnectionStatusChanged("error")
  }

  #clearOfflineQueue(error: Error): void {
    this.#offlineQueue.forEach((item) => item.deferred.reject(error))
    this.#offlineQueue = []
  }

  #clearReconnectLoop(): void {
    if (this.#reconnectTimer) {
      clearTimeout(this.#reconnectTimer)
      this.#reconnectTimer = undefined
    }
  }

  protected clearSocketListener(): void {
    this.socket.removeEventListener("open", this.boundOpenCallback)
    this.socket.removeEventListener("close", this.boundCloseCallback)
    this.socket.removeEventListener("message", this.boundMessageCallback)
  }

  protected closeCallback(evt: CloseEvent): void {
    this.#logger.info("closeCallback", { evt })
    let message = evt.reason
    if (!this.currentErrorCode) {
      message = mapCloseCodeToMessage(evt.code) ?? ClientError.CANT_ESTABLISH
    }

    this.clearSocketListener()
    this.closeDeferred?.resolve()
    if (!this.currentErrorCode && evt.code !== 1000) {
      const error = new Error(message)
      this.event.emitError(error)
      this.rejectDeferredPending(message)
    }
    this.pingWorker?.terminate()
    this.resetAllDeferred()
    this.event.emitConnectionStatusChanged("offline")
  }

  protected openCallback(): void {
    this.reconnectionCount = 0
    this.#send({
      type: "authenticate",
      "myscript-client-name": "iink-ts",
      "myscript-client-version": "4.0.0",
    })
  }

  protected async manageHMACChallenge(hmacChallengeMessage: TWebSocketClientMessageHMACChallenge): Promise<void> {
    let hmacKey: string
    if (typeof this.configuration.server.hmacKey == "string") {
      hmacKey = this.configuration.server.hmacKey
    } else if (typeof this.configuration.server.hmacKey == "function") {
      hmacKey = await this.configuration.server.hmacKey(this.configuration.server.applicationKey)
    } else {
      return this.initialized.reject(new Error("HMAC key is not a string nor a function"))
    }
    if (!hmacKey) {
      return this.initialized.reject(new Error("HMAC key is required"))
    }
    this.#send({
      type: "hmac",
      hmac: await computeHmac(hmacChallengeMessage.hmacChallenge, this.configuration.server.applicationKey, hmacKey),
    })
  }

  protected initPing(): void {
    this.pingWorker = new PingWorker()
    this.pingWorker.postMessage({
      pingDelay: this.configuration.server.websocket.pingDelay,
    })
    this.pingWorker.onmessage = () => {
      if (this.socket.readyState <= 1) {
        if (this.pingCount < this.configuration.server.websocket.maxPingLostCount) {
          this.send({ type: "ping" })
        } else {
          this.close(1000, "MAXIMUM_PING_REACHED")
          this.pingWorker?.terminate()
        }
        this.pingCount++
      }
    }
  }

  protected manageAuthenticated(): void {
    if (!isVersionSuperiorOrEqual(this.configuration.server.version!, "3.2.0")) {
      delete this.configuration.recognition.export.jiix.text.lines
      delete this.configuration.recognition["raw-content"].classification
    }
    const pixelTomm = 25.4 / 96
    this.#send({
      type: this.sessionId ? "restoreSession" : "initSession",
      iinkSessionId: this.sessionId,
      scaleX: pixelTomm,
      scaleY: pixelTomm,
      configuration: this.configuration.recognition,
    })
  }

  protected manageSessionDescriptionMessage(sessionDescriptionMessage: TInteractiveInkSessionDescriptionMessage): void {
    if (sessionDescriptionMessage.iinkSessionId) {
      this.sessionId = sessionDescriptionMessage.iinkSessionId
      this.event.emitSessionOpened(this.sessionId)
    }
    if (this.currentPartId) {
      this.#send({
        type: "openContentPart",
        id: this.currentPartId,
      })
    } else {
      this.#send({
        type: "newContentPart",
        contentType: "Raw Content",
        mimeTypes: this.mimeTypes,
      })
    }
  }

  protected manageNewPartMessage(newPartMessage: TWebSocketClientMessageNewPart): void {
    this.initialized.resolve()
    this.currentPartId = newPartMessage.id
  }

  protected managePartChangeMessage(partChangeMessage: TWebSocketClientMessagePartChange): void {
    this.initialized.resolve()
    this.currentPartId = partChangeMessage.partId
  }

  protected manageContentChangedMessage(contentChangeMessage: TWebSocketClientMessageContentChange): void {
    this.initialized.resolve()
    this.event.emitContentChanged({
      canRedo: contentChangeMessage.canRedo,
      canUndo: contentChangeMessage.canUndo,
    } as THistoryContext)
  }

  protected manageExportMessage(exportMessage: TWebSocketClientMessageExport): void {
    if (exportMessage.exports["application/vnd.myscript.jiix"]) {
      exportMessage.exports["application/vnd.myscript.jiix"] = JSON.parse(
        exportMessage.exports["application/vnd.myscript.jiix"].toString()
      ) as TJIIXExport
    }

    Object.keys(exportMessage.exports).forEach((key) => {
      if (this.exportDeferredMap.has(key)) {
        this.exportDeferredMap.get(key)!.resolve(exportMessage.exports)
      }
    })
    this.event.emitExported(exportMessage.exports)
  }

  protected manageWaitForIdle(): void {
    this.waitForIdleDeferred?.resolve()
    this.event.emitIdle(true)
  }

  protected manageErrorMessage(errorMessage: TWebSocketClientMessageError): void {
    this.currentErrorCode = errorMessage.data?.code || errorMessage.code
    let message = errorMessage.data?.message || errorMessage.message || ClientError.UNKNOWN

    if (this.currentErrorCode === "no.activity") {
      this.rejectDeferredPending(message)
      this.event.emitConnectionClose({
        code: 1000,
        message: ClientError.NO_ACTIVITY,
      })
    } else {
      switch (this.currentErrorCode) {
        case "access.not.granted":
          message = ClientError.WRONG_CREDENTIALS
          break
        case "session.too.old":
          message = ClientError.TOO_OLD
          break
        case "restore.session.not.found":
          message = ClientError.NO_SESSION_FOUND
          break
      }
      this.rejectDeferredPending(message)
      this.event.emitError(new Error(message))
    }
  }

  protected manageAck(): void {
    this.sendToSupportDeferred.shift()?.resolve()
  }

  protected manageGestureDetected(gestureMessage: TWebSocketClientMessageGesture): void {
    this.event.emitGestureDetected(gestureMessage)
  }

  protected manageContextlessGesture(gestureMessage: TWebSocketClientMessageContextlessGesture): void {
    this.contextlessGestureDeferred.get(gestureMessage.strokeId)?.resolve(gestureMessage)
  }

  protected resolveFirstInQueue<T>(
    map: Map<string, DeferredPromise<T>[]>,
    blockId: string | undefined,
    value?: T
  ): void {
    if (blockId === undefined || blockId === null) {
      return
    }
    const queue = map.get(blockId)
    if (!queue?.length) {
      return
    }
    queue.shift()!.resolve(value as T)
    if (queue.length === 0) {
      map.delete(blockId)
    }
  }

  protected manageMathSolverResult(mathSolverMessage: TWebSocketClientMessageMathSolverResult): void {
    if (mathSolverMessage.action === "get-variable-definitions") {
      if (this.getVariableDefinitionsDeferred.length) {
        this.getVariableDefinitionsDeferred.shift()!.resolve(mathSolverMessage.result)
      }
      return
    }

    const blockId = mathSolverMessage.blockId
    if (blockId === undefined || blockId === null) {
      this.#logger.warn(
        "manageMathSolverResult",
        "Received math solver result without blockId, unable to resolve corresponding promise",
        mathSolverMessage
      )
    }

    switch (mathSolverMessage.action) {
      case "available-actions":
        this.resolveFirstInQueue(this.availableActionsDeferred, blockId, mathSolverMessage.result)
        break
      case "numerical-computation":
        this.resolveFirstInQueue(this.numericalComputationDeferred, blockId, mathSolverMessage.result)
        break
      case "get-diagnostic":
        this.resolveFirstInQueue(this.getDiagnosticDeferred, blockId, mathSolverMessage.result)
        break
      case "get-variables":
        this.resolveFirstInQueue(this.getVariablesDeferred, blockId, mathSolverMessage.result)
        break
      case "set-variable-value":
        this.resolveFirstInQueue(this.setVariableValueDeferred, blockId)
        break
      case "get-variable-value":
        this.resolveFirstInQueue(this.getVariableValueDeferred, blockId, mathSolverMessage.result)
        break
      case "remove-variable-value":
        this.resolveFirstInQueue(this.removeVariableValueDeferred, blockId)
        break
      case "as-variable-definition":
        this.resolveFirstInQueue(this.asVariableDefinitionDeferred, blockId, mathSolverMessage.result)
        break
      case "get-evaluables":
        this.resolveFirstInQueue(this.getEvaluablesDeferred, blockId, mathSolverMessage.result)
        break
      case "evaluate":
        this.resolveFirstInQueue(this.evaluateDeferred, blockId, mathSolverMessage.result)
        break
      default:
        break
    }
  }

  protected messageCallback(message: MessageEvent<string>): void {
    this.currentErrorCode = undefined
    try {
      const websocketMessage: TWebSocketClientMessageReceived = JSON.parse(message.data)
      if (websocketMessage.type === TWebSocketClientMessageType.Pong) {
        return
      }
      this.pingCount = 0
      switch (websocketMessage.type) {
        case TWebSocketClientMessageType.HMAC_Challenge:
          this.manageHMACChallenge(websocketMessage).catch((err) => this.event.emitError(err))
          break
        case TWebSocketClientMessageType.Authenticated:
          this.manageAuthenticated()
          break
        case TWebSocketClientMessageType.SessionDescription:
          this.manageSessionDescriptionMessage(websocketMessage)
          break
        case TWebSocketClientMessageType.NewPart:
          this.manageNewPartMessage(websocketMessage)
          break
        case TWebSocketClientMessageType.PartChanged:
          this.managePartChangeMessage(websocketMessage)
          break
        case TWebSocketClientMessageType.ContentChanged:
          this.manageContentChangedMessage(websocketMessage)
          break
        case TWebSocketClientMessageType.Exported:
          this.manageExportMessage(websocketMessage)
          break
        case TWebSocketClientMessageType.GestureDetected:
          this.manageGestureDetected(websocketMessage)
          break
        case TWebSocketClientMessageType.ContextlessGesture:
          this.manageContextlessGesture(websocketMessage)
          break
        case TWebSocketClientMessageType.MathSolverResult:
          this.manageMathSolverResult(websocketMessage)
          break
        case TWebSocketClientMessageType.Error:
          this.manageErrorMessage(websocketMessage)
          break
        case TWebSocketClientMessageType.Idle:
          this.manageWaitForIdle()
          break
        case TWebSocketClientMessageType.Ack:
          this.manageAck()
          break
        default:
          this.#logger.warn("messageCallback", `Message type unknown: "${websocketMessage}".`)
          break
      }
    } catch {
      this.event.emitError(new Error(message.data))
    }
  }

  async newSession(config: TPartialDeep<TWebSocketClientConfiguration>): Promise<void> {
    await this.close(1000, "new-session")
    this.configuration = mergeDeep({}, this.configuration, config)
    this.sessionId = undefined
    this.currentPartId = undefined
    await this.init()
  }

  async init(): Promise<void> {
    if (this.#connectingPromise) {
      return this.#connectingPromise
    }
    this.#connectingPromise = this.#connect()
      .then(() => this.#onConnected())
      .finally(() => {
        this.#connectingPromise = null
      })
    return this.#connectingPromise
  }

  async #connect(): Promise<void> {
    this.event.emitStartInitialization()
    if (this.currentErrorCode === "restore.session.not.found") {
      this.currentErrorCode = undefined
      this.sessionId = undefined
      this.currentPartId = undefined
    }
    if (!this.configuration.server.version) {
      this.configuration.server.version = (await getApiInfos(this.configuration)).version
    }
    this.socket = new WebSocket(this.url)
    this.clearSocketListener()
    this.socket.addEventListener("open", this.boundOpenCallback)
    this.socket.addEventListener("close", this.boundCloseCallback)
    this.socket.addEventListener("message", this.boundMessageCallback)
    await this.initialized.promise
    if (this.configuration.server.websocket.pingEnabled) {
      this.pingCount = 0
      this.initPing()
    }
    this.event.emitEndInitialization()
  }

  async send(message: TWebSocketClientMessage): Promise<void> {
    if (!this.socket) {
      return Promise.reject(new Error("Client must be initilized"))
    }

    switch (this.socket.readyState) {
      case this.socket.CONNECTING:
      case this.socket.OPEN:
        await this.initialized.promise
        this.#send(message)
        return Promise.resolve()
      case this.socket.CLOSING:
      case this.socket.CLOSED:
        if (this.#closingPromise) {
          // A deliberate `close()` (e.g. `newSession()`) is already tearing down the socket —
          // wait for it instead of racing our own `init()` against the one it issues right after.
          await this.#closingPromise
          return this.send(message)
        }
        if (this.configuration.server.websocket.autoReconnect) {
          this.reconnectionCount++
          if (this.configuration.server.websocket.maxRetryCount > this.reconnectionCount) {
            await this.init()
            await this.waitForIdle()
            return this.#send(message)
          } else {
            return Promise.reject(
              new Error("Unable to send message. The maximum number of connection attempts has been reached.")
            )
          }
        } else {
          return Promise.reject(
            new Error("Unable to send message. Connection closed and automatic reconnection disabled")
          )
        }
        break
    }
  }

  protected buildAddStrokesMessage(strokes: TStroke[], processGestures = true): TWebSocketClientMessage {
    return {
      type: "addStrokes",
      processGestures,
      strokes: strokes.map((s) => StrokeOps.formatToSend(s)),
    }
  }
  /**
   * @remarks Resolves once the message is sent, not once the server acks it — gesture detection
   * results (if any) arrive asynchronously via `event.addGestureDetectedListener`, not this promise.
   */
  async addStrokes(strokes: TStroke[], processGestures = true): Promise<void> {
    if (strokes.length === 0) {
      return
    }
    const promises: Promise<void>[] = []
    const _processGestures = processGestures && strokes.length < 3
    const chunkSize = 1000
    for (let i = 0; i < strokes.length; i += chunkSize) {
      const strokesPart = strokes.slice(i, i + chunkSize)
      const message = this.buildAddStrokesMessage(strokesPart, _processGestures)
      if (this.configuration.server.websocket.offlineQueueEnabled && this.#isDisconnected()) {
        const deferred = new DeferredPromise<void>()
        this.#enqueueOfflineMessage(message, deferred)
        promises.push(deferred.promise)
      } else {
        promises.push(this.send(message))
      }
    }
    await Promise.all(promises)
  }

  async getAvailableActions(blockId: string): Promise<string[]> {
    const deferred = new DeferredPromise<string[]>()
    const queue = this.availableActionsDeferred.get(blockId) ?? []
    queue.push(deferred)
    this.availableActionsDeferred.set(blockId, queue)
    await this.send({
      type: "mathSolver",
      action: "available-actions",
      blockId,
    })
    return deferred.promise
  }

  async getNumericalComputation(blockId: string): Promise<TJIIXMathElement> {
    const deferred = new DeferredPromise<string>()
    const queue = this.numericalComputationDeferred.get(blockId) ?? []
    queue.push(deferred)
    this.numericalComputationDeferred.set(blockId, queue)
    await this.send({
      type: "mathSolver",
      action: "numerical-computation",
      blockId: blockId,
    })
    return JSON.parse(await deferred.promise) as TJIIXMathElement
  }

  async getDiagnostic(blockId: string, task: string): Promise<string> {
    const deferred = new DeferredPromise<string>()
    const queue = this.getDiagnosticDeferred.get(blockId) ?? []
    queue.push(deferred)
    this.getDiagnosticDeferred.set(blockId, queue)
    await this.send({
      type: "mathSolver",
      action: "get-diagnostic",
      task,
      blockId,
    })
    return deferred.promise
  }

  async getVariables(blockId: string): Promise<TMathVariable[]> {
    const deferred = new DeferredPromise<TMathVariable[]>()
    const queue = this.getVariablesDeferred.get(blockId) ?? []
    queue.push(deferred)
    this.getVariablesDeferred.set(blockId, queue)
    await this.send({
      type: "mathSolver",
      action: "get-variables",
      blockId,
    })
    return deferred.promise
  }

  async getVariableValue(blockId: string, variableName: string): Promise<number> {
    const deferred = new DeferredPromise<number>()
    const queue = this.getVariableValueDeferred.get(blockId) ?? []
    queue.push(deferred)
    this.getVariableValueDeferred.set(blockId, queue)
    await this.send({
      type: "mathSolver",
      action: "get-variable-value",
      blockId,
      variableName,
    })
    return deferred.promise
  }

  async setVariableValue(blockId: string, variableName: string, variableValue: number): Promise<void> {
    const deferred = new DeferredPromise<void>()
    const queue = this.setVariableValueDeferred.get(blockId) ?? []
    queue.push(deferred)
    this.setVariableValueDeferred.set(blockId, queue)
    await this.send({
      type: "mathSolver",
      action: "set-variable-value",
      blockId,
      variableName,
      variableValue,
    })
    await deferred.promise
  }

  async removeVariableValue(blockId: string, variableName: string): Promise<void> {
    const deferred = new DeferredPromise<void>()
    const queue = this.removeVariableValueDeferred.get(blockId) ?? []
    queue.push(deferred)
    this.removeVariableValueDeferred.set(blockId, queue)
    await this.send({
      type: "mathSolver",
      action: "remove-variable-value",
      blockId,
      variableName,
    })
    await deferred.promise
  }

  async asVariableDefinition(blockId: string): Promise<TMathVariableDefinition> {
    const deferred = new DeferredPromise<TMathVariableDefinition>()
    const queue = this.asVariableDefinitionDeferred.get(blockId) ?? []
    queue.push(deferred)
    this.asVariableDefinitionDeferred.set(blockId, queue)
    await this.send({
      type: "mathSolver",
      action: "as-variable-definition",
      blockId,
    })
    return deferred.promise
  }

  async getVariableDefinitions(): Promise<TMathVariableDefinitions[]> {
    const deferred = new DeferredPromise<TMathVariableDefinitions[]>()
    this.getVariableDefinitionsDeferred.push(deferred)
    await this.send({
      type: "mathSolver",
      action: "get-variable-definitions",
    })
    return deferred.promise
  }

  async getEvaluables(blockId: string): Promise<TMathEvaluable[]> {
    const deferred = new DeferredPromise<TMathEvaluable[]>()
    const queue = this.getEvaluablesDeferred.get(blockId) ?? []
    queue.push(deferred)
    this.getEvaluablesDeferred.set(blockId, queue)
    await this.send({
      type: "mathSolver",
      action: "get-evaluables",
      blockId,
    })
    return deferred.promise
  }

  async evaluate(
    blockId: string,
    evaluation: {
      inputVariableName: string
      outputVariableName: string
      from: number
      to: number
      pointCount: number
    }
  ): Promise<{ [key: string]: number }[][]> {
    const deferred = new DeferredPromise<number[][]>()
    const queue = this.evaluateDeferred.get(blockId) ?? []
    queue.push(deferred)
    this.evaluateDeferred.set(blockId, queue)
    await this.send({
      type: "mathSolver",
      action: "evaluate",
      blockId,
      evaluation,
    })
    const result = await deferred.promise

    // Transform result arrays to series of points
    // Result format: [[x1, y1, x2, y2, ...], [x1, y1, x2, y2, ...]] for multiple curves
    const allSeries: {
      [key: string]: number
    }[][] = []

    for (const flatArray of result) {
      const points: { [key: string]: number }[] = []

      // Server always returns [x1, y1, x2, y2, ...] format, even for constant functions
      const xKey = evaluation.inputVariableName || "x"
      const yKey = evaluation.outputVariableName || "?"

      for (let i = 0; i < flatArray.length; i += 2) {
        if (i + 1 < flatArray.length) {
          const xVal = flatArray[i]
          const yVal = flatArray[i + 1]

          points.push({
            [xKey]: xVal,
            [yKey]: yVal,
          })
        }
      }

      allSeries.push(points)
    }

    this.#logger.info("Evaluate result transformed", {
      inputVar: evaluation.inputVariableName || "x",
      outputVar: evaluation.outputVariableName || "?",
      seriesCount: allSeries.length,
      totalPoints: allSeries.reduce((sum, series) => sum + series.length, 0),
    })

    this.evaluateDeferred.delete(blockId)
    return allSeries
  }

  protected buildReplaceStrokesMessage(oldStrokeIds: string[], newStrokes: TStroke[]): TWebSocketClientMessage {
    return {
      type: "replaceStrokes",
      oldStrokeIds,
      newStrokes: newStrokes.map((s) => StrokeOps.formatToSend(s)),
    }
  }
  async replaceStrokes(oldStrokeIds: string[], newStrokes: TStroke[]): Promise<void> {
    if (oldStrokeIds.length === 0) {
      return
    }
    await this.send(this.buildReplaceStrokesMessage(oldStrokeIds, newStrokes))
  }

  protected buildTransformTranslateMessage(strokeIds: string[], tx: number, ty: number): TWebSocketClientMessage {
    return {
      type: "transform",
      transformationType: "TRANSLATE",
      strokeIds,
      tx,
      ty,
    }
  }
  async transformTranslate(strokeIds: string[], tx: number, ty: number): Promise<void> {
    if (strokeIds.length === 0) {
      return
    }
    await this.send(this.buildTransformTranslateMessage(strokeIds, tx, ty))
  }

  protected buildTransformRotateMessage(
    strokeIds: string[],
    angle: number,
    x0: number = 0,
    y0: number = 0
  ): TWebSocketClientMessage {
    return {
      type: "transform",
      transformationType: "ROTATE",
      strokeIds,
      angle,
      x0,
      y0,
    }
  }
  async transformRotate(strokeIds: string[], angle: number, x0: number = 0, y0: number = 0): Promise<void> {
    if (strokeIds.length === 0) {
      return
    }
    await this.send(this.buildTransformRotateMessage(strokeIds, angle, x0, y0))
  }

  protected buildTransformScaleMessage(
    strokeIds: string[],
    scaleX: number,
    scaleY: number,
    x0: number = 0,
    y0: number = 0
  ): TWebSocketClientMessage {
    return {
      type: "transform",
      transformationType: "SCALE",
      strokeIds,
      scaleX,
      scaleY,
      x0,
      y0,
    }
  }
  async transformScale(
    strokeIds: string[],
    scaleX: number,
    scaleY: number,
    x0: number = 0,
    y0: number = 0
  ): Promise<void> {
    if (strokeIds.length === 0) {
      return
    }
    await this.send(this.buildTransformScaleMessage(strokeIds, scaleX, scaleY, x0, y0))
  }

  protected buildTransformMatrixMessage(strokeIds: string[], matrix: TMatrixTransform): TWebSocketClientMessage {
    return {
      type: "transform",
      transformationType: "MATRIX",
      strokeIds,
      ...matrix,
    }
  }
  async transformMatrix(strokeIds: string[], matrix: TMatrixTransform): Promise<void> {
    if (strokeIds.length === 0) {
      return
    }
    await this.send(this.buildTransformMatrixMessage(strokeIds, matrix))
  }

  protected buildEraseStrokesMessage(strokeIds: string[]): TWebSocketClientMessage {
    return {
      type: "eraseStrokes",
      strokeIds,
    }
  }
  async eraseStrokes(strokeIds: string[]): Promise<void> {
    if (strokeIds.length === 0) {
      return
    }
    await this.send(this.buildEraseStrokesMessage(strokeIds))
  }

  async recognizeGesture(stroke: TStroke): Promise<TWebSocketClientMessageContextlessGesture | undefined> {
    if (!stroke) {
      return
    }
    const deferred = new DeferredPromise<TWebSocketClientMessageContextlessGesture>()
    this.contextlessGestureDeferred.set(stroke.id, deferred)
    const pixelTomm = 25.4 / 96
    await this.send({
      type: "contextlessGesture",
      scaleX: pixelTomm,
      scaleY: pixelTomm,
      stroke: StrokeOps.formatToSend(stroke),
    })
    return deferred.promise
  }

  async waitForIdle(): Promise<void> {
    if (!this.waitForIdleDeferred || this.waitForIdleDeferred.isFullFilled) {
      this.waitForIdleDeferred = new DeferredPromise<void>()
    }
    const message: TWebSocketClientMessage = {
      type: "waitForIdle",
    }
    await this.send(message)
    return this.waitForIdleDeferred?.promise
  }

  protected buildUndoRedoChanges(changes: TIIHistoryBackendChanges): TWebSocketClientMessage[] {
    const changesMessages: TWebSocketClientMessage[] = []
    if (changes.added?.length) {
      changesMessages.push(this.buildAddStrokesMessage(changes.added, false))
    }
    if (changes.erased?.length) {
      changesMessages.push(this.buildEraseStrokesMessage(changes.erased.map((s) => s.id)))
    }
    if (changes.replaced?.newStrokes.length) {
      changesMessages.push(
        this.buildReplaceStrokesMessage(
          changes.replaced.oldStrokes.map((s) => s.id),
          changes.replaced.newStrokes
        )
      )
    }
    if (changes.matrix?.strokes.length) {
      changesMessages.push(
        this.buildTransformMatrixMessage(
          changes.matrix.strokes.map((s) => s.id),
          changes.matrix.matrix
        )
      )
    }
    if (changes.translate?.length) {
      changes.translate.forEach((tr) => {
        changesMessages.push(
          this.buildTransformTranslateMessage(
            tr.strokes.map((s) => s.id),
            tr.tx,
            tr.ty
          )
        )
      })
    }
    if (changes.rotate?.length) {
      changes.rotate.forEach((tr) => {
        changesMessages.push(
          this.buildTransformRotateMessage(
            tr.strokes.map((s) => s.id),
            tr.angle,
            tr.center.x,
            tr.center.y
          )
        )
      })
    }
    if (changes.scale?.length) {
      changes.scale.forEach((tr) => {
        changesMessages.push(
          this.buildTransformScaleMessage(
            tr.strokes.map((s) => s.id),
            tr.scaleX,
            tr.scaleY,
            tr.origin.x,
            tr.origin.y
          )
        )
      })
    }
    return changesMessages
  }

  async undo(actions: TIIHistoryBackendChanges): Promise<void> {
    const changes = this.buildUndoRedoChanges(actions)
    if (changes.length === 0) {
      return
    }
    const message: TWebSocketClientMessage = {
      type: "undo",
      changes,
    }
    await this.send(message)
  }

  async redo(actions: TIIHistoryBackendChanges): Promise<void> {
    const changes = this.buildUndoRedoChanges(actions)
    if (changes.length === 0) {
      return
    }
    const message: TWebSocketClientMessage = {
      type: "redo",
      changes,
    }
    await this.send(message)
  }

  async export(requestedMimeTypes?: string[]): Promise<TExport> {
    const mimeTypes: string[] = requestedMimeTypes || this.mimeTypes.slice()
    await Promise.all(mimeTypes.map((mt) => this.exportDeferredMap.get(mt)?.promise))
    const deferreds = mimeTypes.map((mt) => {
      const deferred = new DeferredPromise<TExport>()
      this.exportDeferredMap.set(mt, deferred)
      return deferred
    })

    const message: TWebSocketClientMessage = {
      type: "export",
      partId: this.currentPartId,
      mimeTypes,
    }
    await this.send(message)
    const exports = await Promise.all(deferreds.map((deferred) => deferred.promise))
    return Object.assign({}, ...exports)
  }

  async clear(): Promise<void> {
    await this.send({
      type: "clear",
    })
  }

  async sendToSupport(data: Record<string, unknown>): Promise<void> {
    const deferred = new DeferredPromise<void>()
    this.sendToSupportDeferred.push(deferred)
    await this.send({
      type: "sendToSupport",
      metadata: { ...data },
    })
    return deferred.promise
  }

  async close(code: number, reason: string): Promise<void> {
    this.#clearReconnectLoop()
    this.#clearOfflineQueue(new Error(`Client closed (${reason}): queued strokes were not sent`))
    this.resolveDeferredPending()
    this.resetAllDeferred()
    this.closeDeferred = new DeferredPromise<void>()
    const doClose = async (): Promise<void> => {
      if (this.socket.readyState === this.socket.OPEN || this.socket.readyState === this.socket.CONNECTING) {
        this.socket.close(code, reason)
      } else {
        this.closeDeferred!.resolve()
      }
      await this.closeDeferred!.promise
    }
    this.#closingPromise = doClose().finally(() => {
      this.#closingPromise = null
    })
    await this.#closingPromise
  }

  async destroy(): Promise<void> {
    if (this.socket) {
      await this.close(1000, "Client destroyed")
    }
  }
}
