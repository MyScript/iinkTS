import PingWorker from "web-worker:../../worker/ping.worker.ts"

import type { TMatrixTransform } from "@/core"
import {
  DeferredPromise,
  isVersionSuperiorOrEqual,
  mergeDeep,
  overrideDeep,
  PX_TO_MM_RATIO,
  type TPartialDeep,
} from "@/core"
import type { TIIHistoryBackendChanges } from "@/history"
import { LoggerCategory, LoggerManager } from "@/logger"

import { parseExportedJIIX, type TExport } from "../jiix/JIIX"
import type { TJIIXMathElement } from "../jiix/JIIXMath"
import { ClientError, mapCloseCodeToMessage, mapErrorCodeToMessage } from "../shared/ClientError"
import { ClientEvent } from "../shared/ClientEvent"
import { resolveHmac } from "../shared/HmacAuth"
import { ensureServerVersion } from "../shared/infos"
import { redactServerSecrets, serverUrl } from "../shared/ServerConfiguration"
import type { TRecognitionStroke, TWireStroke } from "../shared/StrokeSerializer"
import { supportsRelativeTimestamps, toWireStroke } from "../shared/StrokeSerializer"
import type { TWebSocketClientConfiguration } from "./WebSocketClientConfiguration"
import { WebSocketClientConfiguration } from "./WebSocketClientConfiguration"
import type {
  TInteractiveInkSessionDescriptionMessage,
  TMathEvaluable,
  TMathSolverAction,
  TMathSolverResultMap,
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
  TWebSocketClientMessageReceivedMap,
} from "./WebSocketClientMessage"
import { readHistoryContext, TWebSocketClientMessageType } from "./WebSocketClientMessage"

const RECEIVED_MESSAGE_TYPES: ReadonlySet<unknown> = new Set(Object.values(TWebSocketClientMessageType))

// Checks the discriminant only: the payload is trusted to match its type, as the server's contract
const isWebSocketClientMessageReceived = (value: unknown): value is TWebSocketClientMessageReceived =>
  typeof value === "object" && value !== null && "type" in value && RECEIVED_MESSAGE_TYPES.has(value.type)

// What one item adds to a message's JSON, for `chunkBySize`.
const wireStrokeSize = (stroke: TWireStroke): number => JSON.stringify(stroke).length
const strokeIdSize = (id: string): number => id.length + 2

/**
 * @group Client
 * @summary A request waiting on an answer from the server
 * @remarks `neutral` is what it settles with when a deliberate close makes the answer moot.
 */
export type TPendingRequest = {
  neutral: unknown
  resolve(answer: unknown): void
  reject(error: Error | string): void
}

// `get-variable-definitions` answers for the whole document, not a block: its requests queue under this key
const DOCUMENT_BLOCK_ID = ""

/**
 * @group Client
 * @summary One handler per message type the server sends
 */
export type TWebSocketClientMessageHandlers = {
  [K in TWebSocketClientMessageType]: (message: TWebSocketClientMessageReceivedMap[K]) => void
}

// What a math request settles with when a deliberate close makes it moot; a factory per action, so a
// request allocates only its own value and no caller shares a mutable one
const MATH_SOLVER_NEUTRAL_RESULTS: { [A in TMathSolverAction]: () => TMathSolverResultMap[A] } = {
  "available-actions": () => [],
  // "null" (not "") so callers doing `JSON.parse(await promise)` (see `getNumericalComputation`) get `null` instead of throwing
  "numerical-computation": () => "null",
  "get-diagnostic": () => "",
  "get-variables": () => [],
  "set-variable-value": () => undefined,
  // NaN, not 0 — 0 would read as a real value; NaN clearly signals "no value"
  "get-variable-value": () => NaN,
  "remove-variable-value": () => undefined,
  "as-variable-definition": () => ({ name: "", value: NaN }),
  "get-variable-definitions": () => [],
  "get-evaluables": () => [],
  evaluate: () => [],
}

/**
 * A websocket dialog has this sequence. The full list of server messages is
 * {@link TWebSocketClientMessageType}; keep this sketch in line with it.
 * --------------- Client --------------------------------------------------------------- Server ---------------
 * Handshake
 * { type: "authenticate" }                           ==================>
 *                                                    <==================       { type: "hmacChallenge" }
 * { type: "hmac" }                                   ==================>
 *                                                    <==================       { type: "authenticated" }
 * { type: "initSession" | "restoreSession" }         ==================>
 *                                                    <==================       { type: "sessionDescription" }
 * { type: "newContentPart" | "openContentPart" }     ==================>
 *                                                    <==================       { type: "newPart" | "partChanged" }
 * { type: "changeConfiguration" }                    ==================>
 *                                                    <==================       { type: "configurationChanged" }
 *
 * Edition (each change is answered by a contentChanged)
 * { type: "addStrokes" }                             ==================>
 * { type: "replaceStrokes" }                         ==================>
 * { type: "eraseStrokes" }                           ==================>
 * { type: "transform" }  (TRANSLATE | ROTATE | SCALE | MATRIX) =======>
 * { type: "undo" | "redo", changes }                 ==================>
 * { type: "clear" }                                  ==================>
 *                                                    <==================       { type: "contentChanged" }
 *
 * Gestures, detected in context (addStrokes with processGestures, fewer than 3 strokes)
 * { type: "addStrokes", processGestures: true }      ==================>
 *                                                    <==================       { type: "gestureDetected", gestureType: "SCRATCH", gestureStrokeId, strokeIds, … }
 *   the gesture manager applies it, then sends the result:
 * { type: "eraseStrokes" | "replaceStrokes" }        ==================>
 *                                                    <==================       { type: "contentChanged" }
 *
 * Gestures, detected without context (stroke not added to the content)
 * { type: "contextlessGesture", scaleX, scaleY, strokes } ============>
 *                                                    <==================       { type: "contextlessGesture", gestureType, strokeId }
 *
 * Requests
 * { type: "export", partId, mimeTypes }              ==================>
 *                                                    <==================       { type: "exported" }
 * { type: "waitForIdle" }                            ==================>
 *                                                    <==================       { type: "idle" }
 * { type: "mathSolver", action, blockId }            ==================>
 *                                                    <==================       { type: "mathSolverResult" }
 * { type: "sendToSupport", metadata }                ==================>
 *                                                    <==================       { type: "ack" }
 * { type: "ping" }                                   ==================>
 *                                                    <==================       { type: "pong" }
 *
 * At any time
 *                                                    <==================       { type: "error" }
 */

/**
 * @group Client
 */
export class WebSocketClient {
  protected logger = LoggerManager.getLogger(LoggerCategory.CLIENT)

  protected socket!: WebSocket
  /**
   * Largest message sent in one frame, in characters of its JSON. The backend closes the connection
   * (1009) on an incoming message over 500 KB; half of that leaves room to spare.
   */
  protected maxMessageBytes = 256 * 1024
  protected pingWorker?: Worker
  protected pingCount = 0
  protected sessionId?: string

  protected boundOpenCallback: () => void
  protected boundCloseCallback: (evt: CloseEvent) => void
  protected boundMessageCallback: (message: MessageEvent<string>) => void
  protected currentPartId?: string
  protected currentErrorCode?: string | number

  /**
   * Every request waiting on the server, under the key its answer is matched on (`gesture:<strokeId>`,
   * `export:<mimeType>`, `math:<action>:<blockId>`, `idle`, `support`), oldest first: the server
   * answers the requests of one key in order.
   */
  protected pendingRequests = new Map<string, TPendingRequest[]>()

  // Resolved once the queued message is actually sent (post-reconnect), not once any server ack
  // arrives — mutating calls (addStrokes, undo, etc.) never wait for a server ack; there's no
  // correlation id on "contentChanged"/"gestureDetected" to safely match one to a specific call.
  protected offlineQueue: {
    message: TWebSocketClientMessage
    deferred: DeferredPromise<void>
  }[] = []
  protected reconnectTimer?: ReturnType<typeof setTimeout>
  protected reconnectAttempts = 0
  /** Settled once the reconnect loop has reconnected and replayed the queue, or has given up. */
  protected reconnection?: DeferredPromise<void>
  // Guards against concurrent init() calls: the offline-queue reconnect loop and the legacy
  // auto-reconnect in `send()` can both observe a closed socket and call init() around the same
  // time. Without this, each would create its own `new WebSocket()`, leaving two live sockets
  // with only the last one referenced by `this.socket`.
  protected connectingPromise: Promise<void> | null = null
  // Set for the duration of a deliberate `close()` (e.g. `newSession()` switching language).
  // `send()`'s legacy auto-reconnect must wait for this instead of racing its own `init()` against
  // the one `newSession()` issues right after — starting a second socket before the first one's
  // close handshake completes has left the server never answering on either connection.
  protected closingPromise: Promise<void> | null = null
  /** Set on the first successful connection: a drop after it is recoverable, one before is not */
  protected hasConnected = false
  // Exports run one after another: the server's answer names its mime types, not the request it
  // answers, so two exports in flight could only be told apart by their order.
  protected exportQueue: Promise<unknown> = Promise.resolve()
  /** Routes each message the server sends; overriding a `manage*` method changes what its entry does. */
  protected messageHandlers: TWebSocketClientMessageHandlers = {
    [TWebSocketClientMessageType.Pong]: () => (this.pingCount = 0),
    [TWebSocketClientMessageType.HMAC_Challenge]: (m) =>
      this.manageHMACChallenge(m).catch((err) => this.failInitialization(err)),
    [TWebSocketClientMessageType.Authenticated]: () => this.manageAuthenticated(),
    [TWebSocketClientMessageType.SessionDescription]: (m) => this.manageSessionDescriptionMessage(m),
    [TWebSocketClientMessageType.NewPart]: (m) => this.manageNewPartMessage(m),
    [TWebSocketClientMessageType.PartChanged]: (m) => this.managePartChangeMessage(m),
    [TWebSocketClientMessageType.ContentChanged]: (m) => this.manageContentChangedMessage(m),
    [TWebSocketClientMessageType.Exported]: (m) => this.manageExportMessage(m),
    [TWebSocketClientMessageType.GestureDetected]: (m) => this.manageGestureDetected(m),
    [TWebSocketClientMessageType.ContextlessGesture]: (m) => this.manageContextlessGesture(m),
    [TWebSocketClientMessageType.MathSolverResult]: (m) => this.manageMathSolverResult(m),
    [TWebSocketClientMessageType.Error]: (m) => this.manageErrorMessage(m),
    [TWebSocketClientMessageType.Idle]: () => this.manageWaitForIdle(),
    [TWebSocketClientMessageType.ConfigurationChanged]: () => this.manageConfigurationChanged(),
    [TWebSocketClientMessageType.Ack]: () => this.manageAck(),
  }

  configuration: WebSocketClientConfiguration
  initialized: DeferredPromise<void>
  url: string
  event: ClientEvent

  constructor(config: TPartialDeep<TWebSocketClientConfiguration>, event?: ClientEvent) {
    this.logger.info("constructor", { config: redactServerSecrets(config) })
    this.configuration = new WebSocketClientConfiguration(config)
    this.url = serverUrl(this.configuration.server, "offscreen", {
      websocket: true,
      query: { applicationKey: this.configuration.server.applicationKey },
    })

    this.event = event || new ClientEvent()
    this.initialized = new DeferredPromise<void>()
    this.boundOpenCallback = this.openCallback.bind(this)
    this.boundCloseCallback = this.closeCallback.bind(this)
    this.boundMessageCallback = this.messageCallback.bind(this)
  }

  get mimeTypes(): string[] {
    return ["application/vnd.myscript.jiix"]
  }

  /**
   * Number of changes queued while disconnected, waiting to be replayed (see `server.websocket.autoReconnect`).
   */
  get offlineQueueLength(): number {
    return this.offlineQueue.length
  }

  /**
   * True while the connection is down after a first one succeeded, whether changes are queued or
   * not; false again once reconnected. `offlineQueueLength` tells how many changes wait.
   */
  get isOffline(): boolean {
    return this.hasConnected && this.socket?.readyState !== this.socket?.OPEN
  }

  protected assertInitialized(): void {
    if (!this.socket) {
      throw new Error("Client must be initialized")
    }
  }

  protected sendOnSocket(message: TWebSocketClientMessage): void {
    this.assertInitialized()
    if (this.socket.readyState !== WebSocket.OPEN) {
      throw new Error(`Can not send message: ${message.type}, connection not ready, state: ${this.socket.readyState}`)
    }
    this.socket.send(JSON.stringify(message))
  }

  protected rejectDeferredPending(error: Error | string): void {
    this.initialized.reject(error)
    this.settlePending((request) => request.reject(error))
  }

  /** Settles every request waiting on the server: none is answered now, so a later answer must not settle another one */
  protected settlePending(settle: (request: TPendingRequest) => void): void {
    this.pendingRequests.forEach((requests) => requests.forEach(settle))
    this.pendingRequests.clear()
  }

  /**
   * Registers a request under the key its answer will be matched on, after those already waiting there.
   * Called once the request is sent, not before: a request still waiting for a reconnection must not
   * be failed by the close of a reconnection attempt. The answer cannot be missed — it arrives in a
   * later `message` event, after the microtask that registers it.
   */
  protected waitForAnswer<T>(key: string, neutral: T): DeferredPromise<T> {
    const deferred = new DeferredPromise<T>()
    const requests = this.pendingRequests.get(key) ?? []
    requests.push({ neutral, resolve: deferred.resolve, reject: deferred.reject })
    this.pendingRequests.set(key, requests)
    return deferred
  }

  /** Settles the oldest request waiting on `key`, or all of them, with the server's answer. */
  protected answer(key: string, answer: unknown, all = false): void {
    const requests = this.pendingRequests.get(key) ?? []
    const answered = all ? requests.splice(0) : requests.splice(0, 1)
    if (!requests.length) {
      this.pendingRequests.delete(key)
    }
    answered.forEach((request) => request.resolve(answer))
  }

  /**
   * Settle completion-signal promises (no payload) as resolved rather than rejected — used on a
   * deliberate close (`close()`/`newSession()`), which isn't an error: the operation the caller
   * was waiting on (init, idle) is simply moot now, not failed.
   */
  protected resolveDeferredPending(): void {
    this.initialized.resolve()
    this.settlePending((request) => request.resolve(request.neutral))
  }

  protected resetAllDeferred(): void {
    this.initialized = new DeferredPromise<void>()
    this.pendingRequests.clear()
  }

  protected isDisconnected(): boolean {
    return (this.socket?.readyState ?? WebSocket.CLOSED) >= WebSocket.CLOSING
  }

  protected enqueueOfflineMessage(message: TWebSocketClientMessage, deferred: DeferredPromise<void>): void {
    if (this.offlineQueue.length >= this.configuration.server.websocket.offlineQueueMaxSize) {
      deferred.reject(new Error("Offline queue full: unable to queue a change while disconnected"))
      return
    }
    this.offlineQueue.push({ message, deferred })
    this.event.emitConnectionStatusChanged("offline")
    this.startReconnectLoop()
  }

  protected startReconnectLoop(): void {
    if (this.reconnectTimer) {
      return
    }
    this.scheduleReconnectAttempt()
  }

  protected scheduleReconnectAttempt(): void {
    const { reconnectDelay, maxReconnectAttempts } = this.configuration.server.websocket
    this.reconnectTimer = setTimeout(async () => {
      this.reconnectTimer = undefined
      this.reconnectAttempts++
      try {
        await this.init()
      } catch {
        if (this.reconnectAttempts >= maxReconnectAttempts) {
          this.giveUpReconnecting()
        } else {
          this.scheduleReconnectAttempt()
        }
      }
    }, reconnectDelay)
  }

  /**
   * Runs once per successful connection, whoever triggered it. Cancels any reconnect attempt
   * still scheduled, replays the offline queue, and only then lets the requests waiting for the
   * reconnection go: one sent before the replay would read content the server does not have yet.
   */
  protected async onConnected(): Promise<void> {
    this.hasConnected = true
    this.clearReconnectLoop()
    this.reconnectAttempts = 0
    this.event.emitConnectionStatusChanged("connected")
    await this.drainOfflineQueue()
    if (!this.isDisconnected()) {
      this.reconnection?.resolve()
      this.reconnection = undefined
    }
  }

  /** Resolves once the reconnect loop has reconnected and replayed the queue; rejects if it gives up. */
  protected waitForReconnection(): Promise<void> {
    this.reconnection ??= new DeferredPromise<void>()
    const reconnected = this.reconnection.promise
    // An attempt already under way settles it; a second one would replace its socket
    if (!this.connectingPromise) {
      this.startReconnectLoop()
    }
    return reconnected
  }

  protected async drainOfflineQueue(): Promise<void> {
    while (this.offlineQueue.length > 0) {
      if (this.isDisconnected()) {
        this.startReconnectLoop()
        return
      }
      const item = this.offlineQueue[0]
      this.sendOnSocket(item.message)
      item.deferred.resolve()
      this.offlineQueue.shift()
    }
  }

  /**
   * Reconnection attempts exhausted: reject the queue and the requests waiting for the
   * reconnection, emit "error", and reset the attempt counter so the next change (or drop) gets a
   * fresh retry budget.
   */
  protected giveUpReconnecting(): void {
    this.reconnectAttempts = 0
    this.abandonReconnection(new Error("Unable to reconnect: queued changes and waiting requests were not sent"))
    this.event.emitConnectionStatusChanged("error")
  }

  /** Fails the queued changes and the requests waiting for the reconnection. */
  protected abandonReconnection(error: Error): void {
    this.clearOfflineQueue(error)
    this.reconnection?.reject(error)
    this.reconnection = undefined
  }

  protected clearOfflineQueue(error: Error): void {
    this.offlineQueue.forEach((item) => item.deferred.reject(error))
    this.offlineQueue = []
  }

  protected clearReconnectLoop(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = undefined
    }
  }

  protected clearSocketListener(): void {
    this.socket.removeEventListener("open", this.boundOpenCallback)
    this.socket.removeEventListener("close", this.boundCloseCallback)
    this.socket.removeEventListener("message", this.boundMessageCallback)
  }

  /**
   * A network drop (1006, also what each failed reconnection attempt reports) once connected,
   * with `autoReconnect` on: the changes are kept and replayed, so it is a state, not an error.
   * Reported as an error, it opened the canvas error modal over the ink every few seconds.
   */
  protected isRecoverableDrop(evt: CloseEvent): boolean {
    return this.hasConnected && evt.code === 1006 && this.configuration.server.websocket.autoReconnect
  }

  protected closeCallback(evt: CloseEvent): void {
    this.logger.info("closeCallback", { evt })
    let message = evt.reason
    if (!this.currentErrorCode) {
      message = mapCloseCodeToMessage(evt.code) ?? ClientError.CANT_ESTABLISH
    }

    this.clearSocketListener()
    this.answer("close", undefined, true)
    if (!this.currentErrorCode && evt.code !== 1000) {
      // Pending requests are rejected either way: a reconnection attempt's init() waits on one
      if (!this.isRecoverableDrop(evt)) {
        this.event.emitError(new Error(message))
      }
      this.rejectDeferredPending(message)
    }
    this.pingWorker?.terminate()
    this.resetAllDeferred()
    this.event.emitConnectionStatusChanged("offline")
  }

  protected openCallback(): void {
    this.sendOnSocket({
      type: "authenticate",
      "myscript-client-name": "iink-ts",
      "myscript-client-version": __IINK_VERSION__,
    })
  }

  protected async manageHMACChallenge(hmacChallengeMessage: TWebSocketClientMessageHMACChallenge): Promise<void> {
    const socket = this.socket
    const hmac = await resolveHmac(this.configuration.server, hmacChallengeMessage.hmacChallenge)
    // The HMAC may take a while: if this socket closed or was replaced meanwhile, its close event
    // already failed its attempt, and sending now would fail the next attempt instead
    if (socket !== this.socket || socket.readyState !== socket.OPEN) {
      return
    }
    this.sendOnSocket({ type: "hmac", hmac })
  }

  /** A handshake step failed: `init()` waits on `initialized`, so it must hear of it, not only the `error` listeners */
  protected failInitialization(error: unknown): void {
    const reason = error instanceof Error ? error : new Error(String(error))
    this.initialized.reject(reason)
    this.event.emitError(reason)
  }

  protected initPing(): void {
    // init() can run again without the close callback having terminated the previous worker.
    this.pingWorker?.terminate()
    this.pingWorker = new PingWorker()
    this.pingWorker.postMessage({ pingDelay: this.configuration.server.websocket.pingDelay })
    this.pingWorker.onmessage = () => {
      if (this.socket.readyState < this.socket.CLOSING) {
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
    this.sendOnSocket({
      type: this.sessionId ? "restoreSession" : "initSession",
      iinkSessionId: this.sessionId,
      scaleX: PX_TO_MM_RATIO,
      scaleY: PX_TO_MM_RATIO,
      configuration: this.configuration.recognition,
    })
  }

  protected manageSessionDescriptionMessage(sessionDescriptionMessage: TInteractiveInkSessionDescriptionMessage): void {
    if (sessionDescriptionMessage.iinkSessionId) {
      this.sessionId = sessionDescriptionMessage.iinkSessionId
      this.event.emitSessionOpened(this.sessionId)
    }
    this.sendOnSocket(
      this.currentPartId
        ? { type: "openContentPart", id: this.currentPartId }
        : { type: "newContentPart", contentType: "Raw Content", mimeTypes: this.mimeTypes }
    )
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
    this.event.emitContentChanged(readHistoryContext(contentChangeMessage))
  }

  protected manageExportMessage(exportMessage: TWebSocketClientMessageExport): void {
    const exports = parseExportedJIIX(exportMessage.exports)
    Object.keys(exports).forEach((key) => this.answer(`export:${key}`, exports))
    this.event.emitExported(exports)
  }

  protected manageWaitForIdle(): void {
    // Every caller waiting for idle is answered by the same idle
    this.answer("idle", undefined, true)
    this.event.emitIdle(true)
  }

  protected manageConfigurationChanged(): void {
    // Every caller waiting for idle is answered by the same idle
    this.answer("configurationChanged", undefined, true)
  }

  protected manageErrorMessage(errorMessage: TWebSocketClientMessageError): void {
    this.currentErrorCode = errorMessage.data?.code || errorMessage.code
    let message = errorMessage.data?.message || errorMessage.message || ClientError.UNKNOWN

    if (this.currentErrorCode === "no.activity") {
      this.rejectDeferredPending(message)
      this.event.emitConnectionClose({ code: 1000, message: ClientError.NO_ACTIVITY })
    } else {
      message = mapErrorCodeToMessage(this.currentErrorCode) ?? message
      this.rejectDeferredPending(message)
      this.event.emitError(new Error(message))
    }
  }

  protected manageAck(): void {
    this.answer("support", undefined)
  }

  protected manageGestureDetected(gestureMessage: TWebSocketClientMessageGesture): void {
    this.event.emitGestureDetected(gestureMessage)
  }

  protected manageContextlessGesture(gestureMessage: TWebSocketClientMessageContextlessGesture): void {
    this.answer(`gesture:${gestureMessage.strokeId}`, gestureMessage)
  }

  protected manageMathSolverResult(mathSolverMessage: TWebSocketClientMessageMathSolverResult): void {
    const blockId =
      mathSolverMessage.action === "get-variable-definitions" ? DOCUMENT_BLOCK_ID : mathSolverMessage.blockId
    if (typeof blockId !== "string") {
      this.logger.warn(
        "manageMathSolverResult",
        "Received math solver result without blockId, unable to resolve corresponding promise",
        mathSolverMessage
      )
      return
    }
    this.answer(`math:${mathSolverMessage.action}:${blockId}`, mathSolverMessage.result)
  }

  protected async requestMathSolver<A extends TMathSolverAction>(
    action: A,
    blockId: string | undefined,
    parameters: Record<string, unknown> = {}
  ): Promise<TMathSolverResultMap[A]> {
    // blockId undefined is dropped by JSON.stringify, as get-variable-definitions expects
    await this.send({ type: "mathSolver", action, blockId, ...parameters })
    const key = `math:${action}:${blockId ?? DOCUMENT_BLOCK_ID}`
    return this.waitForAnswer(key, MATH_SOLVER_NEUTRAL_RESULTS[action]()).promise
  }

  protected messageCallback(message: MessageEvent<string>): void {
    this.currentErrorCode = undefined
    let websocketMessage: unknown
    try {
      websocketMessage = JSON.parse(message.data)
    } catch {
      // The payload is not JSON at all: the payload itself is the useful diagnostic.
      this.event.emitError(new Error(message.data))
      return
    }
    if (!isWebSocketClientMessageReceived(websocketMessage)) {
      this.logger.warn("messageCallback", `Message type unknown: "${message.data}".`)
      return
    }
    try {
      this.dispatchMessage(websocketMessage.type, websocketMessage)
    } catch (error) {
      // A handler threw. Reporting the payload here, as this used to, hid every
      // message-handling bug in the client behind an error that only said what the server sent.
      this.event.emitError(error instanceof Error ? error : new Error(String(error)))
    }
  }

  protected dispatchMessage<K extends TWebSocketClientMessageType>(
    type: K,
    message: TWebSocketClientMessageReceivedMap[K]
  ): void {
    this.messageHandlers[type](message)
  }

  async newSession(config: TPartialDeep<TWebSocketClientConfiguration>): Promise<void> {
    await this.close(1000, "new-session")
    this.mergeConfiguration(config)
    this.sessionId = undefined
    this.currentPartId = undefined
    await this.init()
  }

  async changeConfiguration(config: TPartialDeep<TWebSocketClientConfiguration>): Promise<void> {
    this.mergeConfiguration(config)
    await this.send({ type: "changeConfiguration", configuration: this.configuration.recognition })
    return this.waitForAnswer<void>("configurationChanged", undefined).promise
  }

  protected mergeConfiguration(config: TPartialDeep<TWebSocketClientConfiguration>): void {
    // overrideDeep, not a second mergeDeep source: mergeDeep appends arrays, which would repeat every one on each new session
    this.configuration = overrideDeep(mergeDeep<WebSocketClientConfiguration>({}, this.configuration), config)
  }

  async init(): Promise<void> {
    if (this.connectingPromise) {
      return this.connectingPromise
    }
    this.connectingPromise = this.connect()
      .then(() => this.onConnected())
      .finally(() => {
        this.connectingPromise = null
      })
    return this.connectingPromise
  }

  protected async connect(): Promise<void> {
    this.event.emitStartInitialization()
    if (this.currentErrorCode === "restore.session.not.found") {
      this.currentErrorCode = undefined
      this.sessionId = undefined
      this.currentPartId = undefined
    }
    await ensureServerVersion(this.configuration)
    // A fresh handshake per attempt: a late failure of a previous one must not have rejected it
    this.initialized = new DeferredPromise<void>()
    // An attempt whose handshake failed without a close event leaves its socket open and listening
    if (this.socket) {
      this.clearSocketListener()
      if (this.socket.readyState < this.socket.CLOSING) {
        this.socket.close()
      }
    }
    this.socket = new WebSocket(this.url)
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
    this.assertInitialized()

    switch (this.socket.readyState) {
      case this.socket.CONNECTING:
      case this.socket.OPEN:
        await this.initialized.promise
        // Reconnected but the queue not replayed yet: going now would answer from stale content
        if (this.offlineQueue.length > 0) {
          await this.waitForReconnection()
        }
        this.sendOnSocket(message)
        return
      case this.socket.CLOSING:
      case this.socket.CLOSED:
        if (this.closingPromise) {
          // A deliberate `close()` (e.g. `newSession()`) is already tearing down the socket —
          // wait for it instead of racing our own `init()` against the one it issues right after.
          // The message is not replayed: it was built for the session being closed (its partId,
          // its blockIds), and close() has already settled everything that waited on an answer.
          await this.closingPromise
          return
        }
        if (!this.configuration.server.websocket.autoReconnect) {
          throw new Error("Unable to send message. Connection closed and automatic reconnection disabled")
        }
        await this.waitForReconnection()
        this.sendOnSocket(message)
    }
  }

  // Read per stroke, not once: the server version is only known after the first connection
  protected toWire = (stroke: TRecognitionStroke): TWireStroke =>
    toWireStroke(stroke, { relativeTimestamps: supportsRelativeTimestamps(this.configuration.server.version) })

  protected buildAddStrokesMessage(strokes: TWireStroke[], processGestures = true): TWebSocketClientMessage {
    return { type: "addStrokes", processGestures, strokes }
  }

  /**
   * @remarks Resolves once the message is sent, not once the server acks it — gesture detection
   * results (if any) arrive asynchronously via `event.addGestureDetectedListener`, not this promise.
   */
  async addStrokes(strokes: TRecognitionStroke[], processGestures = true): Promise<void> {
    if (strokes.length === 0) {
      return
    }
    const _processGestures = processGestures && strokes.length < 3
    // Converted once: measuring the groups and sending them read the same wire strokes
    const groups = this.chunkBySize(strokes.map(this.toWire), wireStrokeSize, 1000)
    await Promise.all(groups.map((part) => this.sendChange(this.buildAddStrokesMessage(part, _processGestures))))
  }

  /**
   * Sends a change to the content. While disconnected it is queued and replayed in order once
   * reconnected, rather than lost: the server must end up with every change the canvas made.
   */
  protected sendChange(message: TWebSocketClientMessage): Promise<void> {
    // Queued while disconnected, and also while the queue still waits to be replayed: a change
    // made during the reconnection must not overtake the ones made before it
    if (this.configuration.server.websocket.autoReconnect && (this.isDisconnected() || this.offlineQueue.length > 0)) {
      const deferred = new DeferredPromise<void>()
      this.enqueueOfflineMessage(message, deferred)
      return deferred.promise
    }
    return this.send(message)
  }

  /**
   * Groups `items` so that each group, once sent, stays under `maxMessageBytes`, with at most
   * `maxCount` items. Order is kept; an item larger than the budget goes alone.
   */
  protected chunkBySize<T>(items: T[], sizeOf: (item: T) => number, maxCount = Infinity): T[][] {
    // Room left for the message around the items: its type and other fields.
    const budget = this.maxMessageBytes - 256
    const chunks: T[][] = []
    let current: T[] = []
    let currentBytes = 0
    for (const item of items) {
      const bytes = sizeOf(item) + 1
      if (current.length && (current.length === maxCount || currentBytes + bytes > budget)) {
        chunks.push(current)
        current = []
        currentBytes = 0
      }
      current.push(item)
      currentBytes += bytes
    }
    if (current.length) {
      chunks.push(current)
    }
    return chunks
  }

  /** Sends `build`'s message once per group of `strokeIds` that fits in a frame; nothing for no id. */
  protected async sendPerStrokeIds(
    strokeIds: string[],
    build: (strokeIds: string[]) => TWebSocketClientMessage
  ): Promise<void> {
    await Promise.all(this.chunkBySize(strokeIds, strokeIdSize).map((ids) => this.sendChange(build(ids))))
  }

  async getAvailableActions(blockId: string): Promise<string[]> {
    return this.requestMathSolver("available-actions", blockId)
  }

  async getNumericalComputation(blockId: string): Promise<TJIIXMathElement> {
    return JSON.parse(await this.requestMathSolver("numerical-computation", blockId)) as TJIIXMathElement
  }

  async getDiagnostic(blockId: string, task: string): Promise<string> {
    return this.requestMathSolver("get-diagnostic", blockId, { task })
  }

  async getVariables(blockId: string): Promise<TMathVariable[]> {
    return this.requestMathSolver("get-variables", blockId)
  }

  async getVariableValue(blockId: string, variableName: string): Promise<number> {
    return this.requestMathSolver("get-variable-value", blockId, { variableName })
  }

  async setVariableValue(blockId: string, variableName: string, variableValue: number): Promise<void> {
    await this.requestMathSolver("set-variable-value", blockId, { variableName, variableValue })
  }

  async removeVariableValue(blockId: string, variableName: string): Promise<void> {
    await this.requestMathSolver("remove-variable-value", blockId, { variableName })
  }

  async asVariableDefinition(blockId: string): Promise<TMathVariableDefinition> {
    return this.requestMathSolver("as-variable-definition", blockId)
  }

  async getVariableDefinitions(): Promise<TMathVariableDefinitions[]> {
    return this.requestMathSolver("get-variable-definitions", undefined)
  }

  async getEvaluables(blockId: string): Promise<TMathEvaluable[]> {
    return this.requestMathSolver("get-evaluables", blockId)
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
  ): Promise<Record<string, number>[][]> {
    const result = await this.requestMathSolver("evaluate", blockId, { evaluation })
    // The server returns one flat [x1, y1, x2, y2, ...] array per curve, even for a constant function
    const xKey = evaluation.inputVariableName || "x"
    const yKey = evaluation.outputVariableName || "?"
    return result.map((flat) => {
      const points: Record<string, number>[] = []
      for (let i = 0; i + 1 < flat.length; i += 2) {
        points.push({ [xKey]: flat[i], [yKey]: flat[i + 1] })
      }
      return points
    })
  }

  protected buildReplaceStrokesMessage(oldStrokeIds: string[], newStrokes: TWireStroke[]): TWebSocketClientMessage {
    return { type: "replaceStrokes", oldStrokeIds, newStrokes }
  }

  async replaceStrokes(oldStrokeIds: string[], newStrokes: TRecognitionStroke[]): Promise<void> {
    if (oldStrokeIds.length === 0) {
      return
    }
    // The first group goes with the replacement, the others as plain additions: same content, and
    // no frame over the budget.
    const [first = [], ...rest] = this.chunkBySize(newStrokes.map(this.toWire), wireStrokeSize, 1000)
    await Promise.all([
      this.sendChange(this.buildReplaceStrokesMessage(oldStrokeIds, first)),
      ...rest.map((strokes) => this.sendChange(this.buildAddStrokesMessage(strokes, false))),
    ])
  }

  protected buildTransformTranslateMessage(strokeIds: string[], tx: number, ty: number): TWebSocketClientMessage {
    return { type: "transform", transformationType: "TRANSLATE", strokeIds, tx, ty }
  }

  async transformTranslate(strokeIds: string[], tx: number, ty: number): Promise<void> {
    await this.sendPerStrokeIds(strokeIds, (ids) => this.buildTransformTranslateMessage(ids, tx, ty))
  }

  protected buildTransformRotateMessage(strokeIds: string[], angle: number, x0 = 0, y0 = 0): TWebSocketClientMessage {
    return { type: "transform", transformationType: "ROTATE", strokeIds, angle, x0, y0 }
  }

  async transformRotate(strokeIds: string[], angle: number, x0 = 0, y0 = 0): Promise<void> {
    await this.sendPerStrokeIds(strokeIds, (ids) => this.buildTransformRotateMessage(ids, angle, x0, y0))
  }

  protected buildTransformScaleMessage(
    strokeIds: string[],
    scaleX: number,
    scaleY: number,
    x0 = 0,
    y0 = 0
  ): TWebSocketClientMessage {
    return { type: "transform", transformationType: "SCALE", strokeIds, scaleX, scaleY, x0, y0 }
  }

  async transformScale(strokeIds: string[], scaleX: number, scaleY: number, x0 = 0, y0 = 0): Promise<void> {
    await this.sendPerStrokeIds(strokeIds, (ids) => this.buildTransformScaleMessage(ids, scaleX, scaleY, x0, y0))
  }

  protected buildTransformMatrixMessage(strokeIds: string[], matrix: TMatrixTransform): TWebSocketClientMessage {
    return { type: "transform", transformationType: "MATRIX", strokeIds, ...matrix }
  }

  async transformMatrix(strokeIds: string[], matrix: TMatrixTransform): Promise<void> {
    await this.sendPerStrokeIds(strokeIds, (ids) => this.buildTransformMatrixMessage(ids, matrix))
  }

  protected buildEraseStrokesMessage(strokeIds: string[]): TWebSocketClientMessage {
    return { type: "eraseStrokes", strokeIds }
  }

  async eraseStrokes(strokeIds: string[]): Promise<void> {
    await this.sendPerStrokeIds(strokeIds, (ids) => this.buildEraseStrokesMessage(ids))
  }

  async recognizeGesture(stroke: TRecognitionStroke): Promise<TWebSocketClientMessageContextlessGesture | undefined> {
    if (!stroke) {
      return
    }
    await this.send({
      type: "contextlessGesture",
      scaleX: PX_TO_MM_RATIO,
      scaleY: PX_TO_MM_RATIO,
      stroke: this.toWire(stroke),
    })
    return this.waitForAnswer<TWebSocketClientMessageContextlessGesture>(`gesture:${stroke.id}`, {
      type: TWebSocketClientMessageType.ContextlessGesture,
      strokeId: stroke.id,
      gestureType: "none",
    }).promise
  }

  async waitForIdle(): Promise<void> {
    await this.send({ type: "waitForIdle" })
    return this.waitForAnswer<void>("idle", undefined).promise
  }

  // Not split by `maxMessageBytes`: an undo or redo is one step of the server's history, and
  // spreading it over several messages would record several.
  protected buildUndoRedoChanges(changes: TIIHistoryBackendChanges): TWebSocketClientMessage[] {
    const changesMessages: TWebSocketClientMessage[] = []
    if (changes.added?.length) {
      changesMessages.push(this.buildAddStrokesMessage(changes.added.map(this.toWire), false))
    }
    if (changes.erased?.length) {
      changesMessages.push(this.buildEraseStrokesMessage(changes.erased.map((s) => s.id)))
    }
    if (changes.replaced?.newStrokes.length) {
      const oldIds = changes.replaced.oldStrokes.map((s) => s.id)
      changesMessages.push(this.buildReplaceStrokesMessage(oldIds, changes.replaced.newStrokes.map(this.toWire)))
    }
    return changesMessages
  }

  /** Sends one step of the server's history; nothing when it changes nothing. */
  protected async sendHistoryStep(type: "undo" | "redo", actions: TIIHistoryBackendChanges): Promise<void> {
    const changes = this.buildUndoRedoChanges(actions)
    if (changes.length) {
      await this.sendChange({ type, changes })
    }
  }

  async undo(actions: TIIHistoryBackendChanges): Promise<void> {
    await this.sendHistoryStep("undo", actions)
  }

  async redo(actions: TIIHistoryBackendChanges): Promise<void> {
    await this.sendHistoryStep("redo", actions)
  }

  async export(requestedMimeTypes?: string[]): Promise<TExport> {
    const run = this.exportQueue.then(() => this.sendExport(requestedMimeTypes))
    this.exportQueue = run.catch(() => undefined)
    return run
  }

  protected async sendExport(requestedMimeTypes?: string[]): Promise<TExport> {
    const mimeTypes: string[] = requestedMimeTypes || this.mimeTypes.slice()
    await this.send({ type: "export", partId: this.currentPartId, mimeTypes })
    const none: TExport = {}
    const deferreds = mimeTypes.map((mt) => this.waitForAnswer(`export:${mt}`, none))
    const exports = await Promise.all(deferreds.map((deferred) => deferred.promise))
    return Object.assign({}, ...exports)
  }

  async clear(): Promise<void> {
    await this.sendChange({ type: "clear" })
  }

  async sendToSupport(data: Record<string, unknown>): Promise<void> {
    await this.send({ type: "sendToSupport", metadata: { ...data } })
    return this.waitForAnswer<void>("support", undefined).promise
  }

  async close(code: number, reason: string): Promise<void> {
    this.clearReconnectLoop()
    this.abandonReconnection(new Error(`Client closed (${reason}): queued changes and waiting requests were not sent`))
    this.resolveDeferredPending()
    this.resetAllDeferred()
    // Answered by the socket's close event; an error message arriving meanwhile ends the wait too
    const closed = this.waitForAnswer<void>("close", undefined)
    const doClose = async (): Promise<void> => {
      if (this.socket.readyState < WebSocket.CLOSING) {
        this.socket.close(code, reason)
      } else {
        this.answer("close", undefined, true)
      }
      await closed.promise.catch(() => undefined)
    }
    this.closingPromise = doClose().finally(() => {
      this.closingPromise = null
    })
    await this.closingPromise
  }

  async destroy(): Promise<void> {
    if (this.socket) {
      await this.close(1000, "Client destroyed")
    }
  }
}
