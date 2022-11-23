import { TConverstionState, TRecognitionConfiguration } from "../@types/configuration/RecognitionConfiguration"
import { TServerConfiguration } from "../@types/configuration/ServerConfiguration"
import { IModel, TExport } from "../@types/model/Model"
import { TWebSocketContentChangeEvent, TWebSocketErrorEvent, TWebSocketEvent, TWebSocketExportEvent, TWebSocketHMACChallengeEvent, TWebSocketPartChangeEvent, TWebSocketSVGPatchEvent } from "../@types/recognizer/WSRecognizer"
import { TStroke } from "../@types/model/Stroke"
import { Error as ErrorConst, WSEventType } from "../Constants"
import { WSEvent } from "../event/WSEvent"
import { AbstractRecognizer } from "./AbstractRecognizer"
import { computeHmac } from "./CryptoHelper"
import StyleHelper from "../style/StyleHelper"
import { DeferredPromise } from "../utils/DeferredPromise"
import { TPenStyle } from "../@types/style/PenStyle"
import { TTheme } from "../@types/style/Theme"

export class WSRecognizer extends AbstractRecognizer
{
  private socket!: WebSocket
  private pingCount = 0
  private reconnectionCount = 0
  // private contentPartCount = 0
  private sessionId?: string
  private currentPartId?: string
  private viewSizeHeight!: number
  private viewSizeWidth!: number
  private currentErrorCode?: string | number
  wsEvent: WSEvent

  #fileImportDeffered?: DeferredPromise<TExport>

  constructor(serverConfig: TServerConfiguration, recognitionConfig: TRecognitionConfiguration)
  {
    super(serverConfig, recognitionConfig)
    this.wsEvent = new WSEvent()
  }

  get url()
  {
    const scheme = (this.serverConfiguration.scheme === 'https') ? 'wss' : 'ws'
    return `${ scheme }://${ this.serverConfiguration.host }/api/v4.0/iink/document`
  }

  get mimeTypes(): string[]
  {
    switch (this.recognitionConfiguration.type.toLocaleLowerCase()) {
      case 'text':
        return this.recognitionConfiguration.text.mimeTypes
      case 'math':
        return this.recognitionConfiguration.math.mimeTypes
      case 'diagram':
        return this.recognitionConfiguration.diagram.mimeTypes
      default:
        //'raw-content'
        return []
    }
  }

  private infinitePing(): void
  {
    this.pingCount++
    if (this.serverConfiguration.websocket.maxPingLostCount < this.pingCount) {
      this.close(1000, 'PING_LOST')
    } else if (this.socket.readyState <= 1) {
      setTimeout(() =>
      {
        if (this.socket.readyState <= 1) {
          this.socket.send(JSON.stringify({ type: 'ping' }))
          this.infinitePing()
        }
      }, this.serverConfiguration.websocket.pingDelay)
    }
  }

  private openCallback(): void
  {
    this.wsEvent.emitConnected()
    const params = {
      type: this.sessionId ? 'restoreIInkSession' : 'newContentPackage',
      iinkSessionId: this.sessionId,
      applicationKey: this.serverConfiguration.applicationKey,
      xDpi: 96,
      yDpi: 96,
      viewSizeHeight: this.viewSizeHeight,
      viewSizeWidth: this.viewSizeWidth
    }
    this.send(params)
  }

  private closeCallback(evt: CloseEvent): void
  {
    let message = ''
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
      if (message) {
        this.wsEvent.emitError(new Error(message))
      }
    }
    this.wsEvent.emitDisconnected(evt)
  }

  // private errorCallback(e: Event): void
  // {
  //   this.wsEvent.emitError(new Error(e.type))
  // }

  private manageHMACChallengeMessage(websocketMessage: TWebSocketEvent): void
  {
    const hmacChallengeMessage = websocketMessage as TWebSocketHMACChallengeEvent
    if (hmacChallengeMessage.hmacChallenge) {
      this.send({
        type: 'hmac',
        hmac: computeHmac(hmacChallengeMessage.hmacChallenge, this.serverConfiguration.applicationKey, this.serverConfiguration.hmacKey)
      })
    }
    if (hmacChallengeMessage.iinkSessionId) {
      this.sessionId = hmacChallengeMessage.iinkSessionId
    }
  }

  private manageContentPackageDescriptionMessage(): void
  {
    this.reconnectionCount = 0

    this.send({ ...this.recognitionConfiguration, type: 'configuration' })

    if (this.currentPartId) {
      this.send({ type: 'openContentPart', id: this.currentPartId, mimeTypes: this.mimeTypes })
    }
    else {
      this.send({ type: 'newContentPart', contentType: this.recognitionConfiguration.type, mimeTypes: this.mimeTypes })
    }
  }

  private managePartChangeMessage(websocketMessage: TWebSocketEvent): void
  {
    const partChangeMessage = websocketMessage as TWebSocketPartChangeEvent
    this.currentPartId = partChangeMessage.partId
    this.wsEvent.emitPartChange(partChangeMessage)
  }

  private manageContentChangeMessage(websocketMessage: TWebSocketEvent): void
  {
    const contentChangeMessage = websocketMessage as TWebSocketContentChangeEvent
    this.wsEvent.emitContentChange(contentChangeMessage)
  }

  private manageExportMessage(websocketMessage: TWebSocketEvent): void
  {
    const exportMessage = websocketMessage as TWebSocketExportEvent
    this.wsEvent.emitExported(exportMessage)
  }

  private manageSVGPatchMessage(websocketMessage: TWebSocketEvent): void
  {
    const svgPatchMessage = websocketMessage as TWebSocketSVGPatchEvent
    this.wsEvent.emitSVGPatch(svgPatchMessage)
  }

  private manageErrorMessage(websocketMessage: TWebSocketEvent): void
  {
    const err = websocketMessage as TWebSocketErrorEvent
    this.currentErrorCode = err.data?.code || err.code
    let message = err.data?.message || err.message || ErrorConst.UNKNOW
    if (this.currentErrorCode === 'access.not.granted') {
      message = ErrorConst.WRONG_CREDENTIALS
    }
    this.wsEvent.emitError(new Error(message))
  }

  private messageCallback(message: MessageEvent<string>): void
  {
    this.currentErrorCode = undefined
    const websocketMessage: TWebSocketEvent = JSON.parse(message.data)
    if (websocketMessage.type !== 'pong') {
      this.pingCount = 0
      switch (websocketMessage.type) {
        case 'ack':
          this.manageHMACChallengeMessage(websocketMessage)
          break
        case 'contentPackageDescription':
          this.manageContentPackageDescriptionMessage()
          break
        case 'partChanged':
          this.managePartChangeMessage(websocketMessage)
          break
        case 'newPart':
          this.wsEvent.emitConnectionActive()
          break
        case 'contentChanged':
          this.manageContentChangeMessage(websocketMessage)
          break
        case 'exported':
          this.manageExportMessage(websocketMessage)
          break
        case 'svgPatch':
          this.manageSVGPatchMessage(websocketMessage)
          break
        case 'error':
          this.manageErrorMessage(websocketMessage)
          break
        // case 'supportedImportMimeTypes':
        //   recognizerContext.supportedImportMimeTypes = message.data.mimeTypes
        //   recognitionContext.response(undefined, message.data)
        //   break
        case 'fileChunkAck':
          this.#fileImportDeffered?.resolve((websocketMessage as unknown) as TExport)
          break
        //   case 'idle':
        //     recognizerContext.idle = true
        //     recognitionContext.patch(undefined, message.data)
        //     break
        //   default :
        //     logger.warn('This is something unexpected in current recognizer. Not the type of message we should have here.', message)
      }
    }
  }

  init(height: number, width: number): void
  {
    try {
      this.viewSizeHeight = height
      this.viewSizeWidth = width

      this.socket = new WebSocket(this.url)

      if (this.serverConfiguration.websocket.pingEnabled) {
        this.infinitePing()
      }

      this.socket.onopen = () => this.openCallback()
      this.socket.onclose = (ev: CloseEvent) => this.closeCallback(ev)
      // this.socket.onerror = (ev: Event) => this.errorCallback(ev)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.socket.onmessage = (ev: MessageEvent<any>) => this.messageCallback(ev)

      this.wsEvent.emitInitialized()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      const error = new Error(ErrorConst.CANT_ESTABLISH)
      error.name = err.code || 'CANT_ESTABLISH'
      this.wsEvent.emitError(err)
    }
  }

  canReconnect(): boolean
  {
    return this.serverConfiguration.websocket.autoReconnect &&
      this.reconnectionCount <= this.serverConfiguration.websocket.maxRetryCount &&
      (!this.currentErrorCode || !['api.invalid.format', 'access.not.granted'].includes(this.currentErrorCode.toString()))
  }

  addStrokes(model: IModel): void
  {
    const strokes: TStroke[] = model.extractPendingStrokes()
    if (strokes.length === 0) {
      return
    }
    this.send({
      type: 'addStrokes',
      strokes: strokes.map((s: TStroke) =>
      {
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
  }

  send(message: TWebSocketEvent): void
  {
    if (this.socket.readyState === this.socket.OPEN) {
      this.socket.send(JSON.stringify(message))
    } else {
      this.socket.removeEventListener('close', this.closeCallback)
      // this.socket.removeEventListener('error', this.errorCallback)
      this.socket.removeEventListener('message', this.messageCallback)
      this.socket.removeEventListener('open', this.openCallback)
      throw new Error(WSEventType.DISCONNECTED)
    }
  }

  close(code: number, reason: string): void
  {
    if (this.socket.readyState === this.socket.OPEN || this.socket.readyState === this.socket.CONNECTING) {
      this.socket.close(code, reason)
    }
  }

  setPenStyle(penStyle: TPenStyle): void
  {
    const message: TWebSocketEvent = {
      type: 'setPenStyle',
      style: StyleHelper.penStyleToCSS(penStyle)
    }
    this.send(message)
  }

  setPenStyleClasses(penStyleClasses: string): void
  {
    const message: TWebSocketEvent = {
      type: 'setPenStyleClasses',
      styleClasses: penStyleClasses
    }
    this.send(message)
  }

  setTheme(theme: TTheme)
  {
    const message: TWebSocketEvent = {
      type: 'setTheme',
      theme: StyleHelper.themeToCSS(theme)
    }
    this.send(message)
  }

  async export(model: IModel, requestedMimeTypes?: string[]): Promise<IModel | never>
  {
    let mimeTypes: string[] = requestedMimeTypes || []
    if (!mimeTypes.length) {
      switch (this.recognitionConfiguration.type) {
        case 'DIAGRAM':
          mimeTypes = this.recognitionConfiguration.diagram.mimeTypes
          break
        case 'MATH':
          mimeTypes = this.recognitionConfiguration.math.mimeTypes
          break
        case 'Raw Content':
          mimeTypes = ['application/vnd.myscript.jiix']
          break
        case 'TEXT':
          mimeTypes = this.recognitionConfiguration.text.mimeTypes
          break
        default:
          throw new Error(`Recognition type "${ this.recognitionConfiguration.type }" is unknown.\n Possible types are:\n -DIAGRAM\n -MATH\n -Raw Content\n -TEXT`)
          break
      }
    }

    if (!mimeTypes.length) {
      return Promise.reject(new Error('Export failed, no mimeTypes define in recognition configuration'))
    }

    const message: TWebSocketEvent = {
      type: 'export',
      partId: this.currentPartId,
      mimeTypes
    }
    this.send(message)
    return model
  }

  async import(data: Blob, mimeType?: string): Promise<TExport | never>
  {
    const chunkSize = this.serverConfiguration.websocket.fileChunkSize
    const importFileId = Math.random().toString(10).substring(2, 6)
    // const messages = []
    this.#fileImportDeffered = new DeferredPromise<TExport>()
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

    const importFileMessage: TWebSocketEvent = {
      type: 'importFile',
      importFileId,
      mimeType
    }
    this.send(importFileMessage)

    for (let i = 0; i < data.size; i += chunkSize) {
      const blobPart = data.slice(i, chunkSize, data.type)
      const partFileString = await readBlob(blobPart)
      const fileChuckMessage: TWebSocketEvent = {
        type: 'fileChunk',
        importFileId,
        data: partFileString,
        lastChunk: i + chunkSize > data.size
      }
      this.send(fileChuckMessage)
    }
    return this.#fileImportDeffered.promise
  }

  async resize(model: IModel): Promise<IModel>
  {
    this.viewSizeHeight = model.height
    this.viewSizeWidth = model.width
    const message: TWebSocketEvent = {
      type: 'changeViewSize',
      height: this.viewSizeHeight,
      width: this.viewSizeWidth,
    }
    this.send(message)
    return Promise.resolve(model)
  }

  convert(conversionState?: TConverstionState): void
  {
    const message: TWebSocketEvent = {
      type: 'convert',
      conversionState
    }
    this.send(message)
  }

  undo(): void
  {
    const message: TWebSocketEvent = {
      type: 'undo',
    }
    this.send(message)
  }

  redo(): void
  {
    const message: TWebSocketEvent = {
      type: 'redo',
    }
    this.send(message)
  }

  clear(): void
  {
    const message: TWebSocketEvent = {
      type: 'clear',
    }
    this.send(message)
  }
}
