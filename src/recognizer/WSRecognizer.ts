import { LoggerClass, Error as ErrorConst } from "../Constants"
import { TConverstionState, TRecognitionConfiguration, TServerConfiguration } from "../configuration"
import { InternalEvent } from "../event"
import { LoggerManager } from "../logger"
import { Model, TExport, TJIIXExport, TStroke, convertStrokeToJSON } from "../model"
import { StyleHelper, TPenStyle, TTheme } from "../style"
import { TUndoRedoContext } from "../undo-redo"
import { DeferredPromise, computeHmac, isVersionSuperiorOrEqual } from "../utils"
import { TWSMessageEvent, TWSMessageEventContentChange, TWSMessageEventError, TWSMessageEventExport, TWSMessageEventHMACChallenge, TWSMessageEventPartChange, TWSMessageEventSVGPatch } from "./WSRecognizerMessage"

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
 * @group Recognizer
 */
export class WSRecognizer
{
  #logger = LoggerManager.getLogger(LoggerClass.RECOGNIZER)
  protected serverConfiguration: TServerConfiguration
  protected recognitionConfiguration: TRecognitionConfiguration

  protected socket!: WebSocket
  protected pingCount = 0
  protected reconnectionCount = 0
  protected viewSizeHeight!: number
  protected viewSizeWidth!: number
  // contentPartCount = 0
  protected sessionId?: string
  protected currentPartId?: string
  protected currentErrorCode?: string | number

  protected penStyle?: TPenStyle
  protected penStyleClasses?: string
  protected theme?: TTheme

  protected connected?: DeferredPromise<void>
  protected initialized?: DeferredPromise<void>
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

  url: string

  constructor(serverConfig: TServerConfiguration, recognitionConfig: TRecognitionConfiguration)
  {
    this.serverConfiguration = serverConfig
    this.recognitionConfiguration = recognitionConfig
    const scheme = (this.serverConfiguration.scheme === "https") ? "wss" : "ws"
    this.url = `${ scheme }://${ this.serverConfiguration.host }/api/v4.0/iink/document?applicationKey=${ this.serverConfiguration.applicationKey }`
    this.#logger.info("constructor", { serverConfig, recognitionConfig, url: this.url })
  }

  get mimeTypes(): string[]
  {
    switch (this.recognitionConfiguration.type.toLocaleLowerCase()) {
      case "text":
        return this.recognitionConfiguration.text.mimeTypes
      case "math":
        return this.recognitionConfiguration.math.mimeTypes
      case "diagram":
        return this.recognitionConfiguration.diagram.mimeTypes
      default:
        //"raw-content"
        return []
    }
  }

  get internalEvent(): InternalEvent
  {
    return InternalEvent.getInstance()
  }

  protected infinitePing(): void
  {
    this.pingCount++
    if (this.serverConfiguration.websocket.maxPingLostCount < this.pingCount) {
      this.socket.close(1000, "PING_LOST")
    } else if (this.socket.readyState <= 1) {
      setTimeout(() =>
      {
        if (this.socket.readyState <= 1) {
          this.socket.send(JSON.stringify({ type: "ping" }))
          this.infinitePing()
        }
      }, this.serverConfiguration.websocket.pingDelay)
    }
  }

  protected openCallback(): void
  {
    this.connected?.resolve()
    const params: TWSMessageEvent = {
      type: this.sessionId ? "restoreIInkSession" : "newContentPackage",
      iinkSessionId: this.sessionId,
      applicationKey: this.serverConfiguration.applicationKey,
      xDpi: 96,
      yDpi: 96,
      viewSizeHeight: this.viewSizeHeight,
      viewSizeWidth: this.viewSizeWidth
    }
    if (isVersionSuperiorOrEqual(this.serverConfiguration.version, "2.0.4")) {
      params["myscript-client-name"] = "iink-ts"
      params["myscript-client-version"] = "1.0.0-buildVersion"
    }
    this.send(params)
  }

  protected rejectDeferredPending(error: Error): void
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
    if (this.exportDeferred?.isPending) {
      this.exportDeferred?.reject(error)
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
    if (this.undoDeferred?.isPending) {
      this.undoDeferred?.reject(error)
    }
    if (this.redoDeferred?.isPending) {
      this.redoDeferred?.reject(error)
    }
    if (this.clearDeferred?.isPending) {
      this.clearDeferred.reject(error)
    }
    if (this.waitForIdleDeferred?.isPending) {
      this.waitForIdleDeferred.reject(error)
    }
  }

  protected closeCallback(evt: CloseEvent): void
  {
    let message = ""
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
          this.#logger.warn("closeCallback", "unknow CloseEvent.code", { evt })
          message = ErrorConst.CANT_ESTABLISH
          break
      }
    }
    const error = new Error(message || evt.reason)

    this.rejectDeferredPending(error)

    if (!this.currentErrorCode && evt.code !== 1000) {
      this.internalEvent.emitError(error)
    }
  }

  protected manageHMACChallengeMessage(websocketMessage: TWSMessageEvent): void
  {
    this.#logger.info("manageHMACChallengeMessage", { websocketMessage })
    const hmacChallengeMessage = websocketMessage as TWSMessageEventHMACChallenge
    if (hmacChallengeMessage.hmacChallenge) {
      this.send({
        type: "hmac",
        hmac: computeHmac(hmacChallengeMessage.hmacChallenge, this.serverConfiguration.applicationKey, this.serverConfiguration.hmacKey)
      })
    }
    if (hmacChallengeMessage.iinkSessionId) {
      this.sessionId = hmacChallengeMessage.iinkSessionId
    }
  }

  protected manageContentPackageDescriptionMessage(): void
  {
    this.reconnectionCount = 0
    this.#logger.info("manageContentPackageDescriptionMessage")

    this.send({ ...this.recognitionConfiguration, type: "configuration" })

    if (this.currentPartId) {
      this.send({ type: "openContentPart", id: this.currentPartId, mimeTypes: this.mimeTypes })
    }
    else {
      this.send({ type: "newContentPart", contentType: this.recognitionConfiguration.type, mimeTypes: this.mimeTypes })
    }
  }

  protected managePartChangeMessage(websocketMessage: TWSMessageEvent): void
  {
    this.#logger.info("managePartChangeMessage", { websocketMessage })
    const partChangeMessage = websocketMessage as TWSMessageEventPartChange
    this.currentPartId = partChangeMessage.partId
    this.initialized?.resolve()
  }

  protected manageExportMessage(websocketMessage: TWSMessageEvent): void
  {
    this.#logger.info("manageExportMessage", { websocketMessage })
    const exportMessage = websocketMessage as TWSMessageEventExport
    if (exportMessage.exports["application/vnd.myscript.jiix"]) {
      exportMessage.exports["application/vnd.myscript.jiix"] = JSON.parse(exportMessage.exports["application/vnd.myscript.jiix"].toString()) as TJIIXExport
    }
    this.initialized?.resolve()
    this.addStrokeDeferred?.resolve(exportMessage.exports)
    this.exportDeferred?.resolve(exportMessage.exports)
    this.convertDeferred?.resolve(exportMessage.exports)
    this.importDeferred?.resolve(exportMessage.exports)
    this.undoDeferred?.resolve(exportMessage.exports)
    this.redoDeferred?.resolve(exportMessage.exports)
    this.clearDeferred?.resolve(exportMessage.exports)
    this.importPointEventsDeferred?.resolve(exportMessage.exports)
    this.internalEvent.emitExported(exportMessage.exports)
  }

  protected async manageWaitForIdle(): Promise<void>
  {
    this.internalEvent.emitIdle(true)
    this.waitForIdleDeferred?.resolve()
  }

  protected manageErrorMessage(websocketMessage: TWSMessageEvent): void
  {
    const err = websocketMessage as TWSMessageEventError
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
    const error = new Error(message)
    this.rejectDeferredPending(error)
    this.internalEvent.emitError(error)
  }

  protected manageContentChangeMessage(websocketMessage: TWSMessageEvent): void
  {
    this.#logger.info("manageContentChangeMessage", { websocketMessage })
    const contentChangeMessage = websocketMessage as TWSMessageEventContentChange
    const context: TUndoRedoContext = {
      canRedo: contentChangeMessage.canRedo,
      canUndo: contentChangeMessage.canUndo,
      empty: contentChangeMessage.empty,
      stackIndex: contentChangeMessage.undoStackIndex,
      possibleUndoCount: contentChangeMessage.possibleUndoCount,
      stack: []
    }
    this.internalEvent.emitContextChange(context)
  }

  protected manageSVGPatchMessage(websocketMessage: TWSMessageEvent): void
  {
    this.#logger.info("manageSVGPatchMessage", { websocketMessage })
    this.resizeDeferred?.resolve()
    const svgPatchMessage = websocketMessage as TWSMessageEventSVGPatch
    this.internalEvent.emitSVGPatch(svgPatchMessage)
  }

  protected messageCallback(message: MessageEvent<string>): void
  {
    this.#logger.debug("messageCallback", { message })
    this.currentErrorCode = undefined
    const websocketMessage: TWSMessageEvent = JSON.parse(message.data)
    if (websocketMessage.type !== "pong") {
      this.pingCount = 0
      switch (websocketMessage.type) {
        case "ack":
          this.manageHMACChallengeMessage(websocketMessage)
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
          this.#logger.warn("messageCallback", `Message type unknow: "${ websocketMessage.type }".`)
      }
    }
  }

  async init(height: number, width: number): Promise<void>
  {
    try {
      this.#logger.info("init", { height, width })
      this.destroy()
      this.connected = new DeferredPromise<void>()
      this.initialized = new DeferredPromise<void>()
      this.viewSizeHeight = height
      this.viewSizeWidth = width
      this.pingCount = 0
      this.socket = new WebSocket(this.url)

      if (this.serverConfiguration.websocket.pingEnabled) {
        this.infinitePing()
      }

      this.socket.addEventListener("open", this.openCallback.bind(this))
      this.socket.addEventListener("close", this.closeCallback.bind(this))
      this.socket.addEventListener("message", this.messageCallback.bind(this))

      return this.initialized.promise
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      const error = new Error(ErrorConst.CANT_ESTABLISH)
      this.internalEvent.emitError(error)
      this.initialized?.reject(error)
      return this.initialized?.promise
    }
  }

  async send(message: TWSMessageEvent): Promise<void>
  {
    if (!this.connected) {
      return Promise.reject(new Error("Recognizer must be initilized"))
    }
    await this.connected.promise
    if (this.socket.readyState === this.socket.OPEN) {
      this.#logger.debug("send", { message })
      this.socket.send(JSON.stringify(message))
      return Promise.resolve()
    } else {
      if (this.socket.readyState != this.socket.CONNECTING && this.serverConfiguration.websocket.autoReconnect) {
        this.reconnectionCount++
        if (this.serverConfiguration.websocket.maxRetryCount >= this.reconnectionCount) {
          this.#logger.debug("send", `try to reconnect number: ${ this.reconnectionCount }.`)
          this.internalEvent.emitClearMessage()
          await this.init(this.viewSizeHeight, this.viewSizeWidth)
          await this.setPenStyle(this.penStyle as TPenStyle)
          await this.setPenStyleClasses(this.penStyleClasses as string)
          await this.setTheme(this.theme as TTheme)
          return this.send(message)
        }
        else {
          return Promise.reject(new Error("Unable to send message. The maximum number of connection attempts has been reached."))
        }
      }
    }
  }

  async addStrokes(strokes: TStroke[]): Promise<TExport>
  {
    this.#logger.info("addStrokes", { strokes })
    await this.initialized?.promise
    this.addStrokeDeferred = new DeferredPromise<TExport>()
    if (strokes.length === 0) {
      this.addStrokeDeferred.resolve({} as TExport)
    }
    else {
      await this.send({
        type: "addStrokes",
        strokes: strokes.map(convertStrokeToJSON)
      })
    }
    return this.addStrokeDeferred?.promise
  }

  async setPenStyle(penStyle: TPenStyle): Promise<void>
  {
    this.#logger.info("setPenStyle", { penStyle })
    await this.initialized?.promise
    this.penStyle = penStyle
    const message: TWSMessageEvent = {
      type: "setPenStyle",
      style: StyleHelper.penStyleToCSS(penStyle)
    }
    return this.send(message)
  }

  async setPenStyleClasses(penStyleClasses: string): Promise<void>
  {
    await this.initialized?.promise
    this.penStyleClasses = penStyleClasses
    this.#logger.info("setPenStyleClasses", { penStyleClasses })
    const message: TWSMessageEvent = {
      type: "setPenStyleClasses",
      styleClasses: penStyleClasses
    }
    return this.send(message)
  }

  async setTheme(theme: TTheme): Promise<void>
  {
    this.#logger.info("setTheme", { theme })
    await this.initialized?.promise
    this.theme = theme
    const message: TWSMessageEvent = {
      type: "setTheme",
      theme: StyleHelper.themeToCSS(theme)
    }
    return this.send(message)
  }

  async export(model: Model, requestedMimeTypes?: string[]): Promise<Model>
  {
    this.#logger.info("export", { model, requestedMimeTypes })
    await this.initialized?.promise
    this.exportDeferred = new DeferredPromise<TExport>()
    const localModel = model.getClone()
    let mimeTypes: string[] = requestedMimeTypes || []
    if (!mimeTypes.length) {
      switch (this.recognitionConfiguration.type) {
        case "DIAGRAM":
          mimeTypes = this.recognitionConfiguration.diagram.mimeTypes
          break
        case "MATH":
          mimeTypes = this.recognitionConfiguration.math.mimeTypes
          break
        case "Raw Content":
          mimeTypes = ["application/vnd.myscript.jiix"]
          break
        case "TEXT":
          mimeTypes = this.recognitionConfiguration.text.mimeTypes
          break
        default:
          throw new Error(`Recognition type "${ this.recognitionConfiguration.type }" is unknown.\n Possible types are:\n -DIAGRAM\n -MATH\n -Raw Content\n -TEXT`)
      }
    }

    if (!mimeTypes.length) {
      return Promise.reject(new Error(`Export failed, no mimeTypes define in recognition ${ this.recognitionConfiguration.type } configuration`))
    }

    const message: TWSMessageEvent = {
      type: "export",
      partId: this.currentPartId,
      mimeTypes
    }
    await this.send(message)
    const exports: TExport = await this.exportDeferred?.promise
    localModel.updatePositionReceived()
    localModel.mergeExport(exports)
    this.#logger.debug("export", { model: localModel })
    return localModel
  }

  async import(model: Model, data: Blob, mimeType?: string): Promise<Model>
  {
    this.#logger.info("import", { data, mimeType })
    await this.initialized?.promise
    const localModel = model.getClone()
    const chunkSize = this.serverConfiguration.websocket.fileChunkSize
    const importFileId = Math.random().toString(10).substring(2, 6)
    this.importDeferred = new DeferredPromise<TExport>()
    const readBlob = (blob: Blob): Promise<string | never> =>
    {
      const fileReader = new FileReader()
      return new Promise((resolve, reject) =>
      {
        fileReader.onloadend = (ev) => resolve(ev.target?.result as string)
        fileReader.onerror = () => reject()
        fileReader.readAsText(blob)
      })
    }

    const importFileMessage: TWSMessageEvent = {
      type: "importFile",
      importFileId,
      mimeType
    }
    await this.send(importFileMessage)
    for (let i = 0; i < data.size; i += chunkSize) {
      const blobPart = data.slice(i, i + chunkSize, data.type)
      const partFileString = await readBlob(blobPart)
      const fileChuckMessage: TWSMessageEvent = {
        type: "fileChunk",
        importFileId,
        data: partFileString,
        lastChunk: i + chunkSize > data.size
      }
      await this.send(fileChuckMessage)
    }
    const exports = await this.importDeferred?.promise
    this.importDeferred = undefined
    localModel.mergeExport(exports)
    return localModel
  }

  async resize(model: Model): Promise<Model>
  {
    this.#logger.info("resize", { model })
    await this.initialized?.promise
    this.resizeDeferred = new DeferredPromise<void>()
    const localModel = model.getClone()
    this.viewSizeHeight = localModel.height
    this.viewSizeWidth = localModel.width
    const message: TWSMessageEvent = {
      type: "changeViewSize",
      height: this.viewSizeHeight,
      width: this.viewSizeWidth,
    }
    await this.send(message)
    await this.resizeDeferred?.promise
    return localModel
  }

  async importPointEvents(strokes: TStroke[]): Promise<TExport>
  {
    this.#logger.info("importPointsEvents", { strokes })
    await this.initialized?.promise
    this.importPointEventsDeferred = new DeferredPromise<TExport>()
    const message: TWSMessageEvent = {
      type: "pointerEvents",
      events: strokes.map(convertStrokeToJSON)
    }
    this.send(message)
    const exportPoints = await this.importPointEventsDeferred?.promise
    this.importPointEventsDeferred = undefined
    this.#logger.debug("importPointEvents", { exportPoints })
    return exportPoints as TExport
  }

  async convert(model: Model, conversionState?: TConverstionState): Promise<Model>
  {
    this.#logger.info("convert", { model, conversionState })
    await this.initialized?.promise
    this.convertDeferred = new DeferredPromise<TExport>()
    const localModel = model.getClone()
    const message: TWSMessageEvent = {
      type: "convert",
      conversionState
    }
    await this.send(message)
    const myExportConverted: TExport = await this.convertDeferred?.promise
    localModel.updatePositionReceived()
    localModel.mergeConvert(myExportConverted)
    this.#logger.debug("convert", { model: localModel })
    return localModel
  }

  async waitForIdle(): Promise<void>
  {
    await this.initialized?.promise
    this.waitForIdleDeferred = new DeferredPromise<void>()
    const message: TWSMessageEvent = {
      type: "waitForIdle",
    }
    await this.send(message)
    return this.waitForIdleDeferred?.promise
  }

  async undo(model: Model): Promise<Model>
  {
    this.#logger.info("undo", { model })
    await this.initialized?.promise
    const localModel = model.getClone()
    this.undoDeferred = new DeferredPromise<TExport>()
    const message: TWSMessageEvent = {
      type: "undo",
    }
    await this.send(message)
    const undoExports = await this.undoDeferred?.promise
    localModel.updatePositionReceived()
    localModel.mergeExport(undoExports)
    this.#logger.debug("undo", { model: localModel })
    this.undoDeferred = undefined
    return localModel
  }

  async redo(model: Model): Promise<Model>
  {
    this.#logger.info("redo", { model })
    await this.initialized?.promise
    const localModel = model.getClone()
    this.redoDeferred = new DeferredPromise<TExport>()
    const message: TWSMessageEvent = {
      type: "redo",
    }
    await this.send(message)
    const redoExports = await this.redoDeferred?.promise
    localModel.updatePositionReceived()
    localModel.mergeExport(redoExports)
    this.#logger.debug("redo", { model: redoExports })
    this.redoDeferred = undefined
    return localModel
  }

  async clear(model: Model): Promise<Model>
  {
    this.#logger.info("clear", { model })
    await this.initialized?.promise
    const localModel = model.getClone()
    localModel.modificationDate = Date.now()
    this.clearDeferred = new DeferredPromise<TExport>()
    const message: TWSMessageEvent = {
      type: "clear",
    }
    await this.send(message)
    const clearExports = await this.clearDeferred?.promise
    localModel.updatePositionReceived()
    localModel.mergeExport(clearExports)
    this.clearDeferred = undefined
    this.#logger.info("clear", { model: localModel })
    return localModel
  }

  close(code: number, reason: string): void
  {
    if (this.socket.readyState === this.socket.OPEN || this.socket.readyState === this.socket.CONNECTING) {
      this.#logger.info("close", { code, reason })
      this.socket.removeEventListener("close", this.closeCallback)
      this.socket.removeEventListener("message", this.messageCallback)
      this.socket.removeEventListener("open", this.openCallback)
      this.socket.close(code, reason)
    }
  }

  destroy(): void
  {
    this.#logger.info("destroy")
    this.connected = undefined
    this.initialized = undefined
    this.addStrokeDeferred = undefined
    this.exportDeferred = undefined
    this.convertDeferred = undefined
    this.importDeferred = undefined
    this.resizeDeferred = undefined
    this.undoDeferred = undefined
    this.redoDeferred = undefined
    this.clearDeferred = undefined
    if (this.socket) {
      this.socket.removeEventListener("close", this.closeCallback)
      this.socket.removeEventListener("message", this.messageCallback)
      this.socket.removeEventListener("open", this.openCallback)
      this.close(1000, "Recognizer destroyed")
    }
  }
}
