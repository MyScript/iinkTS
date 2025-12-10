import { LoggerCategory, LoggerManager } from "../logger"
import { Model, TExport, TJIIXExport } from "../model"
import { TStrokeGroup, TStrokeGroupToSend } from "../symbol"
import { StyleHelper, TPenStyle } from "../style"
import { computeHmac, getApiInfos, isVersionSuperiorOrEqual, PartialDeep } from "../utils"
import { RecognizerError } from "./RecognizerError"
import { RecognizerHTTPV1Configuration, TRecognizerHTTPV1Configuration } from "./RecognizerHTTPV1Configuration"
import { TConverstionState } from "./RecognitionConfiguration"
import { TDiagramConfiguration, TExportConfiguration, TMathConfiguration, TRawContentConfiguration, TTextConfiguration } from "./recognition"

type ApiError = {
  code?: string
  message: string
}

/**
 * @group Recognizer
 */
export type TRecognizerHTTPV1PostConfiguration = {
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
export type TRecognizerHTTPV1PostData = {
  configuration: TRecognizerHTTPV1PostConfiguration,
  xDPI: number,
  yDPI: number,
  contentType: string,
  conversionState?: TConverstionState
  height: number,
  width: number,
  strokeGroups: TStrokeGroupToSend[]
}

/**
 * @deprecated Use {@link RecognizerHTTPV2} instead.
 * @group Recognizer
 */
export class RecognizerHTTPV1
{
  #logger = LoggerManager.getLogger(LoggerCategory.RECOGNIZER)

  configuration: RecognizerHTTPV1Configuration

  constructor(config: PartialDeep<TRecognizerHTTPV1Configuration>)
  {
    this.#logger.info("constructor", { config })
    this.configuration = new RecognizerHTTPV1Configuration(config)
  }

  get url()
  {
    return `${ this.configuration.server.scheme }://${ this.configuration.server.host }/api/v4.0/iink/batch`
  }

  get postConfig(): TRecognizerHTTPV1PostConfiguration
  {
    switch (this.configuration.recognition.type) {
      case "DIAGRAM":
        return {
          lang: this.configuration.recognition.lang,
          diagram: this.configuration.recognition.diagram,
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
        throw new Error(`get postConfig error Recognition type unkow "${ this.configuration.recognition.type }"`)
        break
    }
  }

  protected buildData(model: Model): TRecognizerHTTPV1PostData
  {
    this.#logger.info("buildData", { model })
    const isPenStyleEqual = (ps1: TPenStyle, ps2: TPenStyle) =>
    {
      return ps1 && ps2 && ps1["-myscript-pen-fill-color"] === ps2["-myscript-pen-fill-color"] &&
        ps1["-myscript-pen-fill-style"] === ps2["-myscript-pen-fill-style"] &&
        ps1["-myscript-pen-width"] === ps2["-myscript-pen-width"] &&
        ps1.color === ps2.color &&
        ps1.width === ps2.width
    }

    const strokeGroupByPenStyle: TStrokeGroup[] = []
    model.symbols.forEach((s) =>
    {
      const groupIndex = strokeGroupByPenStyle.findIndex(sg => isPenStyleEqual(sg.penStyle, s.style))
      if (groupIndex > -1) {
        strokeGroupByPenStyle[groupIndex].strokes.push(s)
      } else {
        strokeGroupByPenStyle.push({
          penStyle: s.style,
          strokes: [s]
        })
      }
    })

    const strokeGroupsToSend: TStrokeGroupToSend[] = []
    strokeGroupByPenStyle.forEach((group: TStrokeGroup) =>
    {
      const newPenStyle = JSON.stringify(group.penStyle) === "{}" ? undefined : StyleHelper.penStyleToCSS(group.penStyle as TPenStyle)
      const newGroup = {
        penStyle: newPenStyle,
        strokes: group.strokes.map(s => s.formatToSend())
      }
      strokeGroupsToSend.push(newGroup)
    })

    const contentType: string = this.configuration.recognition.type === "Raw Content" ?
      "Raw Content" :
      this.configuration.recognition.type.charAt(0).toUpperCase() + this.configuration.recognition.type.slice(1).toLowerCase()

    const data = {
      configuration: this.postConfig,
      xDPI: 96,
      yDPI: 96,
      contentType,
      height: model.height,
      width: model.width,
      strokeGroups: strokeGroupsToSend
    }
    this.#logger.debug("buildData", { data })
    return data
  }

  protected async post(data: unknown, mimeType: string): Promise<unknown>
  {
    this.#logger.info("post", { data, mimeType })
    const headers = new Headers()
    headers.append("Accept", "application/json," + mimeType)
    headers.append("applicationKey", this.configuration.server.applicationKey)
    try {
      let hmacKey: string
      if (typeof this.configuration.server.hmacKey == "string") {
        if (this.configuration.server.hmacKey.length === 0) {
          throw new Error("HMAC key is empty")
        }
        hmacKey = this.configuration.server.hmacKey
      } else if (typeof this.configuration.server.hmacKey == "function") {
        hmacKey = await this.configuration.server.hmacKey(this.configuration.server.applicationKey)
      }
      else {
        throw new Error("HMAC key is not a string nor a function")
      }
      const hmac = await computeHmac(JSON.stringify(data), this.configuration.server.applicationKey, hmacKey)
      headers.append("hmac", hmac)
    } catch (error) {
      this.#logger.error("post.computeHmac", error)
    }
    headers.append("Content-Type", "application/json")

    if (!this.configuration.server.version) {
      this.configuration.server.version = (await getApiInfos(this.configuration)).version
    }
    if (isVersionSuperiorOrEqual(this.configuration.server.version!, "2.0.4")) {
      headers.append("myscript-client-name", "iink-ts")
      headers.append("myscript-client-version", "3.1.1")
    }
    if (!isVersionSuperiorOrEqual(this.configuration.server.version!, "2.3.0")) {
      delete this.configuration.recognition.convert
    }
    if (!isVersionSuperiorOrEqual(this.configuration.server.version!, "3.2.0")) {
      delete this.configuration.recognition.export.jiix.text.lines
    }

    const reqInit: RequestInit = {
      method: "POST",
      headers,
      body: JSON.stringify(data),
      credentials: "omit"
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

  protected async tryFetch(data: TRecognizerHTTPV1PostData, mimeType: string): Promise<TExport | never>
  {
    this.#logger.debug("tryFetch", { data, mimeType })
    return this.post(data, mimeType)
      .then((res) =>
      {
        const exports: TExport = {}
        exports[mimeType] = res as TJIIXExport | string | Blob
        this.#logger.debug("tryFetch", { exports })
        return exports
      })
      .catch((err) =>
      {
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

  protected getMimeTypes(requestedMimeTypes?: string[]): string[]
  {
    this.#logger.info("getMimeTypes", { requestedMimeTypes })
    let mimeTypes: string[] = requestedMimeTypes || []
    if (!mimeTypes.length) {
      switch (this.configuration.recognition.type) {
        case "DIAGRAM":
          mimeTypes = this.configuration.recognition.diagram.mimeTypes
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
          throw new Error(`Recognition type "${ this.configuration.recognition.type }" is unknown.\n Possible types are:\n -DIAGRAM\n -MATH\n -Raw Content\n -TEXT`)
          break
      }
    }
    return mimeTypes
  }

  async convert(model: Model, conversionState?: TConverstionState, requestedMimeTypes?: string[]): Promise<Model>
  {
    this.#logger.info("convert", { model, conversionState, requestedMimeTypes })
    const myModel = model.clone()
    const mimeTypes = this.getMimeTypes(requestedMimeTypes)
    const dataToConcert = this.buildData(myModel)
    dataToConcert.conversionState = conversionState
    const promises = mimeTypes.map(mt => this.tryFetch(dataToConcert, mt))
    const exports: TExport[] = await Promise.all(promises)
    exports.forEach(e =>
    {
      myModel.mergeConvert(e)
    })
    this.#logger.debug("convert", { model: myModel })
    return myModel
  }

  async export(model: Model, requestedMimeTypes?: string[]): Promise<Model>
  {
    this.#logger.info("export", { model, requestedMimeTypes })
    const myModel = model.clone()
    if (myModel.symbols.length === 0) {
      return Promise.resolve(myModel)
    }
    const mimeTypes = this.getMimeTypes(requestedMimeTypes)
    if (!mimeTypes.length) {
      this.#logger.error("export", { model, requestedMimeTypes, "Export failed, no mimeTypes define in recognition configuration": String })
      return Promise.reject(new Error("Export failed, no mimeTypes define in recognition configuration"))
    }
    const mimeTypesRequiringExport: string[] = mimeTypes.filter(m => !myModel.exports || !myModel.exports[m])
    const data = this.buildData(model)
    const exports: TExport[] = await Promise.all(mimeTypesRequiringExport.map(mimeType => this.tryFetch(data, mimeType)))
    exports.forEach(e =>
    {
      myModel.mergeExport(e)
    })
    this.#logger.debug("export", { model: myModel })
    return myModel
  }

  async resize(model: Model): Promise<Model>
  {
    this.#logger.info("resize", { model })
    return this.export(model)
  }

}
