import { TIIHistoryBackendChanges, THistoryContext } from "../history"
import { LoggerCategory, LoggerManager } from "../logger"
import { TExport, TJIIXExport } from "../model"
import { IIStroke } from "../symbol"
import { TMatrixTransform } from "../transform"
import { computeHmac, mergeDeep, DeferredPromise, PartialDeep, isVersionSuperiorOrEqual, getApiInfos } from "../utils"
import
{
  TRecognizerWebSocketMessage,
  TRecognizerWebSocketMessageContentChange,
  TRecognizerWebSocketMessageContextlessGesture,
  TRecognizerWebSocketMessageError,
  TRecognizerWebSocketMessageExport,
  TRecognizerWebSocketMessageGesture,
  TRecognizerWebSocketMessageHMACChallenge,
  TRecognizerWebSocketMessageNewPart,
  TRecognizerWebSocketMessagePartChange,
  TRecognizerWebSocketMessageReceived,
  TRecognizerWebSocketMessageType,
  TInteractiveInkSessionDescriptionMessage
} from "./RecognizerWebSocketMessage"
import { RecognizerError } from "./RecognizerError"
import PingWorker from "web-worker:../worker/ping.worker.ts"
import { RecognizerEvent } from "./RecognizerEvent"
import { RecognizerWebSocketConfiguration, TRecognizerWebSocketConfiguration } from "./RecognizerWebSocketConfiguration"

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
export class RecognizerWebSocket
{
  #logger = LoggerManager.getLogger(LoggerCategory.RECOGNIZER)

  protected socket!: WebSocket
  protected pingWorker?: Worker
  protected pingCount = 0
  protected reconnectionCount = 0
  protected sessionId?: string
  protected currentPartId?: string
  protected currentErrorCode?: string | number

  protected addStrokeDeferred?: DeferredPromise<TRecognizerWebSocketMessageGesture | undefined>
  protected contextlessGestureDeferred: Map<string, DeferredPromise<TRecognizerWebSocketMessageContextlessGesture>>
  protected transformStrokeDeferred?: DeferredPromise<void>
  protected eraseStrokeDeferred?: DeferredPromise<void>
  protected replaceStrokeDeferred?: DeferredPromise<void>
  protected exportDeferredMap: Map<string, DeferredPromise<TExport>>
  protected closeDeferred?: DeferredPromise<void>
  protected waitForIdleDeferred?: DeferredPromise<void>
  protected undoDeferred?: DeferredPromise<void>
  protected redoDeferred?: DeferredPromise<void>
  protected clearDeferred?: DeferredPromise<void>

  configuration: RecognizerWebSocketConfiguration
  initialized: DeferredPromise<void>
  url: string
  event: RecognizerEvent

  constructor(config: PartialDeep<TRecognizerWebSocketConfiguration>, event?: RecognizerEvent)
  {
    this.#logger.info("constructor", { config })
    this.configuration = new RecognizerWebSocketConfiguration(config)
    const scheme = (this.configuration.server.scheme === "https") ? "wss" : "ws"
    this.url = `${ scheme }://${ this.configuration.server.host }/api/v4.0/iink/offscreen?applicationKey=${ this.configuration.server.applicationKey }`

    this.event = event || new RecognizerEvent()
    this.initialized = new DeferredPromise<void>()
    this.exportDeferredMap = new Map()
    this.contextlessGestureDeferred = new Map()
  }

  get mimeTypes(): string[]
  {
    return ["application/vnd.myscript.jiix"]
  }

  async #send(message: TRecognizerWebSocketMessage): Promise<void>
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
      "myscript-client-version": "3.0.0",
    })
  }

  protected async manageHMACChallenge(hmacChallengeMessage: TRecognizerWebSocketMessageHMACChallenge): Promise<void>
  {
    this.#send({
      type: "hmac",
      hmac: await computeHmac(hmacChallengeMessage.hmacChallenge, this.configuration.server.applicationKey, this.configuration.server.hmacKey)
    })
  }

  protected initPing(): void
  {
    this.pingWorker = new PingWorker()
    this.pingWorker.postMessage({
      pingDelay: this.configuration.server.websocket.pingDelay,
    })
    this.pingWorker.onmessage = () =>
    {
      if (this.socket.readyState <= 1) {
        if (this.pingCount < this.configuration.server.websocket.maxPingLostCount) {
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
      configuration: this.configuration.recognition
    })
  }

  protected manageSessionDescriptionMessage(sessionDescriptionMessage: TInteractiveInkSessionDescriptionMessage): void
  {
    if (sessionDescriptionMessage.iinkSessionId) {
      this.sessionId = sessionDescriptionMessage.iinkSessionId
      this.event.emitSessionOpened(this.sessionId)
    }
    if (this.currentPartId) {
      this.#send({ type: "openContentPart", id: this.currentPartId })
    }
    else {
      this.#send({ type: "newContentPart", contentType: "Raw Content", mimeTypes: this.mimeTypes })
    }
  }

  protected manageNewPartMessage(newPartMessage: TRecognizerWebSocketMessageNewPart): void
  {
    this.initialized.resolve()
    this.currentPartId = newPartMessage.id
  }

  protected managePartChangeMessage(partChangeMessage: TRecognizerWebSocketMessagePartChange): void
  {
    this.initialized.resolve()
    this.currentPartId = partChangeMessage.partId
  }

  protected manageContentChangedMessage(contentChangeMessage: TRecognizerWebSocketMessageContentChange): void
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
    } as THistoryContext)
  }

  protected manageExportMessage(exportMessage: TRecognizerWebSocketMessageExport): void
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

  protected manageErrorMessage(errorMessage: TRecognizerWebSocketMessageError): void
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

  protected manageGestureDetected(gestureMessage: TRecognizerWebSocketMessageGesture): void
  {
    this.addStrokeDeferred?.resolve(gestureMessage)
  }

  protected manageContextlessGesture(gestureMessage: TRecognizerWebSocketMessageContextlessGesture): void
  {
    this.contextlessGestureDeferred.get(gestureMessage.strokeId)?.resolve(gestureMessage)
  }

  protected messageCallback(message: MessageEvent<string>): void
  {
    this.currentErrorCode = undefined
    try {
      const websocketMessage: TRecognizerWebSocketMessageReceived = JSON.parse(message.data)
      if (websocketMessage.type === TRecognizerWebSocketMessageType.Pong) {
        return
      }
      this.pingCount = 0
      switch (websocketMessage.type) {
        case TRecognizerWebSocketMessageType.HMAC_Challenge:
          this.manageHMACChallenge(websocketMessage)
          break
        case TRecognizerWebSocketMessageType.Authenticated:
          this.manageAuthenticated()
          break
        case TRecognizerWebSocketMessageType.SessionDescription:
          this.manageSessionDescriptionMessage(websocketMessage)
          break
        case TRecognizerWebSocketMessageType.NewPart:
          this.manageNewPartMessage(websocketMessage)
          break
        case TRecognizerWebSocketMessageType.PartChanged:
          this.managePartChangeMessage(websocketMessage)
          break
        case TRecognizerWebSocketMessageType.ContentChanged:
          this.manageContentChangedMessage(websocketMessage)
          break
        case TRecognizerWebSocketMessageType.Exported:
          this.manageExportMessage(websocketMessage)
          break
        case TRecognizerWebSocketMessageType.GestureDetected:
          this.manageGestureDetected(websocketMessage)
          break
        case TRecognizerWebSocketMessageType.ContextlessGesture:
          this.manageContextlessGesture(websocketMessage)
          break
        case TRecognizerWebSocketMessageType.Error:
          this.manageErrorMessage(websocketMessage)
          break
        case TRecognizerWebSocketMessageType.Idle:
          this.manageWaitForIdle()
          break
        default:
          this.#logger.warn("messageCallback", `Message type unknow: "${ websocketMessage }".`)
          break
      }
    }
    catch {
      this.event.emitError(new Error(message.data))
    }
  }

  async newSession(config: PartialDeep<TRecognizerWebSocketConfiguration>): Promise<void>
  {
    await this.close(1000, "new-session")
    this.configuration = mergeDeep({}, this.configuration, config)
    this.sessionId = undefined
    this.currentPartId = undefined
    await this.init()
  }

  async init(): Promise<void>
  {
    this.event.emitStartInitialization()
    if (this.currentErrorCode === "restore.session.not.found") {
      this.currentErrorCode = undefined
      this.sessionId = undefined
      this.currentPartId = undefined
    }
    this.initialized = new DeferredPromise<void>()
    if (!this.configuration.server.version) {
      this.configuration.server.version = (await getApiInfos(this.configuration)).version
    }
    this.socket = new WebSocket(this.url)
    this.clearSocketListener()
    this.socket.addEventListener("open", this.openCallback.bind(this))
    this.socket.addEventListener("close", this.closeCallback.bind(this))
    this.socket.addEventListener("message", this.messageCallback.bind(this))
    await this.initialized.promise
    if (this.configuration.server.websocket.pingEnabled) {
      this.pingCount = 0
      this.initPing()
    }
    this.event.emitEndtInitialization()
  }

  async send(message: TRecognizerWebSocketMessage): Promise<void>
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
        if (this.configuration.server.websocket.autoReconnect) {
          this.reconnectionCount++
          if (this.configuration.server.websocket.maxRetryCount > this.reconnectionCount) {
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

  protected buildAddStrokesMessage(strokes: IIStroke[], processGestures = true): TRecognizerWebSocketMessage
  {
    return {
      type: "addStrokes",
      processGestures,
      strokes: strokes.map(s => s.formatToSend())
    }
  }
  async addStrokes(strokes: IIStroke[], processGestures = true): Promise<TRecognizerWebSocketMessageGesture | undefined>
  {
    this.addStrokeDeferred = new DeferredPromise<TRecognizerWebSocketMessageGesture | undefined>()
    if (strokes.length === 0) {
      this.addStrokeDeferred.resolve(undefined)
      return this.addStrokeDeferred?.promise
    }
    await this.send(this.buildAddStrokesMessage(strokes, processGestures))
    return this.addStrokeDeferred?.promise
  }

  protected buildReplaceStrokesMessage(oldStrokeIds: string[], newStrokes: IIStroke[]): TRecognizerWebSocketMessage
  {
    return {
      type: "replaceStrokes",
      oldStrokeIds,
      newStrokes: newStrokes.map(s => s.formatToSend())
    }
  }
  async replaceStrokes(oldStrokeIds: string[], newStrokes: IIStroke[]): Promise<void>
  {
    this.replaceStrokeDeferred = new DeferredPromise<void>()
    if (oldStrokeIds.length === 0) {
      this.replaceStrokeDeferred.resolve()
      return this.replaceStrokeDeferred?.promise
    }
    await this.send(this.buildReplaceStrokesMessage(oldStrokeIds, newStrokes))
    return this.replaceStrokeDeferred?.promise
  }

  protected buildTransformTranslateMessage(strokeIds: string[], tx: number, ty: number): TRecognizerWebSocketMessage
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

  protected buildTransformRotateMessage(strokeIds: string[], angle: number, x0: number = 0, y0: number = 0): TRecognizerWebSocketMessage
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

  protected buildTransformScaleMessage(strokeIds: string[], scaleX: number, scaleY: number, x0: number = 0, y0: number = 0): TRecognizerWebSocketMessage
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

  protected buildTransformMatrixMessage(strokeIds: string[], matrix: TMatrixTransform): TRecognizerWebSocketMessage
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

  protected buildEraseStrokesMessage(strokeIds: string[]): TRecognizerWebSocketMessage
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

  async recognizeGesture(stroke: IIStroke): Promise<TRecognizerWebSocketMessageContextlessGesture | undefined>
  {
    if (!stroke) {
      return
    }
    this.contextlessGestureDeferred.set(stroke.id, new DeferredPromise<TRecognizerWebSocketMessageContextlessGesture>())
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
    const message: TRecognizerWebSocketMessage = {
      type: "waitForIdle",
    }
    await this.send(message)
    return this.waitForIdleDeferred?.promise
  }

  protected buildUndoRedoChanges(changes: TIIHistoryBackendChanges): TRecognizerWebSocketMessage[]
  {
    const changesMessages: TRecognizerWebSocketMessage[] = []
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

  async undo(actions: TIIHistoryBackendChanges): Promise<void>
  {
    const changes = this.buildUndoRedoChanges(actions)
    if (changes.length === 0) {
      return
    }
    this.undoDeferred = new DeferredPromise<void>()
    const message: TRecognizerWebSocketMessage = {
      type: "undo",
      changes
    }
    await this.send(message)
    return this.undoDeferred?.promise
  }

  async redo(actions: TIIHistoryBackendChanges): Promise<void>
  {
    const changes = this.buildUndoRedoChanges(actions)
    if (changes.length === 0) {
      return
    }
    this.redoDeferred = new DeferredPromise<void>()

    const message: TRecognizerWebSocketMessage = {
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

    const message: TRecognizerWebSocketMessage = {
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
