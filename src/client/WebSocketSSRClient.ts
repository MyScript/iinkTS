import type { THistoryContext } from "@/history"
import { LoggerCategory, LoggerManager } from "@/logger"
import type { Model, TExport, TJIIXExport } from "@/model"
import type { TPenStyle, TTheme } from "@/style"
import { StyleHelper } from "@/style"
import { type Stroke, StrokeOps } from "@/symbol"
import type { TPartialDeep } from "@/utils"
import { computeHmac, DeferredPromise, getApiInfos, isVersionSuperiorOrEqual } from "@/utils"

import { ClientError, mapCloseCodeToMessage } from "./ClientError"
import { ClientEvent } from "./ClientEvent"
import type { TConverstionState } from "./RecognitionConfiguration"
import type { TWebSocketSSRClientConfiguration } from "./WebSocketSSRClientConfiguration"
import { WebSocketSSRClientConfiguration } from "./WebSocketSSRClientConfiguration"
import type {
  TWebSocketSSRClientMessage,
  TWebSocketSSRClientMessageContentChange,
  TWebSocketSSRClientMessageError,
  TWebSocketSSRClientMessageExport,
  TWebSocketSSRClientMessageHMACChallenge,
  TWebSocketSSRClientMessagePartChange,
  TWebSocketSSRClientMessageSVGPatch,
} from "./WebSocketSSRClientMessage"

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
  #logger = LoggerManager.getLogger(LoggerCategory.CLIENT)

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
    this.#logger.info("constructor", { config })
    this.configuration = new WebSocketSSRClientConfiguration(config)
    const scheme = this.configuration.server.scheme === "https" ? "wss" : "ws"
    this.url = `${scheme}://${this.configuration.server.host}/api/v4.0/iink/document?applicationKey=${this.configuration.server.applicationKey}`
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
    } else if (this.socket.readyState <= 1) {
      setTimeout(() => {
        if (this.socket.readyState <= 1) {
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
      params["myscript-client-version"] = "4.0.0"
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

  protected closeCallback(evt: CloseEvent): void {
    let message = ""
    if (!this.currentErrorCode) {
      const mapped = mapCloseCodeToMessage(evt.code)
      if (mapped === null) {
        this.#logger.warn("closeCallback", "unknown CloseEvent.code", { evt })
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

  protected async manageAckMessage(websocketMessage: TWebSocketSSRClientMessage): Promise<void> {
    this.#logger.info("manageAckMessage", {
      websocketMessage,
    })
    const hmacChallengeMessage = websocketMessage as TWebSocketSSRClientMessageHMACChallenge
    if (hmacChallengeMessage.hmacChallenge) {
      let hmacKey: string
      if (typeof this.configuration.server.hmacKey == "string") {
        if (this.configuration.server.hmacKey.length === 0) {
          return this.ackDeferred?.reject("HMAC key is empty")
        }
        hmacKey = this.configuration.server.hmacKey
      } else if (typeof this.configuration.server.hmacKey == "function") {
        hmacKey = await this.configuration.server.hmacKey(this.configuration.server.applicationKey)
      } else {
        this.ackDeferred?.reject("HMAC key is not a string nor a function")
        return this.initialized.reject(new Error("HMAC key is not a string nor a function"))
      }
      if (!hmacKey) {
        this.ackDeferred?.reject("HMAC key is undefined")
        return this.initialized.reject(new Error("HMAC key is undefined"))
      }
      this.send({
        type: "hmac",
        hmac: await computeHmac(hmacChallengeMessage.hmacChallenge, this.configuration.server.applicationKey, hmacKey),
      })
    }
    if (hmacChallengeMessage.iinkSessionId) {
      this.sessionId = hmacChallengeMessage.iinkSessionId
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

  protected async manageContentPackageDescriptionMessage(): Promise<void> {
    this.reconnectionCount = 0
    await this.ackDeferred?.promise
    this.#logger.info("manageContentPackageDescriptionMessage")
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

  protected managePartChangeMessage(websocketMessage: TWebSocketSSRClientMessage): void {
    this.#logger.info("managePartChangeMessage", {
      websocketMessage,
    })
    const partChangeMessage = websocketMessage as TWebSocketSSRClientMessagePartChange
    this.currentPartId = partChangeMessage.partId
    this.initialized.resolve()
  }

  protected manageExportMessage(websocketMessage: TWebSocketSSRClientMessage): void {
    this.#logger.info("manageExportMessage", {
      websocketMessage,
    })
    const exportMessage = websocketMessage as TWebSocketSSRClientMessageExport
    if (exportMessage.exports["application/vnd.myscript.jiix"]) {
      exportMessage.exports["application/vnd.myscript.jiix"] = JSON.parse(
        exportMessage.exports["application/vnd.myscript.jiix"].toString()
      ) as TJIIXExport
    }
    this.initialized.resolve()
    this.addStrokeDeferred?.resolve(exportMessage.exports)
    this.exportDeferred?.resolve(exportMessage.exports)
    this.convertDeferred?.resolve(exportMessage.exports)
    this.importDeferred?.resolve(exportMessage.exports)
    this.undoDeferred?.resolve(exportMessage.exports)
    this.redoDeferred?.resolve(exportMessage.exports)
    this.clearDeferred?.resolve(exportMessage.exports)
    this.importPointEventsDeferred?.resolve(exportMessage.exports)
    this.event.emitExported(exportMessage.exports)
  }

  protected async manageWaitForIdle(): Promise<void> {
    this.event.emitIdle(true)
    this.waitForIdleDeferred?.resolve()
  }

  protected manageErrorMessage(websocketMessage: TWebSocketSSRClientMessage): void {
    const err = websocketMessage as TWebSocketSSRClientMessageError
    this.currentErrorCode = err.data?.code || err.code
    let message = err.data?.message || err.message || ClientError.UNKNOWN

    switch (this.currentErrorCode) {
      case "no.activity":
        message = ClientError.NO_ACTIVITY
        break
      case "access.not.granted":
        message = ClientError.WRONG_CREDENTIALS
        break
      case "session.too.old":
        message = ClientError.TOO_OLD
        break
    }
    const error = new Error(message)
    this.rejectDeferredPending(error)
    this.event.emitError(error)
  }

  protected manageContentChangeMessage(websocketMessage: TWebSocketSSRClientMessage): void {
    this.#logger.info("manageContentChangeMessage", { websocketMessage })
    const contentChangeMessage = websocketMessage as TWebSocketSSRClientMessageContentChange
    const context: THistoryContext = {
      canRedo: contentChangeMessage.canRedo,
      canUndo: contentChangeMessage.canUndo,
      empty: contentChangeMessage.empty,
      stackIndex: contentChangeMessage.undoStackIndex,
      possibleUndoCount: contentChangeMessage.possibleUndoCount,
    }
    this.event.emitContentChanged(context)
  }

  protected manageSVGPatchMessage(websocketMessage: TWebSocketSSRClientMessage): void {
    this.#logger.info("manageSVGPatchMessage", {
      websocketMessage,
    })
    this.resizeDeferred?.resolve()
    const svgPatchMessage = websocketMessage as TWebSocketSSRClientMessageSVGPatch
    this.event.emitSVGPatch(svgPatchMessage)
  }

  protected messageCallback(message: MessageEvent<string>): void {
    this.#logger.debug("messageCallback", {
      message,
    })
    this.currentErrorCode = undefined
    const websocketMessage: TWebSocketSSRClientMessage = JSON.parse(message.data)
    if (websocketMessage.type !== "pong") {
      this.pingCount = 0
      switch (websocketMessage.type) {
        case "ack":
          this.manageAckMessage(websocketMessage).catch((err) => this.event.emitError(err))
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
        default:
          this.#logger.warn("messageCallback", `Message type unknown: "${websocketMessage.type}".`)
      }
    }
  }

  async init(height: number, width: number): Promise<void> {
    try {
      this.event.emitStartInitialization()
      this.#logger.info("init", { height, width })
      this.destroy()

      if (!this.configuration.server.version) {
        this.configuration.server.version = (await getApiInfos(this.configuration)).version
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
      this.rejectDeferredPending(err as Error)
      return this.initialized.promise
    }
  }

  async send(message: TWebSocketSSRClientMessage): Promise<void> {
    if (!this.socket) {
      return Promise.reject(new Error("Client must be initilized"))
    }
    await this.connected?.promise
    if (this.socket.readyState === this.socket.OPEN) {
      this.#logger.debug("send", { message })
      this.socket.send(JSON.stringify(message))
      return Promise.resolve()
    } else {
      if (this.socket.readyState != this.socket.CONNECTING && this.configuration.server.websocket.autoReconnect) {
        this.reconnectionCount++
        if (this.configuration.server.websocket.maxRetryCount >= this.reconnectionCount) {
          this.#logger.debug("send", `try to reconnect number: ${this.reconnectionCount}.`)
          await this.init(this.viewSizeHeight, this.viewSizeWidth)
          await this.setPenStyle(this.penStyle as TPenStyle)
          await this.setPenStyleClasses(this.penStyleClasses as string)
          await this.setTheme(this.theme as TTheme)
          return this.send(message)
        } else {
          return Promise.reject(
            new Error("Unable to send message. The maximum number of connection attempts has been reached.")
          )
        }
      }
    }
  }

  async addStrokes(strokes: Stroke[]): Promise<TExport> {
    this.#logger.info("addStrokes", { strokes })
    await this.initialized.promise
    this.addStrokeDeferred = new DeferredPromise<TExport>()
    if (strokes.length === 0) {
      this.addStrokeDeferred.resolve({} as TExport)
    } else {
      await this.send({
        type: "addStrokes",
        strokes: strokes.map((s) => StrokeOps.formatToSend(s)),
      })
    }
    return this.addStrokeDeferred?.promise
  }

  async setPenStyle(penStyle: TPenStyle): Promise<void> {
    this.#logger.info("setPenStyle", { penStyle })
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
    this.#logger.info("setPenStyleClasses", {
      penStyleClasses,
    })
    const message: TWebSocketSSRClientMessage = {
      type: "setPenStyleClasses",
      styleClasses: penStyleClasses,
    }
    return this.send(message)
  }

  async setTheme(theme: TTheme): Promise<void> {
    this.#logger.info("setTheme", { theme })
    await this.initialized.promise
    this.theme = theme
    const message: TWebSocketSSRClientMessage = {
      type: "setTheme",
      theme: StyleHelper.themeToCSS(theme),
    }
    return this.send(message)
  }

  async export(model: Model, requestedMimeTypes?: string[]): Promise<Model> {
    this.#logger.info("export", {
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
    this.#logger.debug("export", {
      model: localModel,
    })
    return localModel
  }

  async import(model: Model, data: Blob, mimeType?: string): Promise<Model> {
    this.#logger.info("import", {
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
    this.#logger.info("resize", { model })
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
    this.#logger.info("importPointsEvents", {
      strokes,
    })
    await this.initialized.promise
    this.importPointEventsDeferred = new DeferredPromise<TExport>()
    const message: TWebSocketSSRClientMessage = {
      type: "pointerEvents",
      events: strokes.map((s) => StrokeOps.formatToSend(s)),
    }
    await this.send(message)
    return this.importPointEventsDeferred?.promise
  }

  async convert(model: Model, conversionState?: TConverstionState): Promise<Model> {
    this.#logger.info("convert", {
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
    this.#logger.debug("convert", {
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
    this.#logger.info("undo", { model })
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
    this.#logger.debug("undo", {
      model: localModel,
    })
    this.undoDeferred = undefined
    return localModel
  }

  async redo(model: Model): Promise<Model> {
    this.#logger.info("redo", { model })
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
    this.#logger.debug("redo", {
      model: redoExports,
    })
    this.redoDeferred = undefined
    return localModel
  }

  async clear(model: Model): Promise<Model> {
    this.#logger.info("clear", { model })
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
    this.#logger.info("clear", {
      model: localModel,
    })
    return localModel
  }

  close(code: number, reason: string): void {
    if (this.socket.readyState === this.socket.OPEN || this.socket.readyState === this.socket.CONNECTING) {
      this.#logger.info("close", { code, reason })
      this.socket.removeEventListener("close", this.boundCloseCallback)
      this.socket.removeEventListener("message", this.boundMessageCallback)
      this.socket.removeEventListener("open", this.boundOpenCallback)
      this.socket.close(code, reason)
    }
  }

  destroy(): void {
    this.#logger.info("destroy")
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
