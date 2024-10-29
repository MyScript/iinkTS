import { TRecognitionConfiguration, TServerConfiguration } from "../configuration"
import { TOIHistoryBackendChanges, TUndoRedoContext } from "../history"
import { LoggerClass, LoggerManager } from "../logger"
import { TExport, TJIIXExport } from "../model"
import { OIStroke } from "../symbol"
import { TMatrixTransform } from "../transform"
import { computeHmac, DeferredPromise } from "../utils"
import
{
  TOIMessageEvent,
  TOIMessageEventContentChange,
  TOIMessageEventContextlessGesture,
  TOIMessageEventError,
  TOIMessageEventExport,
  TOIMessageEventGesture,
  TOIMessageEventHMACChallenge,
  TOIMessageEventNewPart,
  TOIMessageEventPartChange,
  TOIMessageReceived,
  TOIMessageType,
  TOISessionDescriptionMessage
} from "./OIRecognizerMessage"
import { RecognizerError } from "./RecognizerError"
import PingWorker from "web-worker:../worker/ping.worker.ts"
import { RecognizerEvent } from "./RecognizerEvent"

/**
 * A websocket dialog have this sequence :
 * --------------- Client --------------------------------------------------------------- Server ---------------
 * { type: "authenticate" }                           ==================>
 *                                                    <==================       { type: "hmacChallenge" }
 * { type: "hmac" }                                   ==================>
 *                                                    <==================       { type: "authenticated" }
 * { type: "initSession" | "restoreSession" }         ==================>
 *                                                    <==================       { type: "sessionDescription" }
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
 * @group Recognizer
 */
export class OIRecognizer
{
  #logger = LoggerManager.getLogger(LoggerClass.RECOGNIZER)
  protected serverConfiguration: TServerConfiguration
  protected recognitionConfiguration: TRecognitionConfiguration

  protected socket!: WebSocket
  protected pingWorker?: Worker
  protected pingCount = 0
  protected reconnectionCount = 0
  protected sessionId?: string
  protected currentPartId?: string
  protected currentErrorCode?: string | number


  protected addStrokeDeferred?: DeferredPromise<TOIMessageEventGesture | undefined>
  protected contextlessGestureDeferred: Map<string, DeferredPromise<TOIMessageEventContextlessGesture>>
  protected transformStrokeDeferred?: DeferredPromise<void>
  protected eraseStrokeDeferred?: DeferredPromise<void>
  protected replaceStrokeDeferred?: DeferredPromise<void>
  protected exportDeferredMap: Map<string, DeferredPromise<TExport>>
  protected closeDeferred?: DeferredPromise<void>
  protected waitForIdleDeferred?: DeferredPromise<void>
  protected undoDeferred?: DeferredPromise<void>
  protected redoDeferred?: DeferredPromise<void>
  protected clearDeferred?: DeferredPromise<void>

  initialized: DeferredPromise<void>
  url: string
  event: RecognizerEvent

  constructor(serverConfig: TServerConfiguration, recognitionConfig: TRecognitionConfiguration, event?: RecognizerEvent)
  {
    this.#logger.info("constructor", { serverConfig, recognitionConfig })
    this.serverConfiguration = serverConfig
    this.recognitionConfiguration = recognitionConfig
    const scheme = (this.serverConfiguration.scheme === "https") ? "wss" : "ws"
    this.url = `${ scheme }://${ this.serverConfiguration.host }/api/v4.0/iink/offscreen?applicationKey=${ this.serverConfiguration.applicationKey }`

    this.event = event || new RecognizerEvent()
    this.initialized = new DeferredPromise<void>()
    this.exportDeferredMap = new Map()
    this.contextlessGestureDeferred = new Map()
  }

  get mimeTypes(): string[]
  {
    return ["application/vnd.myscript.jiix"]
  }

  async #send(message: TOIMessageEvent): Promise<void>
  {
    if (!this.socket) {
      throw new Error("Recognizer must be initilized")
    }
    if (this.socket.readyState === this.socket.OPEN) {
      this.socket.send(JSON.stringify(message))
    }
    else {
      throw new Error(`Can not send message: ${message.type}, connection not ready, state: ${ this.socket.readyState }`)
    }
  }

  protected rejectDeferredPending(error: Error | string): void
  {
    this.initialized.reject(error)
    this.addStrokeDeferred?.reject(error)
    this.transformStrokeDeferred?.reject(error)
    this.eraseStrokeDeferred?.reject(error)
    this.replaceStrokeDeferred?.reject(error)
    this.undoDeferred?.reject(error)
    this.redoDeferred?.reject(error)
    this.clearDeferred?.reject(error)
    Array.from(this.contextlessGestureDeferred.values())
      .forEach(v =>
      {
        v.reject(error)
      })
    Array.from(this.exportDeferredMap.values())
      .forEach(v =>
      {
        v.reject(error)
      })
    this.waitForIdleDeferred?.reject(error)
  }

  protected resetAllDeferred(): void
  {
    this.initialized = new DeferredPromise<void>()
    this.addStrokeDeferred = undefined
    this.contextlessGestureDeferred.clear()
    this.transformStrokeDeferred = undefined
    this.eraseStrokeDeferred = undefined
    this.replaceStrokeDeferred = undefined
    this.exportDeferredMap.clear()
    this.waitForIdleDeferred = undefined
    this.closeDeferred = undefined
  }

  protected clearSocketListener(): void
  {
    this.socket.removeEventListener("open", this.openCallback.bind(this))
    this.socket.removeEventListener("close", this.closeCallback.bind(this))
    this.socket.removeEventListener("message", this.messageCallback.bind(this))
  }

  protected closeCallback(evt: CloseEvent): void
  {
    this.#logger.info("closeCallback", { evt })
    let message = evt.reason
    if (!this.currentErrorCode) {
      switch (evt.code) {
        case 1000:
          // Normal Closure
          break
        case 1001:
          message = RecognizerError.GOING_AWAY
          break
        case 1002:
          message = RecognizerError.PROTOCOL_ERROR
          break
        case 1003:
          message = RecognizerError.UNSUPPORTED_DATA
          break
        case 1006:
          message = RecognizerError.ABNORMAL_CLOSURE
          break
        case 1007:
          message = RecognizerError.INVALID_FRAME_PAYLOAD
          break
        case 1008:
          message = RecognizerError.POLICY_VIOLATION
          break
        case 1009:
          message = RecognizerError.MESSAGE_TOO_BIG
          break
        case 1011:
          message = RecognizerError.INTERNAL_ERROR
          break
        case 1012:
          message = RecognizerError.SERVICE_RESTART
          break
        case 1013:
          message = RecognizerError.TRY_AGAIN
          break
        case 1014:
          message = RecognizerError.BAD_GATEWAY
          break
        case 1015:
          message = RecognizerError.TLS_HANDSHAKE
          break
        default:
          message = RecognizerError.CANT_ESTABLISH
          break
      }
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
  }

  protected openCallback(): void
  {
    this.reconnectionCount = 0
    this.#send({
      type: "authenticate",
      "myscript-client-name": "iink-ts",
      "myscript-client-version": "1.0.0-buildVersion",
    })
  }

  protected async manageHMACChallenge(hmacChallengeMessage: TOIMessageEventHMACChallenge): Promise<void>
  {
    this.#send({
      type: "hmac",
      hmac: await computeHmac(hmacChallengeMessage.hmacChallenge, this.serverConfiguration.applicationKey, this.serverConfiguration.hmacKey)
    })
  }

  protected initPing(): void
  {
    this.pingWorker = new PingWorker()
    this.pingWorker.postMessage({
      pingDelay: this.serverConfiguration.websocket.pingDelay,
    })
    this.pingWorker.onmessage = () =>
    {
      if (this.socket.readyState <= 1) {
        if (this.pingCount < this.serverConfiguration.websocket.maxPingLostCount) {
          this.send({ type: "ping" })
        }
        else {
          this.close(1000, "MAXIMUM_PING_REACHED")
          this.pingWorker?.terminate()
        }
        this.pingCount++
      }
    }
  }

  protected manageAuthenticated(): void
  {
    const pixelTomm = 25.4 / 96
    this.#send({
      type: this.sessionId ? "restoreSession" : "initSession",
      iinkSessionId: this.sessionId,
      scaleX: pixelTomm,
      scaleY: pixelTomm,
      configuration: this.recognitionConfiguration
    })
  }

  protected manageSessionDescriptionMessage(sessionDescriptionMessage: TOISessionDescriptionMessage): void
  {
    if (sessionDescriptionMessage.iinkSessionId) {
      this.sessionId = sessionDescriptionMessage.iinkSessionId
      this.event.emitSessionOpened(this.sessionId)
    }
    if (this.currentPartId) {
      this.#send({ type: "openContentPart", id: this.currentPartId })
    }
    else {
      this.#send({ type: "newContentPart", contentType: this.recognitionConfiguration.type, mimeTypes: this.mimeTypes })
    }
  }

  protected manageNewPartMessage(newPartMessage: TOIMessageEventNewPart): void
  {
    this.initialized.resolve()
    this.currentPartId = newPartMessage.id
  }

  protected managePartChangeMessage(partChangeMessage: TOIMessageEventPartChange): void
  {
    this.initialized.resolve()
    this.currentPartId = partChangeMessage.partId
  }

  protected manageContentChangedMessage(contentChangeMessage: TOIMessageEventContentChange): void
  {
    this.initialized.resolve()
    this.replaceStrokeDeferred?.resolve()
    this.transformStrokeDeferred?.resolve()
    this.eraseStrokeDeferred?.resolve()
    this.undoDeferred?.resolve()
    this.redoDeferred?.resolve()
    this.clearDeferred?.resolve()
    this.event.emitContentChanged({
      canRedo: contentChangeMessage.canRedo,
      canUndo: contentChangeMessage.canRedo,
    } as TUndoRedoContext)
  }

  protected manageExportMessage(exportMessage: TOIMessageEventExport): void
  {
    if (exportMessage.exports["application/vnd.myscript.jiix"]) {
      exportMessage.exports["application/vnd.myscript.jiix"] = JSON.parse(exportMessage.exports["application/vnd.myscript.jiix"].toString()) as TJIIXExport
    }

    Object.keys(exportMessage.exports)
      .forEach(key =>
      {
        if (this.exportDeferredMap.has(key)) {
          this.exportDeferredMap.get(key)!.resolve(exportMessage.exports)
        }
      })
    this.event.emitExported(exportMessage.exports)
  }

  protected manageWaitForIdle(): void
  {
    this.waitForIdleDeferred?.resolve()
    this.event.emitIdle(true)
  }

  protected manageErrorMessage(errorMessage: TOIMessageEventError): void
  {
    this.currentErrorCode = errorMessage.data?.code || errorMessage.code
    let message = errorMessage.data?.message || errorMessage.message || RecognizerError.UNKNOW

    if (this.currentErrorCode === "no.activity") {
      this.rejectDeferredPending(message)
      this.event.emitConnectionClose({ code: 1000,  message: RecognizerError.NO_ACTIVITY })
    }
    else {
      switch (this.currentErrorCode) {
        case "access.not.granted":
          message = RecognizerError.WRONG_CREDENTIALS
          break
        case "session.too.old":
          message = RecognizerError.TOO_OLD
          break
        case "restore.session.not.found":
          message = RecognizerError.NO_SESSION_FOUND
          break
      }
      this.rejectDeferredPending(message)
      this.event.emitError(new Error(message))
    }
  }

  protected manageGestureDetected(gestureMessage: TOIMessageEventGesture): void
  {
    this.addStrokeDeferred?.resolve(gestureMessage)
  }

  protected manageContextlessGesture(gestureMessage: TOIMessageEventContextlessGesture): void
  {
    this.contextlessGestureDeferred.get(gestureMessage.strokeId)?.resolve(gestureMessage)
  }

  protected messageCallback(message: MessageEvent<string>): void
  {
    this.currentErrorCode = undefined
    try {
      const websocketMessage: TOIMessageReceived = JSON.parse(message.data)
      if (websocketMessage.type === TOIMessageType.Pong) {
        return
      }
      this.pingCount = 0
      switch (websocketMessage.type) {
        case TOIMessageType.HMAC_Challenge:
          this.manageHMACChallenge(websocketMessage)
          break
        case TOIMessageType.Authenticated:
          this.manageAuthenticated()
          break
        case TOIMessageType.SessionDescription:
          this.manageSessionDescriptionMessage(websocketMessage)
          break
        case TOIMessageType.NewPart:
          this.manageNewPartMessage(websocketMessage)
          break
        case TOIMessageType.PartChanged:
          this.managePartChangeMessage(websocketMessage)
          break
        case TOIMessageType.ContentChanged:
          this.manageContentChangedMessage(websocketMessage)
          break
        case TOIMessageType.Exported:
          this.manageExportMessage(websocketMessage)
          break
        case TOIMessageType.GestureDetected:
          this.manageGestureDetected(websocketMessage)
          break
        case TOIMessageType.ContextlessGesture:
          this.manageContextlessGesture(websocketMessage)
          break
        case TOIMessageType.Error:
          this.manageErrorMessage(websocketMessage)
          break
        case TOIMessageType.Idle:
          this.manageWaitForIdle()
          break
        default:
          this.#logger.warn("messageCallback", `Message type unknow: "${ websocketMessage }".`)
          break
      }
    }
    catch (error) {
      this.event.emitError(new Error(message.data))
    }
  }

  async newSession(serverConfiguration?: TServerConfiguration, recognitionConfiguration?: TRecognitionConfiguration): Promise<void>
  {
    await this.close(1000, "new-session")
    if (serverConfiguration) {
      this.serverConfiguration = serverConfiguration
    }
    if (recognitionConfiguration) {
      this.recognitionConfiguration = recognitionConfiguration
    }
    this.sessionId = undefined
    this.currentPartId = undefined
    await this.init()
  }

  async init(): Promise<void>
  {
    this.event.emitStartInitialization()
    if (this.currentErrorCode === "restore.session.not.found") {
      this.currentErrorCode === undefined
      this.sessionId = undefined
      this.currentPartId = undefined
    }
    this.initialized = new DeferredPromise<void>()
    this.socket = new WebSocket(this.url)
    this.clearSocketListener()
    this.socket.addEventListener("open", this.openCallback.bind(this))
    this.socket.addEventListener("close", this.closeCallback.bind(this))
    this.socket.addEventListener("message", this.messageCallback.bind(this))
    await this.initialized.promise
    if (this.serverConfiguration.websocket.pingEnabled) {
      this.pingCount = 0
      this.initPing()
    }
    this.event.emitEndtInitialization()
  }

  async send(message: TOIMessageEvent): Promise<void>
  {
    if (!this.socket) {
      return Promise.reject(new Error("Recognizer must be initilized"))
    }

    switch (this.socket.readyState) {
      case this.socket.CONNECTING:
      case this.socket.OPEN:
        await this.initialized.promise
        this.#send(message)
        return Promise.resolve()
      case this.socket.CLOSING:
      case this.socket.CLOSED:
        if (this.serverConfiguration.websocket.autoReconnect) {
          this.reconnectionCount++
          if (this.serverConfiguration.websocket.maxRetryCount > this.reconnectionCount) {
            await this.init()
            await this.waitForIdle()
            return this.#send(message)
          }
          else {
            return Promise.reject(new Error("Unable to send message. The maximum number of connection attempts has been reached."))
          }
        }
        else {
          return Promise.reject(new Error("Unable to send message. Connection closed and automatic reconnection disabled"))
        }
        break
    }
  }

  protected buildAddStrokesMessage(strokes: OIStroke[], processGestures = true): TOIMessageEvent
  {
    return {
      type: "addStrokes",
      processGestures,
      strokes: strokes.map(s => s.formatToSend())
    }
  }
  async addStrokes(strokes: OIStroke[], processGestures = true): Promise<TOIMessageEventGesture | undefined>
  {
    this.addStrokeDeferred = new DeferredPromise<TOIMessageEventGesture | undefined>()
    if (strokes.length === 0) {
      this.addStrokeDeferred.resolve(undefined)
      return this.addStrokeDeferred?.promise
    }
    await this.send(this.buildAddStrokesMessage(strokes, processGestures))
    return this.addStrokeDeferred?.promise
  }

  protected buildReplaceStrokesMessage(oldStrokeIds: string[], newStrokes: OIStroke[]): TOIMessageEvent
  {
    return {
      type: "replaceStrokes",
      oldStrokeIds,
      newStrokes: newStrokes.map(s => s.formatToSend())
    }
  }
  async replaceStrokes(oldStrokeIds: string[], newStrokes: OIStroke[]): Promise<void>
  {
    this.replaceStrokeDeferred = new DeferredPromise<void>()
    if (oldStrokeIds.length === 0) {
      this.replaceStrokeDeferred.resolve()
      return this.replaceStrokeDeferred?.promise
    }
    await this.send(this.buildReplaceStrokesMessage(oldStrokeIds, newStrokes))
    return this.replaceStrokeDeferred?.promise
  }

  protected buildTransformTranslateMessage(strokeIds: string[], tx: number, ty: number): TOIMessageEvent
  {
    return {
      type: "transform",
      transformationType: "TRANSLATE",
      strokeIds,
      tx,
      ty
    }
  }
  async transformTranslate(strokeIds: string[], tx: number, ty: number): Promise<void>
  {
    this.transformStrokeDeferred = new DeferredPromise<void>()
    if (strokeIds.length === 0) {
      this.transformStrokeDeferred.resolve()
      return this.transformStrokeDeferred?.promise
    }
    await this.send(this.buildTransformTranslateMessage(strokeIds, tx, ty))
    return this.transformStrokeDeferred?.promise
  }

  protected buildTransformRotateMessage(strokeIds: string[], angle: number, x0: number = 0, y0: number = 0): TOIMessageEvent
  {
    return {
      type: "transform",
      transformationType: "ROTATE",
      strokeIds,
      angle,
      x0,
      y0
    }
  }
  async transformRotate(strokeIds: string[], angle: number, x0: number = 0, y0: number = 0): Promise<void>
  {
    this.transformStrokeDeferred = new DeferredPromise<void>()
    if (strokeIds.length === 0) {
      this.transformStrokeDeferred.resolve()
      return this.transformStrokeDeferred?.promise
    }
    await this.send(this.buildTransformRotateMessage(strokeIds, angle, x0, y0))
    return this.transformStrokeDeferred?.promise
  }

  protected buildTransformScaleMessage(strokeIds: string[], scaleX: number, scaleY: number, x0: number = 0, y0: number = 0): TOIMessageEvent
  {
    return {
      type: "transform",
      transformationType: "SCALE",
      strokeIds,
      scaleX,
      scaleY,
      x0,
      y0
    }
  }
  async transformScale(strokeIds: string[], scaleX: number, scaleY: number, x0: number = 0, y0: number = 0): Promise<void>
  {
    this.transformStrokeDeferred = new DeferredPromise<void>()
    if (strokeIds.length === 0) {
      this.transformStrokeDeferred.resolve()
      return this.transformStrokeDeferred?.promise
    }
    await this.send(this.buildTransformScaleMessage(strokeIds, scaleX, scaleY, x0, y0))
    return this.transformStrokeDeferred?.promise
  }

  protected buildTransformMatrixMessage(strokeIds: string[], matrix: TMatrixTransform): TOIMessageEvent
  {
    return {
      type: "transform",
      transformationType: "MATRIX",
      strokeIds,
      ...matrix
    }
  }
  async transformMatrix(strokeIds: string[], matrix: TMatrixTransform): Promise<void>
  {
    this.transformStrokeDeferred = new DeferredPromise<void>()
    if (strokeIds.length === 0) {
      this.transformStrokeDeferred.resolve()
      return this.transformStrokeDeferred?.promise
    }
    await this.send(this.buildTransformMatrixMessage(strokeIds, matrix))
    return this.transformStrokeDeferred?.promise
  }

  protected buildEraseStrokesMessage(strokeIds: string[]): TOIMessageEvent
  {
    return {
      type: "eraseStrokes",
      strokeIds
    }
  }
  async eraseStrokes(strokeIds: string[]): Promise<void>
  {
    this.eraseStrokeDeferred = new DeferredPromise<void>()
    if (strokeIds.length === 0) {
      this.eraseStrokeDeferred.resolve()
      return this.eraseStrokeDeferred?.promise
    }
    await this.send(this.buildEraseStrokesMessage(strokeIds))
    return this.eraseStrokeDeferred?.promise
  }

  async recognizeGesture(stroke: OIStroke): Promise<TOIMessageEventContextlessGesture | undefined>
  {
    if (!stroke) {
      return
    }
    this.contextlessGestureDeferred.set(stroke.id, new DeferredPromise<TOIMessageEventContextlessGesture>())
    const pixelTomm = 25.4 / 96
    await this.send({
      type: "contextlessGesture",
      scaleX: pixelTomm,
      scaleY: pixelTomm,
      stroke: stroke.formatToSend()
    })
    return this.contextlessGestureDeferred.get(stroke.id)!.promise
  }

  async waitForIdle(): Promise<void>
  {
    if (!this.waitForIdleDeferred || this.waitForIdleDeferred.isFullFilled) {
      this.waitForIdleDeferred = new DeferredPromise<void>()
    }
    const message: TOIMessageEvent = {
      type: "waitForIdle",
    }
    await this.send(message)
    return this.waitForIdleDeferred?.promise
  }

  protected buildUndoRedoChanges(changes: TOIHistoryBackendChanges): TOIMessageEvent[]
  {
    const changesMessages: TOIMessageEvent[] = []
    if (changes.added?.length) {
      changesMessages.push(this.buildAddStrokesMessage(changes.added, false))
    }
    if (changes.erased?.length) {
      changesMessages.push(this.buildEraseStrokesMessage(changes.erased.map(s => s.id)))
    }
    if (changes.replaced?.newStrokes.length) {
      changesMessages.push(this.buildReplaceStrokesMessage(changes.replaced.oldStrokes.map(s => s.id), changes.replaced.newStrokes))
    }
    if (changes.matrix?.strokes.length) {
      changesMessages.push(this.buildTransformMatrixMessage(changes.matrix.strokes.map(s => s.id), changes.matrix.matrix))
    }
    if (changes.translate?.length) {
      changes.translate.forEach(tr =>
      {
        changesMessages.push(this.buildTransformTranslateMessage(tr.strokes.map(s => s.id), tr.tx, tr.ty))
      })
    }
    if (changes.rotate?.length) {
      changes.rotate.forEach(tr =>
      {
        changesMessages.push(this.buildTransformRotateMessage(tr.strokes.map(s => s.id), tr.angle, tr.center.x, tr.center.y))
      })
    }
    if (changes.scale?.length) {
      changes.scale.forEach(tr =>
      {
        changesMessages.push(this.buildTransformScaleMessage(tr.strokes.map(s => s.id), tr.scaleX, tr.scaleY, tr.origin.x, tr.origin.y))
      })
    }
    return changesMessages
  }

  async undo(actions: TOIHistoryBackendChanges): Promise<void>
  {
    const changes = this.buildUndoRedoChanges(actions)
    if (changes.length === 0) {
      return
    }
    this.undoDeferred = new DeferredPromise<void>()
    const message: TOIMessageEvent = {
      type: "undo",
      changes
    }
    await this.send(message)
    return this.undoDeferred?.promise
  }

  async redo(actions: TOIHistoryBackendChanges): Promise<void>
  {
    const changes = this.buildUndoRedoChanges(actions)
    if (changes.length === 0) {
      return
    }
    this.redoDeferred = new DeferredPromise<void>()

    const message: TOIMessageEvent = {
      type: "redo",
      changes
    }
    await this.send(message)
    return this.redoDeferred?.promise
  }

  async export(requestedMimeTypes?: string[]): Promise<TExport>
  {
    const mimeTypes: string[] = requestedMimeTypes || this.mimeTypes.slice()
    await Promise.all(mimeTypes.map(mt => this.exportDeferredMap.get(mt)?.promise))
    mimeTypes.forEach(mt =>
    {
      this.exportDeferredMap.set(mt, new DeferredPromise<TExport>())
    })

    const message: TOIMessageEvent = {
      type: "export",
      partId: this.currentPartId,
      mimeTypes
    }
    await this.send(message)
    const exports = await Promise.all(mimeTypes.map(mt => this.exportDeferredMap.get(mt)!.promise))
    return Object.assign({}, ...exports)
  }

  async clear(): Promise<void>
  {
    this.clearDeferred = new DeferredPromise<void>()
    await this.send({
      type: "clear"
    })
    return this.clearDeferred?.promise
  }

  async close(code: number, reason: string): Promise<void>
  {
    this.resetAllDeferred()
    this.closeDeferred = new DeferredPromise<void>()
    if (this.socket.readyState === this.socket.OPEN || this.socket.readyState === this.socket.CONNECTING) {
      this.socket.close(code, reason)
    }
    else {
      this.closeDeferred.resolve()
    }
    await this.closeDeferred.promise
  }

  async destroy(): Promise<void>
  {
    if (this.socket) {
      await this.close(1000, "Recognizer destroyed")
    }
  }
}
