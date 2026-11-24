import { isVersionSuperiorOrEqual, type TPartialDeep } from "@/core"
import { LoggerCategory, LoggerManager } from "@/logger"
import type { Model } from "@/model"
import type { TPenStyle } from "@/style"
import { StyleHelper } from "@/style-css"
import type { Stroke } from "@/symbol"

import type { TExport, TJIIXExport } from "../jiix/JIIX"
import type {
  TDiagramConfiguration,
  TExportConfiguration,
  TMathConfiguration,
  TRawContentConfiguration,
  TTextConfiguration,
} from "../recognition"
import { ensureServerVersion } from "../shared/infos"
import type { TConverstionState } from "../shared/RecognitionConfiguration"
import { redactServerSecrets, serverUrl } from "../shared/ServerConfiguration"
import type { TWireStroke } from "../shared/StrokeSerializer"
import { toWireStroke } from "../shared/StrokeSerializer"
import type { THTTPClientV1Configuration } from "./HTTPClientV1Configuration"
import { HTTPClientV1Configuration } from "./HTTPClientV1Configuration"
import { postRecognition, toRecognitionContentType, toRecognitionError } from "./HTTPRecognition"

/**
 * @group Client
 * @deprecated Use {@link TStroke} from stroke/ for new code
 */
export type TStrokeGroup = {
  penStyle: TPenStyle
  strokes: Stroke[]
}

/**
 * @group Client
 * @deprecated Use {@link TStroke} with {@link HTTPClientV2}
 */
export type TStrokeGroupToSend = {
  penStyle?: string
  strokes: TWireStroke[]
}

/**
 * @group Client
 * @deprecated Use {@link HTTPClientV2} instead.
 */
export type THTTPClientV1PostConfiguration = {
  lang: string
  diagram?: TDiagramConfiguration
  math?: TMathConfiguration
  "raw-content"?: TRawContentConfiguration
  text?: TTextConfiguration
  export: TExportConfiguration
}

/**
 * @group Client
 */
export type THTTPClientV1PostData = {
  configuration: THTTPClientV1PostConfiguration
  xDPI: number
  yDPI: number
  contentType: string
  conversionState?: TConverstionState
  height: number
  width: number
  strokeGroups: TStrokeGroupToSend[]
}

/**
 * @deprecated Use {@link HTTPClientV2} instead.
 * @group Client
 */
export class HTTPClientV1 {
  protected logger = LoggerManager.getLogger(LoggerCategory.CLIENT)

  configuration: HTTPClientV1Configuration

  constructor(config: TPartialDeep<THTTPClientV1Configuration>) {
    this.logger.info("constructor", { config: redactServerSecrets(config) })
    this.configuration = new HTTPClientV1Configuration(config)
  }

  get url() {
    return serverUrl(this.configuration.server, "batch")
  }

  get postConfig(): THTTPClientV1PostConfiguration {
    switch (this.configuration.recognition.type) {
      case "DIAGRAM":
        return {
          lang: this.configuration.recognition.lang,
          diagram: this.configuration.recognition.diagram,
          export: this.configuration.recognition.export,
        }
      case "MATH":
        return {
          lang: this.configuration.recognition.lang,
          math: this.configuration.recognition.math,
          export: this.configuration.recognition.export,
        }
      case "Raw Content":
        return {
          lang: this.configuration.recognition.lang,
          "raw-content": this.configuration.recognition["raw-content"],
          export: this.configuration.recognition.export,
        }
      case "TEXT":
        return {
          lang: this.configuration.recognition.lang,
          text: this.configuration.recognition.text,
          export: this.configuration.recognition.export,
        }
      default:
        throw new Error(`get postConfig error Recognition type unkow "${this.configuration.recognition.type}"`)
        break
    }
  }

  protected buildData(model: Model): THTTPClientV1PostData {
    this.logger.info("buildData", { model })
    const isPenStyleEqual = (ps1: TPenStyle, ps2: TPenStyle) => {
      return (
        ps1 &&
        ps2 &&
        ps1["-myscript-pen-fill-color"] === ps2["-myscript-pen-fill-color"] &&
        ps1["-myscript-pen-fill-style"] === ps2["-myscript-pen-fill-style"] &&
        ps1["-myscript-pen-width"] === ps2["-myscript-pen-width"] &&
        ps1.color === ps2.color &&
        ps1.width === ps2.width
      )
    }

    const strokeGroupByPenStyle: TStrokeGroup[] = []
    model.symbols.forEach((s) => {
      const groupIndex = strokeGroupByPenStyle.findIndex((sg) => isPenStyleEqual(sg.penStyle, s.style))
      if (groupIndex > -1) {
        strokeGroupByPenStyle[groupIndex].strokes.push(s)
      } else {
        strokeGroupByPenStyle.push({
          penStyle: s.style,
          strokes: [s],
        })
      }
    })

    const strokeGroupsToSend: TStrokeGroupToSend[] = []
    strokeGroupByPenStyle.forEach((group: TStrokeGroup) => {
      const newPenStyle =
        JSON.stringify(group.penStyle) === "{}" ? undefined : StyleHelper.penStyleToCSS(group.penStyle as TPenStyle)
      const newGroup = {
        penStyle: newPenStyle,
        strokes: group.strokes.map((s) => toWireStroke(s)),
      }
      strokeGroupsToSend.push(newGroup)
    })

    const contentType = toRecognitionContentType(this.configuration.recognition.type)

    const data = {
      configuration: this.postConfig,
      xDPI: 96,
      yDPI: 96,
      contentType,
      height: model.height,
      width: model.width,
      strokeGroups: strokeGroupsToSend,
    }
    this.logger.debug("buildData", { data })
    return data
  }

  protected async post(data: unknown, mimeType: string): Promise<unknown> {
    this.logger.info("post", { data, mimeType })
    // Before posting: `data` holds this configuration, and the HMAC signs the body as sent
    const version = await ensureServerVersion(this.configuration)
    if (!isVersionSuperiorOrEqual(version, "2.3.0")) {
      delete this.configuration.recognition.convert
    }
    if (!isVersionSuperiorOrEqual(version, "3.2.0")) {
      delete this.configuration.recognition.export.jiix.text.lines
    }
    return postRecognition({
      url: this.url,
      server: this.configuration.server,
      accept: `application/json,${mimeType}`,
      data,
    })
  }

  protected async tryFetch(data: THTTPClientV1PostData, mimeType: string): Promise<TExport> {
    this.logger.debug("tryFetch", { data, mimeType })
    try {
      const result = await this.post(data, mimeType)
      return { [mimeType]: result as TJIIXExport | string | Blob }
    } catch (error) {
      this.logger.error("tryFetch", { data, mimeType, error })
      throw toRecognitionError(error)
    }
  }

  protected getMimeTypes(requestedMimeTypes?: string[]): string[] {
    this.logger.info("getMimeTypes", {
      requestedMimeTypes,
    })
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
          throw new Error(
            `Recognition type "${this.configuration.recognition.type}" is unknown.\n Possible types are:\n -DIAGRAM\n -MATH\n -Raw Content\n -TEXT`
          )
          break
      }
    }
    return mimeTypes
  }

  async convert(model: Model, conversionState?: TConverstionState, requestedMimeTypes?: string[]): Promise<Model> {
    this.logger.info("convert", {
      model,
      conversionState,
      requestedMimeTypes,
    })
    const myModel = model.clone()
    const mimeTypes = this.getMimeTypes(requestedMimeTypes)
    const dataToConcert = this.buildData(myModel)
    dataToConcert.conversionState = conversionState
    const promises = mimeTypes.map((mt) => this.tryFetch(dataToConcert, mt))
    const exports: TExport[] = await Promise.all(promises)
    exports.forEach((e) => {
      myModel.mergeConvert(e)
    })
    this.logger.debug("convert", {
      model: myModel,
    })
    return myModel
  }

  async export(model: Model, requestedMimeTypes?: string[]): Promise<Model> {
    this.logger.info("export", {
      model,
      requestedMimeTypes,
    })
    const myModel = model.clone()
    if (myModel.symbols.length === 0) {
      return Promise.resolve(myModel)
    }
    const mimeTypes = this.getMimeTypes(requestedMimeTypes)
    if (!mimeTypes.length) {
      this.logger.error("export", {
        model,
        requestedMimeTypes,
        "Export failed, no mimeTypes define in recognition configuration": String,
      })
      return Promise.reject(new Error("Export failed, no mimeTypes define in recognition configuration"))
    }
    const mimeTypesRequiringExport: string[] = mimeTypes.filter((m) => !myModel.exports || !myModel.exports[m])
    const data = this.buildData(model)
    const exports: TExport[] = await Promise.all(
      mimeTypesRequiringExport.map((mimeType) => this.tryFetch(data, mimeType))
    )
    exports.forEach((e) => {
      myModel.mergeExport(e)
    })
    this.logger.debug("export", {
      model: myModel,
    })
    return myModel
  }

  async resize(model: Model): Promise<Model> {
    this.logger.info("resize", { model })
    return this.export(model)
  }
}
