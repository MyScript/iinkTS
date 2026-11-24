import { isVersionSuperiorOrEqual, type TPartialDeep } from "@/core"
import { LoggerCategory, LoggerManager } from "@/logger"

import type { TJIIXExport } from "../jiix/JIIX"
import type { TExportV2 } from "../jiix/JIIXV2"
import type {
  TDiagramConfiguration,
  TExportConfiguration,
  TMathConfiguration,
  TRawContentConfiguration,
  TTextConfiguration,
} from "../recognition"
import { ensureServerVersion } from "../shared/infos"
import { redactServerSecrets, serverUrl } from "../shared/ServerConfiguration"
import type { TRecognitionStroke, TWireStroke } from "../shared/StrokeSerializer"
import { supportsRelativeTimestamps, toWireStroke } from "../shared/StrokeSerializer"
import type { THTTPClientV2Configuration } from "./HTTPClientV2Configuration"
import { HTTPClientV2Configuration } from "./HTTPClientV2Configuration"
import { postRecognition, toRecognitionContentType, toRecognitionError } from "./HTTPRecognition"

/**
 * @group Client
 */
export type THTTPClientV2PostConfiguration = {
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
export type THTTPClientV2PostData = {
  scaleX: number
  scaleY: number
  configuration: THTTPClientV2PostConfiguration
  contentType: string
  strokes: TWireStroke[]
}

/**
 * @group Client
 */
export class HTTPClientV2 {
  protected logger = LoggerManager.getLogger(LoggerCategory.CLIENT)

  configuration: HTTPClientV2Configuration

  constructor(config: TPartialDeep<THTTPClientV2Configuration>) {
    this.logger.info("constructor", { config: redactServerSecrets(config) })
    this.configuration = new HTTPClientV2Configuration(config)
  }

  get url() {
    return serverUrl(this.configuration.server, "recognize")
  }

  get postConfig(): THTTPClientV2PostConfiguration {
    switch (this.configuration.recognition.type) {
      case "SHAPE":
        return {
          lang: this.configuration.recognition.lang,
          diagram: this.configuration.recognition.shape,
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

  protected buildData(strokes: TRecognitionStroke[]): THTTPClientV2PostData {
    this.logger.info("buildData", { strokes })

    const contentType = toRecognitionContentType(this.configuration.recognition.type)

    const data = {
      configuration: this.postConfig,
      scaleX: 0.265,
      scaleY: 0.265,
      contentType,
      strokes: strokes.map((s) =>
        toWireStroke(s, { relativeTimestamps: supportsRelativeTimestamps(this.configuration.server.version) })
      ),
    }
    this.logger.debug("buildData", { data })
    return data
  }

  protected async post(data: unknown, mimeType: string): Promise<unknown> {
    this.logger.info("post", { data, mimeType })
    // Before posting: `data` holds this configuration, and the HMAC signs the body as sent
    const version = await ensureServerVersion(this.configuration)
    if (!isVersionSuperiorOrEqual(version, "3.2.0")) {
      delete this.configuration.recognition.export.jiix.text.lines
    }
    return postRecognition({ url: this.url, server: this.configuration.server, accept: mimeType, data })
  }

  protected async tryFetch(data: THTTPClientV2PostData, mimeType: string): Promise<TExportV2> {
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
          throw new Error(
            `Recognition type "${this.configuration.recognition.type}" is unknown.\n Possible types are:\n -DIAGRAM\n -MATH\n -Raw Content\n -TEXT\n -SHAPE`
          )
          break
      }
    }
    return mimeTypes
  }

  async send(strokes: TRecognitionStroke[], requestedMimeTypes?: string[]): Promise<TExportV2> {
    this.logger.info("send", strokes)

    const recognition: TExportV2 = {}
    if (strokes.length === 0) {
      return Promise.resolve(recognition)
    }
    const mimeTypes = requestedMimeTypes || this.getMimeTypes()

    // Before building: the version decides how the strokes' timestamps are written
    await ensureServerVersion(this.configuration)
    const data = this.buildData(strokes)
    const exports: TExportV2[] = await Promise.all(mimeTypes.map((mimeType) => this.tryFetch(data, mimeType)))
    exports.forEach((e) => {
      Object.assign(recognition, e)
    })

    this.logger.debug("send", recognition)
    return recognition
  }
}
