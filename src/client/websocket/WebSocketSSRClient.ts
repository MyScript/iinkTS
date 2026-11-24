import { DeferredPromise, isVersionSuperiorOrEqual, type TPartialDeep, typedKeys } from "@/core"
import { LoggerCategory, LoggerManager } from "@/logger"
import type { Model } from "@/model"
import type { TPenStyle, TTheme } from "@/style"
import { StyleHelper } from "@/style-css"
import type { Stroke } from "@/symbol"

import { parseExportedJIIX, type TExport } from "../jiix/JIIX"
import { ClientError, mapCloseCodeToMessage, mapErrorCodeToMessage } from "../shared/ClientError"
import { ClientEvent } from "../shared/ClientEvent"
import { resolveHmac } from "../shared/HmacAuth"
import { ensureServerVersion } from "../shared/infos"
import type { TConverstionState } from "../shared/RecognitionConfiguration"
import { redactServerSecrets, serverUrl } from "../shared/ServerConfiguration"
import { toWireStroke } from "../shared/StrokeSerializer"
import { readHistoryContext } from "./WebSocketClientMessage"
import type { TWebSocketSSRClientConfiguration } from "./WebSocketSSRClientConfiguration"
import { WebSocketSSRClientConfiguration } from "./WebSocketSSRClientConfiguration"
import type {
  TWebSocketSSRClientMessage,
  TWebSocketSSRClientMessageAck,
  TWebSocketSSRClientMessageContentChange,
  TWebSocketSSRClientMessageError,
  TWebSocketSSRClientMessageExport,
  TWebSocketSSRClientMessagePartChange,
  TWebSocketSSRClientMessageReceived,
  TWebSocketSSRClientMessageReceivedMap,
  TWebSocketSSRClientMessageSVGPatch,
} from "./WebSocketSSRClientMessage"

// A record, not a list: a type missing from the received map stops compiling here
const RECEIVED_MESSAGE_TYPE_RECORD: Record<keyof TWebSocketSSRClientMessageReceivedMap, true> = {
  ack: true,
  contentPackageDescription: true,
  partChanged: true,
  newPart: true,
  contentChanged: true,
  exported: true,
  svgPatch: true,
  error: true,
  idle: true,
  pong: true,
}
const RECEIVED_MESSAGE_TYPES: ReadonlySet<unknown> = new Set(typedKeys(RECEIVED_MESSAGE_TYPE_RECORD))

// Checks the discriminant only: the payload is trusted to match its type, as the server's contract
const isWebSocketSSRClientMessageReceived = (value: unknown): value is TWebSocketSSRClientMessageReceived =>
  typeof value === "object" && value !== null && "type" in value && RECEIVED_MESSAGE_TYPES.has(value.type)

/**
 * A websocket dialog have this sequence :
 * --------------------------- Client --------------------------------------------------- Server ----------------------------------
 * init: send newContentPackage or restoreIInkSession           ==================>
 *                                                              <==================       ack
 * answer ack:
 *  send the hmac (if enable)                                   ==================>
 *  send the configuration                                      ==================>
 *                                                              <==================       contentPackageDescription
 * answer contentPackageDescription:
 *  send newContentPart or openContentPart                      ==================>
 *                                                              <==================        partChanged
 *                                                              <==================        contentChanged
 *                                                              <==================        newPart
 *                                                              <==================        svgPatch
 *
 * setPenStyle (send the parameters)                            ==================>
 * setTheme (send the parameters)                               ==================>
 * setPenStyleClasses (send the parameters)                     ==================>
 *                                                              <==================        svgPatch
 * addStrokes (send the strokes ) ============>
 *                                                              <==================        update
 */

/**
 * @group Client
 */
export class WebSocketSSRClient {
  protected logger = LoggerManager.getLogger(LoggerCategory.CLIENT)

  protected socket!: WebSocket
  protected pingCount = 0
  protected reconnectionCount = 0
  protected viewSizeHeight!: number
  protected viewSizeWidth!: number
  protected sessionId?: string
  currentPartId?: string
  protected currentErrorCode?: string | number

  protected penStyle?: TPenStyle
  protected penStyleClasses?: string
  protected theme?: TTheme

  protected boundOpenCallback!: () => void
  protected boundCloseCallback!: (evt: CloseEvent) => void
  protected boundMessageCallback!: (message: MessageEvent<string>) => void

  protected connected?: DeferredPromise<void>
  protected ackDeferred?: DeferredPromise<void>
  protected addStrokeDeferred?: DeferredPromise<TExport>
  protected exportDeferred?: DeferredPromise<TExport>
  protected convertDeferred?: DeferredPromise<TExport>
  protected importDeferred?: DeferredPromise<TExport>
  protected resizeDeferred?: DeferredPromise<void>
  protected undoDeferred?: DeferredPromise<TExport>
  protected redoDeferred?: DeferredPromise<TExport>
  protected clearDeferred?: DeferredPromise<TExport>
  protected importPointEventsDeferred?: DeferredPromise<TExport>
  protected waitForIdleDeferred?: DeferredPromise<void>

  configuration: TWebSocketSSRClientConfiguration
  initialized: DeferredPromise<void>
  url: string
  event: ClientEvent

  constructor(config?: TPartialDeep<TWebSocketSSRClientConfiguration>) {
    this.logger.info("constructor", { config: redactServerSecrets(config) })
    this.configuration = new WebSocketSSRClientConfiguration(config)
    this.url = serverUrl(this.configuration.server, "document", {
      websocket: true,
      query: { applicationKey: this.configuration.server.applicationKey },
    })
    this.event = new ClientEvent()
    this.initialized = new DeferredPromise<void>()
    this.boundOpenCallback = this.openCallback.bind(this)
    this.boundCloseCallback = this.closeCallback.bind(this)
    this.boundMessageCallback = this.messageCallback.bind(this)
  }

  get mimeTypes(): string[] {
    switch (this.configuration.recognition.type.toLocaleLowerCase()) {
      case "text":
        return this.configuration.recognition.text.mimeTypes
      case "math":
        return this.configuration.recognition.math.mimeTypes
      default:
        throw new Error(`Unauthorized recognition type: "${this.configuration.recognition.type}"`)
    }
  }

  protected infinitePing(): void {
    this.pingCount++
    if (this.configuration.server.websocket.maxPingLostCount < this.pingCount) {
      this.socket.close(1000, "MAXIMUM_PING_REACHED")
    } else if (this.socket.readyState < this.socket.CLOSING) {
      setTimeout(() => {
        if (this.socket.readyState < this.socket.CLOSING) {
          this.socket.send(JSON.stringify({ type: "ping" }))
          this.infinitePing()
        }
      }, this.configuration.server.websocket.pingDelay)
    }
  }

  protected openCallback(): void {
    this.connected?.resolve()
    const params: TWebSocketSSRClientMessage = {
      type: this.sessionId ? "restoreIInkSession" : "newContentPackage",
      iinkSessionId: this.sessionId,
      applicationKey: this.configuration.server.applicationKey,
      xDpi: 96,
      yDpi: 96,
      viewSizeHeight: this.viewSizeHeight,
      viewSizeWidth: this.viewSizeWidth,
    }
    if (isVersionSuperiorOrEqual(this.configuration.server.version!, "2.0.4")) {
      params["myscript-client-name"] = "iink-ts"
      params["myscript-client-version"] = __IINK_VERSION__
    }
    this.send(params)
  }

  protected rejectDeferredPending(error: Error): void {
    if (this.connected?.isPending) {
      this.connected?.reject(error)
    }
    if (this.initialized.isPending) {
      this.initialized.reject(error)
    }
    if (this.addStrokeDeferred?.isPending) {
      this.addStrokeDeferred?.reject(error)
    }
    if (this.exportDeferred?.isPending) {
      this.exportDeferred?.reject(error)
    }
    if (this.importPointEventsDeferred?.isPending) {
      this.importPointEventsDeferred?.reject(error)
    }
    if (this.convertDeferred?.isPending) {
      this.convertDeferred?.reject(error)
    }
    if (this.importDeferred?.isPending) {
      this.importDeferred?.reject(error)
    }
    if (this.resizeDeferred?.isPending) {
      this.resizeDeferred?.reject(error)
    }
    if (this.waitForIdleDeferred?.isPending) {
      this.waitForIdleDeferred?.reject(error)
    }
    if (this.undoDeferred?.isPending) {
      this.undoDeferred?.reject(error)
    }
    if (this.redoDeferred?.isPending) {
      this.redoDeferred?.reject(error)
    }
    if (this.clearDeferred?.isPending) {
      this.clearDeferred.reject(error)
    }
  }

  /**
   * Settles the requests still waiting for an answer with an empty result, as on a deliberate
   * close in {@link WebSocketClient}: the operation is moot, not failed, so callers that never
   * awaited it get no unhandled rejection.
   */
  protected resolvePendingRequests(): void {
    const empty: TExport = {}
    this.addStrokeDeferred?.resolve(empty)
    this.exportDeferred?.resolve(empty)
    this.importPointEventsDeferred?.resolve(empty)
    this.convertDeferred?.resolve(empty)
    this.importDeferred?.resolve(empty)
    this.resizeDeferred?.resolve()
    this.waitForIdleDeferred?.resolve()
    this.undoDeferred?.resolve(empty)
    this.redoDeferred?.resolve(empty)
    this.clearDeferred?.resolve(empty)
  }

  protected closeCallback(evt: CloseEvent): void {
    let message = ""
    if (!this.currentErrorCode) {
      const mapped = mapCloseCodeToMessage(evt.code)
      if (mapped === null) {
        this.logger.warn("closeCallback", "unknown CloseEvent.code", { evt })
        message = ClientError.CANT_ESTABLISH
      } else {
        message = mapped
      }
    }

    if (!this.currentErrorCode && evt.code !== 1000) {
      const error = new Error(message || evt.reason)
      this.rejectDeferredPending(error)
      this.event.emitError(error)
    }
  }

  protected async manageAckMessage(ackMessage: TWebSocketSSRClientMessageAck): Promise<void> {
    this.logger.info("manageAckMessage", {
      ackMessage,
    })
    if (ackMessage.hmacChallenge) {
      this.send({
        type: "hmac",
        hmac: await resolveHmac(this.configuration.server, ackMessage.hmacChallenge),
      })
    }
    if (ackMessage.iinkSessionId) {
      this.sessionId = ackMessage.iinkSessionId
    }
    if (!isVersionSuperiorOrEqual(this.configuration.server.version!, "2.3.0")) {
      delete this.configuration.recognition.convert
    }
    if (!isVersionSuperiorOrEqual(this.configuration.server.version!, "3.2.0")) {
      delete this.configuration.recognition.export.jiix.text.lines
    }
    this.send({
      ...this.configuration.recognition,
      type: "configuration",
    })
    this.ackDeferred?.resolve()
  }

  /** A handshake step failed: `init()` waits on `initialized`, so it must hear of it, not only the `error` listeners */
  protected failInitialization(error: unknown): void {
    const reason = error instanceof Error ? error : new Error(String(error))
    this.initialized.reject(reason)
    this.event.emitError(reason)
  }

  protected async manageContentPackageDescriptionMessage(): Promise<void> {
    this.reconnectionCount = 0
    await this.ackDeferred?.promise
    this.logger.info("manageContentPackageDescriptionMessage")
    if (this.currentPartId) {
      this.send({
        type: "openContentPart",
        id: this.currentPartId,
        mimeTypes: this.mimeTypes,
      })
    } else {
      this.send({
        type: "newContentPart",
        contentType: this.configuration.recognition.type,
        mimeTypes: this.mimeTypes,
      })
    }
  }

  protected managePartChangeMessage(partChangeMessage: TWebSocketSSRClientMessagePartChange): void {
    this.logger.info("managePartChangeMessage", {
      partChangeMessage,
    })
    this.currentPartId = partChangeMessage.partId
    this.initialized.resolve()
  }

  protected manageExportMessage(exportMessage: TWebSocketSSRClientMessageExport): void {
    this.logger.info("manageExportMessage", {
      exportMessage,
    })
    const exports = parseExportedJIIX(exportMessage.exports)
    this.initialized.resolve()
    this.addStrokeDeferred?.resolve(exports)
    this.exportDeferred?.resolve(exports)
    this.convertDeferred?.resolve(exports)
    this.importDeferred?.resolve(exports)
    this.undoDeferred?.resolve(exports)
    this.redoDeferred?.resolve(exports)
    this.clearDeferred?.resolve(exports)
    this.importPointEventsDeferred?.resolve(exports)
    this.event.emitExported(exports)
  }

  protected async manageWaitForIdle(): Promise<void> {
    this.event.emitIdle(true)
    this.waitForIdleDeferred?.resolve()
  }

  protected manageErrorMessage(err: TWebSocketSSRClientMessageError): void {
    this.currentErrorCode = err.data?.code || err.code
    const message =
      mapErrorCodeToMessage(this.currentErrorCode) ?? (err.data?.message || err.message || ClientError.UNKNOWN)
    const error = new Error(message)
    this.rejectDeferredPending(error)
    this.event.emitError(error)
  }

  protected manageContentChangeMessage(contentChangeMessage: TWebSocketSSRClientMessageContentChange): void {
    this.logger.info("manageContentChangeMessage", { contentChangeMessage })
    this.event.emitContentChanged(readHistoryContext(contentChangeMessage))
  }

  protected manageSVGPatchMessage(svgPatchMessage: TWebSocketSSRClientMessageSVGPatch): void {
    this.logger.info("manageSVGPatchMessage", {
      svgPatchMessage,
    })
    this.resizeDeferred?.resolve()
    this.event.emitSVGPatch(svgPatchMessage)
  }

  protected messageCallback(message: MessageEvent<string>): void {
    this.logger.debug("messageCallback", {
      message,
    })
    this.currentErrorCode = undefined
    let websocketMessage: unknown
    try {
      websocketMessage = JSON.parse(message.data)
    } catch {
      // The payload is not JSON at all: the payload itself is the useful diagnostic.
      this.event.emitError(new Error(message.data))
      return
    }
    if (!isWebSocketSSRClientMessageReceived(websocketMessage)) {
      this.logger.warn("messageCallback", `Message type unknown: "${message.data}".`)
      return
    }
    if (websocketMessage.type === "pong") {
      this.pingCount = 0
      return
    }
    switch (websocketMessage.type) {
      case "ack":
        this.manageAckMessage(websocketMessage).catch((err) => this.failInitialization(err))
        break
      case "contentPackageDescription":
        this.manageContentPackageDescriptionMessage()
        break
      case "partChanged":
        this.managePartChangeMessage(websocketMessage)
        break
      case "newPart":
        this.initialized.resolve()
        break
      case "contentChanged":
        this.manageContentChangeMessage(websocketMessage)
        break
      case "exported":
        this.manageExportMessage(websocketMessage)
        break
      case "svgPatch":
        this.manageSVGPatchMessage(websocketMessage)
        break
      case "error":
        this.manageErrorMessage(websocketMessage)
        break
      case "idle":
        this.manageWaitForIdle()
        break
      default: {
        // Unreachable once the guard passed; a received type without a case stops compiling here
        const unhandled: never = websocketMessage
        this.logger.warn("messageCallback", `Message type unhandled: "${JSON.stringify(unhandled)}".`)
      }
    }
  }

  async init(height: number, width: number): Promise<void> {
    try {
      this.event.emitStartInitialization()
      this.logger.info("init", { height, width })
      this.resetConnection()

      // Awaited only when unknown: a known version keeps the socket opening in the same tick as init()
      if (!this.configuration.server.version) {
        await ensureServerVersion(this.configuration)
      }
      this.connected = new DeferredPromise<void>()
      this.initialized = new DeferredPromise<void>()
      this.ackDeferred = new DeferredPromise<void>()
      this.viewSizeHeight = height
      this.viewSizeWidth = width
      this.pingCount = 0
      this.socket = new WebSocket(this.url)

      if (this.configuration.server.websocket.pingEnabled) {
        this.infinitePing()
      }

      this.socket.addEventListener("open", this.boundOpenCallback)
      this.socket.addEventListener("close", this.boundCloseCallback)
      this.socket.addEventListener("message", this.boundMessageCallback)
      await this.connected.promise
      await this.initialized.promise
      this.event.emitEndInitialization()
    } catch (err: unknown) {
      this.rejectDeferredPending(err instanceof Error ? err : new Error(String(err)))
      return this.initialized.promise
    }
  }

  async send(message: TWebSocketSSRClientMessage): Promise<void> {
    if (!this.socket) {
      return Promise.reject(new Error("Client must be initialized"))
    }
    await this.connected?.promise
    if (this.socket.readyState === this.socket.OPEN) {
      this.logger.debug("send", { message })
      this.socket.send(JSON.stringify(message))
      return Promise.resolve()
    }
    if (this.socket.readyState === this.socket.CONNECTING) {
      return Promise.reject(new Error(`Can not send message: ${message.type}, connection not ready`))
    }
    if (!this.configuration.server.websocket.autoReconnect) {
      return Promise.reject(new Error("Unable to send message. Connection closed and automatic reconnection disabled"))
    }
    this.reconnectionCount++
    if (this.configuration.server.websocket.maxRetryCount >= this.reconnectionCount) {
      this.logger.debug("send", `try to reconnect number: ${this.reconnectionCount}.`)
      await this.init(this.viewSizeHeight, this.viewSizeWidth)
      await this.restoreStyles()
      return this.send(message)
    } else {
      return Promise.reject(
        new Error("Unable to send message. The maximum number of connection attempts has been reached.")
      )
    }
  }

  /** Sends again, on a new session, the styles set on the previous one; one never set stays unset */
  protected async restoreStyles(): Promise<void> {
    if (this.penStyle) {
      await this.setPenStyle(this.penStyle)
    }
    if (this.penStyleClasses !== undefined) {
      await this.setPenStyleClasses(this.penStyleClasses)
    }
    if (this.theme) {
      await this.setTheme(this.theme)
    }
  }

  async addStrokes(strokes: Stroke[]): Promise<TExport> {
    this.logger.info("addStrokes", { strokes })
    await this.initialized.promise
    this.addStrokeDeferred = new DeferredPromise<TExport>()
    if (strokes.length === 0) {
      this.addStrokeDeferred.resolve({} as TExport)
    } else {
      await this.send({
        type: "addStrokes",
        strokes: strokes.map((s) => toWireStroke(s)),
      })
    }
    return this.addStrokeDeferred?.promise
  }

  async setPenStyle(penStyle: TPenStyle): Promise<void> {
    this.logger.info("setPenStyle", { penStyle })
    await this.initialized.promise
    this.penStyle = penStyle
    const message: TWebSocketSSRClientMessage = {
      type: "setPenStyle",
      style: StyleHelper.penStyleToCSS(penStyle),
    }
    return this.send(message)
  }

  async setPenStyleClasses(penStyleClasses: string): Promise<void> {
    await this.initialized.promise
    this.penStyleClasses = penStyleClasses
    this.logger.info("setPenStyleClasses", {
      penStyleClasses,
    })
    const message: TWebSocketSSRClientMessage = {
      type: "setPenStyleClasses",
      styleClasses: penStyleClasses,
    }
    return this.send(message)
  }

  async setTheme(theme: TTheme): Promise<void> {
    this.logger.info("setTheme", { theme })
    await this.initialized.promise
    this.theme = theme
    const message: TWebSocketSSRClientMessage = {
      type: "setTheme",
      theme: StyleHelper.themeToCSS(theme),
    }
    return this.send(message)
  }

  async export(model: Model, requestedMimeTypes?: string[]): Promise<Model> {
    this.logger.info("export", {
      model,
      requestedMimeTypes,
    })
    await this.initialized.promise
    this.exportDeferred = new DeferredPromise<TExport>()
    const localModel = model.clone()
    let mimeTypes: string[] = requestedMimeTypes || []
    if (!mimeTypes.length) {
      switch (this.configuration.recognition.type) {
        case "MATH":
          mimeTypes = this.configuration.recognition.math.mimeTypes
          break
        case "TEXT":
          mimeTypes = this.configuration.recognition.text.mimeTypes
          break
        default:
          throw new Error(
            `Recognition type "${this.configuration.recognition.type}" is unknown.\n Possible types are:\n -MATH\n -TEXT`
          )
      }
    }

    if (!mimeTypes.length) {
      return Promise.reject(
        new Error(
          `Export failed, no mimeTypes define in recognition ${this.configuration.recognition.type} configuration`
        )
      )
    }

    const message: TWebSocketSSRClientMessage = {
      type: "export",
      partId: this.currentPartId,
      mimeTypes,
    }
    await this.send(message)
    const exports: TExport = await this.exportDeferred?.promise
    localModel.updatePositionReceived()
    localModel.mergeExport(exports)
    this.logger.debug("export", {
      model: localModel,
    })
    return localModel
  }

  async import(model: Model, data: Blob, mimeType?: string): Promise<Model> {
    this.logger.info("import", {
      data,
      mimeType,
    })
    await this.initialized.promise
    const localModel = model.clone()
    const chunkSize = this.configuration.server.websocket.fileChunkSize
    const importFileId = Math.random().toString(10).substring(2, 6)
    this.importDeferred = new DeferredPromise<TExport>()
    const readBlob = (blob: Blob): Promise<string | never> => {
      const fileReader = new FileReader()
      return new Promise((resolve, reject) => {
        fileReader.onloadend = (ev) => resolve(ev.target?.result as string)
        fileReader.onerror = () => reject()
        fileReader.readAsText(blob)
      })
    }

    const importFileMessage: TWebSocketSSRClientMessage = {
      type: "importFile",
      importFileId,
      mimeType,
    }
    await this.send(importFileMessage)
    for (let i = 0; i < data.size; i += chunkSize) {
      const blobPart = data.slice(i, i + chunkSize, data.type)
      const partFileString = await readBlob(blobPart)
      const fileChuckMessage: TWebSocketSSRClientMessage = {
        type: "fileChunk",
        importFileId,
        data: partFileString,
        lastChunk: i + chunkSize > data.size,
      }
      await this.send(fileChuckMessage)
    }
    const exports = await this.importDeferred?.promise
    this.importDeferred = undefined
    localModel.mergeExport(exports)
    return localModel
  }

  async resize(model: Model): Promise<Model> {
    this.logger.info("resize", { model })
    await this.initialized.promise
    if (isNaN(model.height) || isNaN(model.width)) {
      return model
    }
    this.resizeDeferred = new DeferredPromise<void>()
    const localModel = model.clone()
    this.viewSizeHeight = localModel.height
    this.viewSizeWidth = localModel.width
    const message: TWebSocketSSRClientMessage = {
      type: "changeViewSize",
      height: this.viewSizeHeight,
      width: this.viewSizeWidth,
    }
    await this.send(message)
    await this.resizeDeferred?.promise
    return localModel
  }

  async importPointEvents(strokes: Stroke[]): Promise<TExport> {
    this.logger.info("importPointsEvents", {
      strokes,
    })
    await this.initialized.promise
    this.importPointEventsDeferred = new DeferredPromise<TExport>()
    const message: TWebSocketSSRClientMessage = {
      type: "pointerEvents",
      events: strokes.map((s) => toWireStroke(s)),
    }
    await this.send(message)
    return this.importPointEventsDeferred?.promise
  }

  async convert(model: Model, conversionState?: TConverstionState): Promise<Model> {
    this.logger.info("convert", {
      model,
      conversionState,
    })
    await this.initialized.promise
    this.convertDeferred = new DeferredPromise<TExport>()
    const localModel = model.clone()
    const message: TWebSocketSSRClientMessage = {
      type: "convert",
      conversionState,
    }
    await this.send(message)
    const myExportConverted: TExport = await this.convertDeferred?.promise
    localModel.updatePositionReceived()
    localModel.mergeConvert(myExportConverted)
    this.logger.debug("convert", {
      model: localModel,
    })
    return localModel
  }

  async waitForIdle(): Promise<void> {
    await this.initialized.promise
    this.waitForIdleDeferred = new DeferredPromise<void>()
    const message: TWebSocketSSRClientMessage = {
      type: "waitForIdle",
    }
    await this.send(message)
    return this.waitForIdleDeferred?.promise
  }

  async undo(model: Model): Promise<Model> {
    this.logger.info("undo", { model })
    await this.initialized.promise
    const localModel = model.clone()
    this.undoDeferred = new DeferredPromise<TExport>()
    const message: TWebSocketSSRClientMessage = {
      type: "undo",
    }
    await this.send(message)
    const undoExports = await this.undoDeferred?.promise
    localModel.updatePositionReceived()
    localModel.mergeExport(undoExports)
    this.logger.debug("undo", {
      model: localModel,
    })
    this.undoDeferred = undefined
    return localModel
  }

  async redo(model: Model): Promise<Model> {
    this.logger.info("redo", { model })
    await this.initialized.promise
    const localModel = model.clone()
    this.redoDeferred = new DeferredPromise<TExport>()
    const message: TWebSocketSSRClientMessage = {
      type: "redo",
    }
    await this.send(message)
    const redoExports = await this.redoDeferred?.promise
    localModel.updatePositionReceived()
    localModel.mergeExport(redoExports)
    this.logger.debug("redo", {
      model: redoExports,
    })
    this.redoDeferred = undefined
    return localModel
  }

  async clear(model: Model): Promise<Model> {
    this.logger.info("clear", { model })
    await this.initialized.promise
    const localModel = model.clone()
    localModel.modificationDate = Date.now()
    this.clearDeferred = new DeferredPromise<TExport>()
    const message: TWebSocketSSRClientMessage = {
      type: "clear",
    }
    await this.send(message)
    const clearExports = await this.clearDeferred?.promise
    localModel.updatePositionReceived()
    localModel.mergeExport(clearExports)
    this.clearDeferred = undefined
    this.logger.info("clear", {
      model: localModel,
    })
    return localModel
  }

  close(code: number, reason: string): void {
    if (this.socket.readyState === this.socket.OPEN || this.socket.readyState === this.socket.CONNECTING) {
      this.logger.info("close", { code, reason })
      this.socket.removeEventListener("close", this.boundCloseCallback)
      this.socket.removeEventListener("message", this.boundMessageCallback)
      this.socket.removeEventListener("open", this.boundOpenCallback)
      this.socket.close(code, reason)
    }
  }

  destroy(): void {
    this.logger.info("destroy")
    // Dropped unsettled, their callers would wait forever
    this.resolvePendingRequests()
    this.resetConnection()
  }

  /** Drops the socket and every pending promise without settling them: `init()` starts over from here */
  protected resetConnection(): void {
    this.connected = undefined
    this.ackDeferred = undefined
    this.addStrokeDeferred = undefined
    this.exportDeferred = undefined
    this.convertDeferred = undefined
    this.importDeferred = undefined
    this.importPointEventsDeferred = undefined
    this.waitForIdleDeferred = undefined
    this.resizeDeferred = undefined
    this.undoDeferred = undefined
    this.redoDeferred = undefined
    this.clearDeferred = undefined
    if (this.socket) {
      this.socket.removeEventListener("close", this.boundCloseCallback)
      this.socket.removeEventListener("message", this.boundMessageCallback)
      this.socket.removeEventListener("open", this.boundOpenCallback)
      this.close(1000, "Client destroyed")
    }
  }
}
