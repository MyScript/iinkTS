import { LoggerCategory, LoggerManager } from "../logger"
import { TExport, TJIIXExport } from "../model"
import { TStroke, TStrokeToSend } from "../symbol"
import { computeHmac, isVersionSuperiorOrEqual, PartialDeep } from "../utils"
import { RecognizerError } from "./RecognizerError"
import { RecognizerHTTPV2Configuration, TRecognizerHTTPV2Configuration } from "./RecognizerHTTPV2Configuration"
import { TDiagramConfiguration, TExportConfiguration, TMathConfiguration, TRawContentConfiguration, TTextConfiguration } from "./recognition"

type ApiError = {
  code?: string
  message: string
}

/**
 * @group Recognizer
 */
export type TRecognizerHTTPV2PostConfiguration = {
  lang: string,
  diagram?: TDiagramConfiguration,
  math?: TMathConfiguration,
  "raw-content"?: TRawContentConfiguration,
  text?: TTextConfiguration,
  export: TExportConfiguration
}

/**
 * @group Recognizer
 */
export type TRecognizerHTTPV2PostData = {
  scaleX: number,
  scaleY: number,
  configuration: TRecognizerHTTPV2PostConfiguration,
  contentType: string,
  strokes: TStrokeToSend[]
}

/**
 * @group Recognizer
 */
export class RecognizerHTTPV2 {
  #logger = LoggerManager.getLogger(LoggerCategory.RECOGNIZER)

  protected configuration: RecognizerHTTPV2Configuration

  constructor(config: PartialDeep<TRecognizerHTTPV2Configuration>) {
    this.#logger.info("constructor", { config })
    this.configuration = new RecognizerHTTPV2Configuration(config)
  }

  get url() {
    return `${this.configuration.server.scheme}://${this.configuration.server.host}/api/v4.0/iink/recognize`
  }

  get postConfig(): TRecognizerHTTPV2PostConfiguration {
    switch (this.configuration.recognition.type) {
      case "SHAPE":
        return {
          lang: this.configuration.recognition.lang,
          diagram: this.configuration.recognition.shape,
          export: this.configuration.recognition.export
        }
      case "MATH":
        return {
          lang: this.configuration.recognition.lang,
          math: this.configuration.recognition.math,
          export: this.configuration.recognition.export
        }
      case "Raw Content":
        return {
          lang: this.configuration.recognition.lang,
          "raw-content": this.configuration.recognition["raw-content"],
          export: this.configuration.recognition.export
        }
      case "TEXT":
        return {
          lang: this.configuration.recognition.lang,
          text: this.configuration.recognition.text,
          export: this.configuration.recognition.export
        }
      default:
        throw new Error(`get postConfig error Recognition type unkow "${this.configuration.recognition.type}"`)
        break
    }
  }

  protected formatStrokes(strokes: TStroke[]): TStrokeToSend[] {
    return strokes.map(s => {
      return {
        id: s.id,
        pointerType: s.pointerType,
        p: s.pointers.map(p => p.p),
        t: s.pointers.map(p => p.t),
        x: s.pointers.map(p => p.x),
        y: s.pointers.map(p => p.y)
      }
    })
  }

  protected buildData(strokes: TStroke[]): TRecognizerHTTPV2PostData {
    this.#logger.info("buildData", { strokes })

    const contentType: string = this.configuration.recognition.type === "Raw Content" ?
      "Raw Content" :
      this.configuration.recognition.type.charAt(0).toUpperCase() + this.configuration.recognition.type.slice(1).toLowerCase()

    const data = {
      configuration: this.postConfig,
      scaleX: 0.265,
      scaleY: 0.265,
      contentType,
      strokes: this.formatStrokes(strokes)
    }
    this.#logger.debug("buildData", { data })
    return data
  }

  protected async post(data: unknown, mimeType: string): Promise<unknown> {
    this.#logger.info("post", { data, mimeType })
    const headers = new Headers()
    headers.append("Accept", mimeType)
    headers.append("applicationKey", this.configuration.server.applicationKey)
    try {
      const hmac = await computeHmac(JSON.stringify(data), this.configuration.server.applicationKey, this.configuration.server.hmacKey)
      headers.append("hmac", hmac)
    } catch (error) {
      this.#logger.error("post.computeHmac", error)
    }
    headers.append("Content-Type", "application/json")


    if (this.configuration.server.version && isVersionSuperiorOrEqual(this.configuration.server.version, "2.0.4")) {
      headers.append("myscript-client-name", "iink-ts")
      headers.append("myscript-client-version", "1.0.0-buildVersion")
    }

    const reqInit: RequestInit = {
      method: "POST",
      headers,
      body: JSON.stringify(data)
    }
    const request = new Request(this.url, reqInit)
    const response: Response = await fetch(request)
    if (response.ok) {
      const contentType = response.headers.get("content-type")
      let result: unknown
      switch (contentType) {
        case "application/vnd.openxmlformats-officedocument.presentationml.presentation":
        case "image/png":
        case "image/jpeg":
          result = await response.blob()
          break
        case "application/json":
          result = await response.json()
          break
        case "application/vnd.myscript.jiix":
          result = await response.clone().json().catch(async () => await response.text())
          break
        default:
          result = await response.text()
          break
      }
      this.#logger.debug("post", { result })
      return result
    } else {
      const err = await response.json() as ApiError
      this.#logger.error("post", { err })
      throw err
    }
  }

  protected async tryFetch(data: TRecognizerHTTPV2PostData, mimeType: string): Promise<TExport | never> {
    this.#logger.debug("tryFetch", { data, mimeType })
    return this.post(data, mimeType)
      .then((res) => {
        const exports: TExport = {}
        exports[mimeType] = res as TJIIXExport | string | Blob
        this.#logger.debug("tryFetch", { exports })
        return exports
      })
      .catch((err) => {
        this.#logger.error("tryFetch", { data, mimeType, err })
        let message = err.message || RecognizerError.UNKNOW
        if (!err.code) {
          message = RecognizerError.CANT_ESTABLISH
        } else if (err.code === "access.not.granted") {
          message = RecognizerError.WRONG_CREDENTIALS
        }
        const error = new Error(message)
        throw error
      })
  }

  protected getMimeTypes(requestedMimeTypes?: string[]): string[] {
    this.#logger.info("getMimeTypes", { requestedMimeTypes })
    let mimeTypes: string[] = requestedMimeTypes || []
    if (!mimeTypes.length) {
      switch (this.configuration.recognition.type) {
        case "SHAPE":
          mimeTypes = this.configuration.recognition.shape.mimeTypes
          break
        case "MATH":
          mimeTypes = this.configuration.recognition.math.mimeTypes
          break
        case "Raw Content":
          mimeTypes = ["application/vnd.myscript.jiix"]
          break
        case "TEXT":
          mimeTypes = this.configuration.recognition.text.mimeTypes
          break
        default:
          throw new Error(`Recognition type "${this.configuration.recognition.type}" is unknown.\n Possible types are:\n -DIAGRAM\n -MATH\n -Raw Content\n -TEXT\n -SHAPE`)
          break
      }
    }
    return mimeTypes
  }

  async send(strokes: TStroke[]): Promise<TExport> {
    this.#logger.info("send", strokes)
    let recognition: TExport = {}

    if (strokes.length === 0) {
      return Promise.resolve(recognition)
    }
    if (this.configuration.recognition.type) {
      const mimeTypes = this.getMimeTypes()
      if (!mimeTypes.length) {
        const error = new Error("send failed, no mimeTypes define in recognition configuration")
        this.#logger.error("send", error)
        return Promise.reject(error)
      }
      const data = this.buildData(strokes)
      const exports: TExport[] = await Promise.all(mimeTypes.map(mimeType => this.tryFetch(data, mimeType)))
      exports.forEach(e => {
        Object.assign(recognition, e)
      })
    }
    else {
      const data = this.buildData(strokes)
      recognition = await this.tryFetch(data, "application/vnd.myscript.jiix")
    }

    this.#logger.debug("send", recognition)
    return recognition
  }
}
