import { TConverstionState, TRecognitionConfiguration } from "../@types/configuration/RecognitionConfiguration"
import { TServerConfiguration } from "../@types/configuration/ServerConfiguration"
import { IModel, TExport } from "../@types/model/Model"
import { TWebSocketErrorEvent, TWebSocketEvent, TWebSocketExportEvent, TWebSocketHMACChallengeEvent, TWebSocketPartChangeEvent, TWebSocketSVGPatchEvent } from "../@types/recognizer/WSRecognizer"
import { TPenStyle } from "../@types/style/PenStyle"
import { TTheme } from "../@types/style/Theme"
import { TStroke } from "../@types/model/Stroke"
import { Error as ErrorConst, WSEventType } from "../Constants"
import { WSEvent } from "../event/WSEvent"
import { AbstractRecognizer } from "./AbstractRecognizer"
import { computeHmac } from "./CryptoHelper"
import StyleHelper from "../style/StyleHelper"
import { DeferredPromise } from "../utils/DeferredPromise"
import { isVersionSuperiorOrEqual } from "../utils/versionHelper"
import { GlobalEvent } from "../event/GlobalEvent"
/**
 * A websocket dialog have this sequence :
 * ---------- Client ------------------------------------- Server ----------------------------------
 * init (send the new content package) ==================>
 *                                     <================== hmacChallenge
 * answerToHmacChallenge (send the hmac) =========>
 * newPart (send the parameters ) ===============>
 *                                       <=========== update
 * addStrokes (send the strokes ) ============>
 *                                       <=========== update
 */
export class WSRecognizer extends AbstractRecognizer {
  #socket!: WebSocket
  #pingCount = 0
  #reconnectionCount = 0
  #viewSizeHeight!: number
  #viewSizeWidth!: number
  // #contentPartCount = 0
  #sessionId?: string
  #currentPartId?: string
  #currentErrorCode?: string | number

  #penStyle?: TPenStyle
  #penStyleClasses?: string
  #theme?: TTheme

  wsEvent: WSEvent

  #connected?: DeferredPromise<void>
  #initialized?: DeferredPromise<void>
  #addStrokeDeferred?: DeferredPromise<TExport>
  #exportDeferred?: DeferredPromise<TExport>
  #convertDeferred?: DeferredPromise<TExport>
  #importDeferred?: DeferredPromise<TExport>
  #resizeDeferred?: DeferredPromise<TExport>
  #undoDeferred?: DeferredPromise<TExport>
  #redoDeferred?: DeferredPromise<TExport>
  #clearDeferred?: DeferredPromise<TExport>


  constructor(serverConfig: TServerConfiguration, recognitionConfig: TRecognitionConfiguration) {
    super(serverConfig, recognitionConfig)
    this.wsEvent = new WSEvent()
  }

  get url() {
    const scheme = (this.serverConfiguration.scheme === "https") ? "wss" : "ws"
    return `${ scheme }://${ this.serverConfiguration.host }/api/v4.0/iink/document?applicationKey=${ this.serverConfiguration.applicationKey }`
  }

  get mimeTypes(): string[] {
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

  get globalEvent(): GlobalEvent
  {
    return GlobalEvent.getInstance()
  }

  private infinitePing(): void {
    this.#pingCount++
    if (this.serverConfiguration.websocket.maxPingLostCount < this.#pingCount) {
      this.#socket.close(1000, "PING_LOST")
    } else if (this.#socket.readyState <= 1) {
      setTimeout(() => {
        if (this.#socket.readyState <= 1) {
          this.#socket.send(JSON.stringify({ type: "ping" }))
          this.infinitePing()
        }
      }, this.serverConfiguration.websocket.pingDelay)
    }
  }

  private openCallback(): void {
    this.#connected?.resolve()
    const params: TWebSocketEvent = {
      type: this.#sessionId ? "restoreIInkSession" : "newContentPackage",
      iinkSessionId: this.#sessionId,
      applicationKey: this.serverConfiguration.applicationKey,
      xDpi: 96,
      yDpi: 96,
      viewSizeHeight: this.#viewSizeHeight,
      viewSizeWidth: this.#viewSizeWidth
    }
    if (isVersionSuperiorOrEqual(this.serverConfiguration.version, "2.0.4")) {
      params["myscript-client-name"] = "iink-ts"
      params["myscript-client-version"] = "1.0.0-buildVersion"
    }
    this.send(params)
  }

  private rejectDeferredPending(error: Error): void
  {
    if (this.#connected?.isPending) {
      this.#connected?.reject(error)
    }
    if (this.#initialized?.isPending) {
      this.#initialized?.reject(error)
    }
    if (this.#addStrokeDeferred?.isPending) {
      this.#addStrokeDeferred?.reject(error)
    }
    if (this.#exportDeferred?.isPending) {
      this.#exportDeferred?.reject(error)
    }
    if (this.#convertDeferred?.isPending) {
      this.#convertDeferred?.reject(error)
    }
    if (this.#importDeferred?.isPending) {
      this.#importDeferred?.reject(error)
    }
    if (this.#resizeDeferred?.isPending) {
      this.#resizeDeferred?.reject(error)
    }
    if (this.#undoDeferred?.isPending) {
      this.#undoDeferred?.reject(error)
    }
    if (this.#redoDeferred?.isPending) {
      this.#redoDeferred?.reject(error)
    }
    if (this.#clearDeferred?.isPending) {
      this.#clearDeferred.reject(error)
    }
  }

  private closeCallback(evt: CloseEvent): void {
    let message = ""
    if (!this.#currentErrorCode) {
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
    const error = new Error(message || evt.reason)

    this.rejectDeferredPending(error)

    if (!this.#currentErrorCode && evt.code !== 1000) {
      this.globalEvent.emitError(error)
    }
  }

  private manageHMACChallengeMessage(websocketMessage: TWebSocketEvent): void {
    const hmacChallengeMessage = websocketMessage as TWebSocketHMACChallengeEvent
    if (hmacChallengeMessage.hmacChallenge) {
      this.send({
        type: "hmac",
        hmac: computeHmac(hmacChallengeMessage.hmacChallenge, this.serverConfiguration.applicationKey, this.serverConfiguration.hmacKey)
      })
    }
    if (hmacChallengeMessage.iinkSessionId) {
      this.#sessionId = hmacChallengeMessage.iinkSessionId
    }
  }

  private manageContentPackageDescriptionMessage(): void {
    this.#reconnectionCount = 0

    this.send({ ...this.recognitionConfiguration, type: "configuration" })

    if (this.#currentPartId) {
      this.send({ type: "openContentPart", id: this.#currentPartId, mimeTypes: this.mimeTypes })
    }
    else {
      this.send({ type: "newContentPart", contentType: this.recognitionConfiguration.type, mimeTypes: this.mimeTypes })
    }
  }

  private managePartChangeMessage(websocketMessage: TWebSocketEvent): void {
    const partChangeMessage = websocketMessage as TWebSocketPartChangeEvent
    this.#currentPartId = partChangeMessage.partId
  }

  private manageExportMessage(websocketMessage: TWebSocketEvent): void {
    const exportMessage = websocketMessage as TWebSocketExportEvent
    this.#initialized?.resolve()
    this.#addStrokeDeferred?.resolve(exportMessage.exports)
    this.#exportDeferred?.resolve(exportMessage.exports)
    this.#convertDeferred?.resolve(exportMessage.exports)
    this.#importDeferred?.resolve(exportMessage.exports)
    this.#resizeDeferred?.resolve(exportMessage.exports)
    this.#undoDeferred?.resolve(exportMessage.exports)
    this.#redoDeferred?.resolve(exportMessage.exports)
    this.#clearDeferred?.resolve(exportMessage.exports)
    this.globalEvent.emitExported(exportMessage.exports)
  }

  private manageErrorMessage(websocketMessage: TWebSocketEvent): void {
    const err = websocketMessage as TWebSocketErrorEvent
    this.#currentErrorCode = err.data?.code || err.code
    let message = err.data?.message || err.message || ErrorConst.UNKNOW

    switch (this.#currentErrorCode) {
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
    this.globalEvent.emitError(error)
  }

  private manageSVGPatchMessage(websocketMessage: TWebSocketEvent): void {
    const svgPatchMessage = websocketMessage as TWebSocketSVGPatchEvent
    this.wsEvent.emitSVGPatch(svgPatchMessage)
  }

  private messageCallback(message: MessageEvent<string>): void {
    this.#currentErrorCode = undefined
    const websocketMessage: TWebSocketEvent = JSON.parse(message.data)
    if (websocketMessage.type !== "pong") {
      this.#pingCount = 0
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
        // case "newPart":
        //   this.#initialized?.resolve()
        //   break
        case "exported":
          this.manageExportMessage(websocketMessage)
          break
        case "svgPatch":
          this.manageSVGPatchMessage(websocketMessage)
          break
        case "error":
          this.manageErrorMessage(websocketMessage)
          break
        // case "supportedImportMimeTypes":
        //   recognizerContext.supportedImportMimeTypes = message.data.mimeTypes
        //   recognitionContext.response(undefined, message.data)
        //   break
        case "fileChunkAck":
          this.#importDeferred?.resolve((websocketMessage as unknown) as TExport)
          break
        //   case "idle":
        //     recognizerContext.idle = true
        //     recognitionContext.patch(undefined, message.data)
        //     break
        //   default :
        //     logger.warn("This is something unexpected in current recognizer. Not the type of message we should have here.", message)
      }
    }
  }

  async init(height: number, width: number): Promise<void> {
    try {
      this.#connected = new DeferredPromise<void>()
      this.#initialized = new DeferredPromise<void>()

      this.#viewSizeHeight = height
      this.#viewSizeWidth = width
      this.#pingCount = 0
      if (this.#socket) {
        this.#socket.close()
        this.#socket.removeEventListener("close", this.closeCallback)
        /* this.#socket.removeEventListener("error", this.errorCallback) */
        this.#socket.removeEventListener("message", this.messageCallback)
        this.#socket.removeEventListener("open", this.openCallback)
      }
      this.#socket = new WebSocket(this.url)

      if (this.serverConfiguration.websocket.pingEnabled) {
        this.infinitePing()
      }

      this.#socket.onopen = () => this.openCallback()
      this.#socket.onclose = (ev: CloseEvent) => this.closeCallback(ev)
      /* this.#socket.onerror = (ev: Event) => this.errorCallback(ev) */
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.#socket.onmessage = (ev: MessageEvent<any>) => this.messageCallback(ev)

      return this.#initialized.promise
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      const error = new Error(ErrorConst.CANT_ESTABLISH)
      this.globalEvent.emitError(error)
      this.#initialized?.reject(error)
      return this.#initialized?.promise
    }
  }

  async addStrokes(model: IModel): Promise<IModel> {
    const localModel = model.getClone()
    const strokes: TStroke[] = localModel.extractPendingStrokes()
    if (strokes.length === 0) {
      return localModel
    }
    this.#addStrokeDeferred = new DeferredPromise<TExport>()
    this.send({
      type: "addStrokes",
      strokes: strokes.map((s: TStroke) => {
        return {
          pointerType: s.pointerType,
          pointerId: s.pointerId,
          x: s.x,
          y: s.y,
          t: s.t,
          p: s.p,
        }
      })
    })
    const exports = await this.#addStrokeDeferred.promise
    localModel.updatePositionReceived()
    localModel.mergeExport(exports)
    return localModel
  }

  async send(message: TWebSocketEvent): Promise<void> {
    await this.#connected?.promise
    if (this.#socket.readyState === this.#socket.OPEN) {
      this.#socket.send(JSON.stringify(message))
    } else {
      if (this.#socket.readyState != this.#socket.CONNECTING) {
        this.#reconnectionCount++
        if (this.serverConfiguration.websocket.maxRetryCount >= this.#reconnectionCount) {
          this.globalEvent.emitClearMessage()
          await this.init(this.#viewSizeHeight, this.#viewSizeWidth)
          this.setPenStyle(this.#penStyle as TPenStyle)
          this.setPenStyleClasses(this.#penStyleClasses as string)
          this.setTheme(this.#theme as TTheme)
          this.send(message)
        }
        else {
          throw new Error(WSEventType.DISCONNECTED)
        }
      }
    }
  }

  close(code: number, reason: string): void {
    if (this.#socket.readyState === this.#socket.OPEN || this.#socket.readyState === this.#socket.CONNECTING) {
      this.#socket.close(code, reason)
    }
  }

  setPenStyle(penStyle: TPenStyle): void {
    this.#penStyle = penStyle
    const message: TWebSocketEvent = {
      type: "setPenStyle",
      style: StyleHelper.penStyleToCSS(penStyle)
    }
    this.send(message)
  }

  setPenStyleClasses(penStyleClasses: string): void {
    this.#penStyleClasses = penStyleClasses
    const message: TWebSocketEvent = {
      type: "setPenStyleClasses",
      styleClasses: penStyleClasses
    }
    this.send(message)
  }

  setTheme(theme: TTheme) {
    this.#theme = theme
    const message: TWebSocketEvent = {
      type: "setTheme",
      theme: StyleHelper.themeToCSS(theme)
    }
    this.send(message)
  }

  async export(model: IModel, requestedMimeTypes?: string[]): Promise<IModel | never> {
    this.#exportDeferred = new DeferredPromise<TExport>()
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
          throw new Error(`Recognition type "${this.recognitionConfiguration.type}" is unknown.\n Possible types are:\n -DIAGRAM\n -MATH\n -Raw Content\n -TEXT`)
      }
    }

    if (!mimeTypes.length) {
      return Promise.reject(new Error("Export failed, no mimeTypes define in recognition configuration"))
    }

    const message: TWebSocketEvent = {
      type: "export",
      partId: this.#currentPartId,
      mimeTypes
    }
    this.send(message)
    const exports: TExport = await this.#exportDeferred.promise
    localModel.updatePositionReceived()
    localModel.mergeExport(exports)
    return localModel
  }

  async import(data: Blob, mimeType?: string): Promise<TExport | never> {
    const chunkSize = this.serverConfiguration.websocket.fileChunkSize
    const importFileId = Math.random().toString(10).substring(2, 6)
    // const messages = []
    this.#importDeferred = new DeferredPromise<TExport>()
    const readBlob = (blob: Blob): Promise<string | never> => {
      const fileReader = new FileReader()
      return new Promise((resolve, reject) => {
        fileReader.onloadend = (ev) => resolve(ev.target?.result as string)
        fileReader.onerror = () => reject()
        fileReader.readAsText(blob)
      })
    }

    const importFileMessage: TWebSocketEvent = {
      type: "importFile",
      importFileId,
      mimeType
    }
    this.send(importFileMessage)

    for (let i = 0; i < data.size; i += chunkSize) {
      const blobPart = data.slice(i, chunkSize, data.type)
      const partFileString = await readBlob(blobPart)
      const fileChuckMessage: TWebSocketEvent = {
        type: "fileChunk",
        importFileId,
        data: partFileString,
        lastChunk: i + chunkSize > data.size
      }
      this.send(fileChuckMessage)
    }
    return this.#importDeferred.promise
  }

  async resize(model: IModel): Promise<IModel> {
    this.#resizeDeferred = new DeferredPromise<TExport>()
    const localModel = model.getClone()
    this.#viewSizeHeight = localModel.height
    this.#viewSizeWidth = localModel.width
    const message: TWebSocketEvent = {
      type: "changeViewSize",
      height: this.#viewSizeHeight,
      width: this.#viewSizeWidth,
    }
    this.send(message)
    const exports: TExport = await this.#resizeDeferred.promise
    if (localModel.exports) {
      Object.assign(localModel.exports, exports)
    } else {
      localModel.exports = exports
    }
    return localModel
  }

  async convert(model: IModel, conversionState?: TConverstionState): Promise<IModel> {
    this.#convertDeferred = new DeferredPromise<TExport>()
    const localModel = model.getClone()
    const message: TWebSocketEvent = {
      type: "convert",
      conversionState
    }
    this.send(message)
    const myExportConverted: TExport = await this.#convertDeferred.promise
    localModel.updatePositionReceived()
    if (localModel.converts) {
      Object.assign(localModel.converts, myExportConverted)
    } else {
      localModel.converts = myExportConverted
    }
    return localModel
  }

  async undo(model: IModel): Promise<IModel> {
    const localModel = model.getClone()
    this.#undoDeferred = new DeferredPromise<TExport>()
    const message: TWebSocketEvent = {
      type: "undo",
    }
    this.send(message)
    const undoExports = await this.#undoDeferred.promise
    localModel.updatePositionReceived()
    localModel.mergeExport(undoExports)
    this.#undoDeferred = undefined
    return localModel
  }

  async redo(model: IModel): Promise<IModel> {
    const localModel = model.getClone()
    this.#redoDeferred = new DeferredPromise<TExport>()
    const message: TWebSocketEvent = {
      type: "redo",
    }
    this.send(message)
    const redoExports = await this.#redoDeferred.promise
    localModel.updatePositionReceived()
    localModel.mergeExport(redoExports)
    this.#redoDeferred = undefined
    return localModel
  }

  async clear(model: IModel): Promise<IModel> {
    const localModel = model.getClone()
    this.#clearDeferred = new DeferredPromise<TExport>()
    const message: TWebSocketEvent = {
      type: "clear",
    }
    this.send(message)
    const clearExports = await this.#clearDeferred?.promise
    localModel.updatePositionReceived()
    localModel.mergeExport(clearExports)
    this.#clearDeferred = undefined
    return localModel
  }
}
