import { TRecognitionConfiguration, TServerConfiguration } from "../configuration"
import { Error as ErrorConst, LoggerClass } from "../Constants"
import { InternalEvent } from "../event"
import { LoggerManager } from "../logger"
import { TExport, TJIIXExport } from "../model"
import { OIStroke } from "../primitive"
import { TMatrixTransform } from "../transform"
import { computeHmac, DeferredPromise, isVersionSuperiorOrEqual } from "../utils"
import { TOIMessageEvent, TOIMessageEventContextlessGesture, TOIMessageEventError, TOIMessageEventExport, TOIMessageEventGesture, TOIMessageEventHMACChallenge, TOIMessageEventPartChange } from "./OIRecognizerMessage"

/**
 * A websocket dialog have this sequence :
 * --------------------------- Client --------------------------------------------------- Server ----------------------------------
 * init: send newContentPackage or restoreIInkSession           ==================>
 *                                                              <==================       hmacChallenge
 * answer hmacChallenge: send the hmac                          ==================>
 *                                                              <==================       contentPackageDescription
 * answer contentPackageDescription:
 *  send the configuration                                      ==================>
 *  send newContentPart or openContentPart                      ==================>
 *                                                              <==================        partChanged
 *                                                              <==================        contentChanged
 *                                                              <==================        newPart
 *
 * addStrokes (send the strokes ) ============>
 *                                                              <==================        update
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
  protected pingCount = 0
  protected reconnectionCount = 0
  protected sessionId?: string
  protected currentPartId?: string
  protected currentErrorCode?: string | number

  protected connected?: DeferredPromise<void>
  protected initialized?: DeferredPromise<void>
  protected ackDeferred?: DeferredPromise<void>
  protected addStrokeDeferred?: DeferredPromise<TOIMessageEventGesture | undefined>
  protected recognizeGestureDeferred?: DeferredPromise<TOIMessageEventContextlessGesture | undefined>
  protected transformStrokeDeferred?: DeferredPromise<void>
  protected eraseStrokeDeferred?: DeferredPromise<void>
  protected replaceStrokeDeferred?: DeferredPromise<void>
  protected exportDeferred?: DeferredPromise<TExport>
  protected closeDeferred?: DeferredPromise<void>
  protected waitForIdleDeferred?: DeferredPromise<void>

  url: string

  constructor(serverConfig: TServerConfiguration, recognitionConfig: TRecognitionConfiguration)
  {
    this.#logger.info("constructor", { serverConfig, recognitionConfig })
    this.serverConfiguration = serverConfig
    this.recognitionConfiguration = recognitionConfig
    const scheme = (this.serverConfiguration.scheme === "https") ? "wss" : "ws"
    this.url = `${ scheme }://${ this.serverConfiguration.host }/api/v4.0/iink/offscreen?applicationKey=${ this.serverConfiguration.applicationKey }`
  }

  get mimeTypes(): string[]
  {
    return ["application/vnd.myscript.jiix"]
  }

  get internalEvent(): InternalEvent
  {
    return InternalEvent.getInstance()
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
          message = ErrorConst.GOING_AWAY
          break
        case 1002:
          message = ErrorConst.PROTOCOL_ERROR
          break
        case 1003:
          message = ErrorConst.UNSUPPORTED_DATA
          break
        case 1006:
          message = ErrorConst.ABNORMAL_CLOSURE
          break
        case 1007:
          message = ErrorConst.INVALID_FRAME_PAULOAD
          break
        case 1008:
          message = ErrorConst.POLICY_VIOLATION
          break
        case 1009:
          message = ErrorConst.MESSAGE_TOO_BIG
          break
        case 1011:
          message = ErrorConst.INTERNAL_ERROR
          break
        case 1012:
          message = ErrorConst.SERVICE_RESTART
          break
        case 1013:
          message = ErrorConst.TRY_AGAIN
          break
        case 1014:
          message = ErrorConst.BAD_GATEWAY
          break
        case 1015:
          message = ErrorConst.TLS_HANDSHAKE
          break
        default:
          message = ErrorConst.CANT_ESTABLISH
          break
      }
    }

    this.rejectDeferredPending(message)

    if (!this.currentErrorCode && evt.code !== 1000) {
      const error = new Error(message)
      this.internalEvent.emitError(error)
    }
    this.internalEvent.emitWSClosed()
  }

  protected infinitePing(): void
  {
    if (this.serverConfiguration.websocket.maxPingLostCount < this.pingCount) {
      this.socket.close(1000, "PING_LOST")
      this.initialized = undefined
    } else if (this.socket.readyState <= 1) {
      setTimeout(() =>
      {
        if (this.socket.readyState === this.socket.OPEN) {
          this.socket.send(JSON.stringify({ type: "ping" }))
          this.pingCount++
        } else {
          this.#logger.info("infinitePing", "try to ping but websocket is not open yet")
        }
        this.infinitePing()
      }, this.serverConfiguration.websocket.pingDelay)
    }
  }

  protected async waitPromises(): Promise<void>
  {
    await Promise.all([
      this.initialized?.promise,
      this.addStrokeDeferred?.promise,
      this.transformStrokeDeferred?.promise,
      this.replaceStrokeDeferred?.promise,
      this.eraseStrokeDeferred?.promise
    ])
    return Promise.resolve()
  }

  protected rejectDeferredPending(error: Error | string): void
  {
    if (this.connected?.isPending) {
      this.connected?.reject(error)
    }
    if (this.initialized?.isPending) {
      this.initialized?.reject(error)
    }
    if (this.addStrokeDeferred?.isPending) {
      this.addStrokeDeferred?.reject(error)
    }
    if (this.recognizeGestureDeferred?.isPending) {
      this.recognizeGestureDeferred?.reject(error)
    }
    if (this.transformStrokeDeferred?.isPending) {
      this.transformStrokeDeferred?.reject(error)
    }
    if (this.eraseStrokeDeferred?.isPending) {
      this.eraseStrokeDeferred?.reject(error)
    }
    if (this.replaceStrokeDeferred?.isPending) {
      this.replaceStrokeDeferred?.reject(error)
    }
    if (this.exportDeferred?.isPending) {
      this.exportDeferred?.reject(error)
    }
    if (this.waitForIdleDeferred?.isPending) {
      this.waitForIdleDeferred?.reject(error)
    }
    if (this.closeDeferred?.isPending) {
      this.closeDeferred?.resolve()
    }
  }

  protected openCallback(): void
  {
    this.connected?.resolve()
    const pixelTomm = 25.4 / 96
    const params: TOIMessageEvent = {
      type: this.sessionId ? "restoreIInkSession" : "newContentPackage",
      iinkSessionId: this.sessionId,
      applicationKey: this.serverConfiguration.applicationKey,
      scaleX: pixelTomm,
      scaleY: pixelTomm
    }
    if (isVersionSuperiorOrEqual(this.serverConfiguration.version, "2.0.4")) {
      params["myscript-client-name"] = "iink-ts"
      params["myscript-client-version"] = "2.0.0-alpha.8"
    }
    this.send(params)
  }

  protected async manageAckMessage(websocketMessage: TOIMessageEvent): Promise<void>
  {
    const hmacChallengeMessage = websocketMessage as TOIMessageEventHMACChallenge
    if (hmacChallengeMessage.hmacChallenge) {
      this.send({
        type: "hmac",
        hmac: await computeHmac(hmacChallengeMessage.hmacChallenge, this.serverConfiguration.applicationKey, this.serverConfiguration.hmacKey)
      })
    }
    if (hmacChallengeMessage.iinkSessionId) {
      this.sessionId = hmacChallengeMessage.iinkSessionId
    }
    this.send({ ...this.recognitionConfiguration, type: "configuration" })
    this.ackDeferred?.resolve()
  }

  protected async manageContentPackageDescriptionMessage(): Promise<void>
  {
    await this.ackDeferred?.promise
    this.reconnectionCount = 0
    if (this.currentPartId) {
      this.send({ type: "openContentPart", id: this.currentPartId, mimeTypes: this.mimeTypes })
    }
    else {
      this.send({ type: "newContentPart", contentType: this.recognitionConfiguration.type, mimeTypes: this.mimeTypes })
    }
  }

  protected managePartChangeMessage(websocketMessage: TOIMessageEvent): void
  {
    const partChangeMessage = websocketMessage as TOIMessageEventPartChange
    this.currentPartId = partChangeMessage.partId
    this.initialized?.resolve()
  }

  protected manageExportMessage(websocketMessage: TOIMessageEvent): void
  {
    const exportMessage = websocketMessage as TOIMessageEventExport
    if (exportMessage.exports["application/vnd.myscript.jiix"]) {
      exportMessage.exports["application/vnd.myscript.jiix"] = JSON.parse(exportMessage.exports["application/vnd.myscript.jiix"].toString()) as TJIIXExport
    }
    this.exportDeferred?.resolve(exportMessage.exports)
    this.internalEvent.emitExported(exportMessage.exports)
  }

  protected async manageWaitForIdle(): Promise<void>
  {
    this.waitForIdleDeferred?.resolve()
    this.internalEvent.emitIdle(true)
  }

  protected manageErrorMessage(websocketMessage: TOIMessageEvent): void
  {
    const err = websocketMessage as TOIMessageEventError
    this.currentErrorCode = err.data?.code || err.code
    let message = err.data?.message || err.message || ErrorConst.UNKNOW

    switch (this.currentErrorCode) {
      case "no.activity":
        message = ErrorConst.NO_ACTIVITY
        break
      case "access.not.granted":
        message = ErrorConst.WRONG_CREDENTIALS
        break
      case "session.too.old":
        message = ErrorConst.TOO_OLD
        break
    }
    this.rejectDeferredPending(message)
    this.internalEvent.emitError(new Error(message))
  }

  protected manageGestureDetected(websocketMessage: TOIMessageEvent): void
  {
    const gestureMessage = websocketMessage as TOIMessageEventGesture
    this.addStrokeDeferred?.resolve(gestureMessage)
  }

  protected manageContextlessGesture(websocketMessage: TOIMessageEvent): void
  {
    const gestureMessage = websocketMessage as TOIMessageEventContextlessGesture
    this.recognizeGestureDeferred?.resolve(gestureMessage)
  }

  protected messageCallback(message: MessageEvent<string>): void
  {
    this.currentErrorCode = undefined
    try {
      const websocketMessage: TOIMessageEvent = JSON.parse(message.data)
      if (websocketMessage.type !== "pong") {
        this.pingCount = 0
        switch (websocketMessage.type) {
          case "ack":
            this.manageAckMessage(websocketMessage)
            break
          case "contentPackageDescription":
            this.manageContentPackageDescriptionMessage()
            break
          case "partChanged":
            this.managePartChangeMessage(websocketMessage)
            break
          case "newPart":
            this.initialized?.resolve()
            break
          case "contentChanged":
            this.addStrokeDeferred?.resolve(undefined)
            this.transformStrokeDeferred?.resolve()
            this.eraseStrokeDeferred?.resolve()
            this.replaceStrokeDeferred?.resolve()
            break
          case "exported":
            this.manageExportMessage(websocketMessage)
            break
          case "gestureDetected":
            this.manageGestureDetected(websocketMessage)
            break
          case "Gesture":
            this.manageContextlessGesture(websocketMessage)
            break
          case "idle":
            this.manageWaitForIdle()
            break
          case "error":
            this.manageErrorMessage(websocketMessage)
            break
        }
      }
    } catch (error) {
      this.internalEvent.emitError(new Error(message.data))
    }
  }

  async init(): Promise<void>
  {
    try {
      this.connected = new DeferredPromise<void>()
      this.initialized = new DeferredPromise<void>()
      this.ackDeferred = new DeferredPromise<void>()
      this.pingCount = 0
      this.socket = new WebSocket(this.url)

      this.socket.addEventListener("open", this.openCallback.bind(this))
      this.socket.addEventListener("close", this.closeCallback.bind(this))
      this.socket.addEventListener("message", this.messageCallback.bind(this))

      await this.initialized.promise

      if (this.serverConfiguration.websocket.pingEnabled) {
        this.infinitePing()
      }

      return this.initialized.promise
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      const error = new Error(ErrorConst.CANT_ESTABLISH)
      this.internalEvent.emitError(error)
      this.initialized?.reject(error)
      return this.initialized?.promise
    }
  }

  async send(message: TOIMessageEvent): Promise<void>
  {
    if (!this.connected) {
      return Promise.reject(new Error("Recognizer must be initilized"))
    }
    await this.connected.promise
    if (this.socket.readyState === this.socket.OPEN) {
      this.socket.send(JSON.stringify(message))
      return Promise.resolve()
    }
    else {
      if (this.socket.readyState != this.socket.CONNECTING && this.serverConfiguration.websocket.autoReconnect) {
        this.reconnectionCount++
        if (this.serverConfiguration.websocket.maxRetryCount >= this.reconnectionCount) {
          this.internalEvent.emitClearMessage()
          await this.destroy()
          if (!this.initialized) {
            await this.init()
          }
          else {
            await this.initialized.promise
          }
          return this.send(message)
        }
        else {
          return Promise.reject(new Error("Unable to send message. The maximum number of connection attempts has been reached."))
        }
      }
    }
  }

  async addStrokes(strokes: OIStroke[], processGestures = true): Promise<TOIMessageEventGesture | undefined>
  {
    this.addStrokeDeferred?.resolve(undefined)
    await this.waitPromises()
    this.addStrokeDeferred = new DeferredPromise<TOIMessageEventGesture | undefined>()
    if (strokes.length === 0) {
      this.addStrokeDeferred.resolve(undefined)
      return this.addStrokeDeferred?.promise
    }
    await this.send({
      type: "addStrokes",
      processGestures,
      strokes: strokes.map(s => s.formatToSend())
    })
    return this.addStrokeDeferred?.promise
  }

  async replaceStrokes(oldStrokeIds: string[], newStrokes: OIStroke[]): Promise<void>
  {
    await this.waitPromises()
    this.replaceStrokeDeferred = new DeferredPromise<void>()
    if (oldStrokeIds.length === 0) {
      this.replaceStrokeDeferred.resolve()
      return this.replaceStrokeDeferred?.promise
    }
    await this.send({
      type: "replaceStrokes",
      oldStrokeIds,
      newStrokes: newStrokes.map(s => s.formatToSend())
    })
    return this.replaceStrokeDeferred?.promise
  }

  async translateStrokes(strokeIds: string[], tx: number, ty: number): Promise<void>
  {
    await this.waitPromises()
    this.transformStrokeDeferred = new DeferredPromise<void>()
    if (strokeIds.length === 0) {
      this.transformStrokeDeferred.resolve()
      return this.transformStrokeDeferred?.promise
    }
    await this.send({
      type: "transform",
      transformationType: "TRANSLATE",
      strokeIds,
      tx,
      ty
    })
    return this.transformStrokeDeferred?.promise
  }

  async transformStrokes(strokeIds: string[], matrix: TMatrixTransform): Promise<void>
  {
    await this.waitPromises()
    this.transformStrokeDeferred = new DeferredPromise<void>()
    if (strokeIds.length === 0) {
      this.transformStrokeDeferred.resolve()
      return this.transformStrokeDeferred?.promise
    }
    await this.send({
      type: "transform",
      transformationType: "MATRIX",
      strokeIds,
      ...matrix
    })
    return this.transformStrokeDeferred?.promise
  }

  async eraseStrokes(strokeIds: string[]): Promise<void>
  {
    await this.waitPromises()
    this.eraseStrokeDeferred = new DeferredPromise<void>()
    if (strokeIds.length === 0) {
      this.eraseStrokeDeferred.resolve()
      return this.eraseStrokeDeferred?.promise
    }
    await this.send({
      type: "eraseStrokes",
      strokeIds
    })
    return this.eraseStrokeDeferred?.promise
  }

  async recognizeGesture(strokes: OIStroke[]): Promise<TOIMessageEventContextlessGesture | undefined>
  {
    await this.waitPromises()
    this.recognizeGestureDeferred = new DeferredPromise<TOIMessageEventContextlessGesture | undefined>()
    if (strokes.length === 0) {
      this.recognizeGestureDeferred.resolve(undefined)
      return this.recognizeGestureDeferred?.promise
    }
    const pixelTomm = 25.4 / 96
    await this.send({
      type: "contextlessGesture",
      scaleX: pixelTomm,
      scaleY: pixelTomm,
      strokes: strokes.map(s => s.formatToSend())
    })
    return this.recognizeGestureDeferred?.promise
  }

  async waitForIdle(): Promise<void>
  {
    await this.initialized?.promise
    this.waitForIdleDeferred = new DeferredPromise<void>()
    const message: TOIMessageEvent = {
      type: "waitForIdle",
    }
    await this.send(message)
    return this.waitForIdleDeferred?.promise
  }

  async export(requestedMimeTypes?: string[]): Promise<TExport>
  {
    await this.initialized?.promise
    this.exportDeferred = new DeferredPromise<TExport>()
    const mimeTypes: string[] = requestedMimeTypes || this.mimeTypes
    const message: TOIMessageEvent = {
      type: "export",
      partId: this.currentPartId,
      mimeTypes
    }
    await this.send(message)
    return await this.exportDeferred?.promise

  }

  async close(code: number, reason: string): Promise<void>
  {
    this.closeDeferred = new DeferredPromise<void>()
    if (this.socket.readyState === this.socket.OPEN || this.socket.readyState === this.socket.CONNECTING) {
      this.socket.removeEventListener("open", this.openCallback.bind(this))
      this.socket.removeEventListener("close", this.closeCallback.bind(this))
      this.socket.removeEventListener("message", this.messageCallback.bind(this))
      this.socket.close(code, reason)
    }
    else {
      this.closeDeferred.resolve()
    }
    return this.closeDeferred.promise
  }

  async destroy(): Promise<void>
  {
    this.connected = undefined
    this.initialized = undefined
    this.addStrokeDeferred= undefined
    this.recognizeGestureDeferred= undefined
    this.transformStrokeDeferred= undefined
    this.eraseStrokeDeferred= undefined
    this.replaceStrokeDeferred= undefined
    this.exportDeferred= undefined
    this.waitForIdleDeferred= undefined
    this.closeDeferred = undefined
    if (this.socket) {
      this.socket.removeEventListener("open", this.openCallback.bind(this))
      this.socket.removeEventListener("close", this.closeCallback.bind(this))
      this.socket.removeEventListener("message", this.messageCallback.bind(this))
      await this.close(1000, "Recognizer destroyed")
    }
  }
}
