import { LoggerCategory, LoggerManager } from "@/logger"
import type { TExportV2, TJIIXExport } from "@/model"
import { StrokeOps, type TStrokeMinimal } from "@/symbol"
import type { TPartialDeep } from "@/utils"
import { computeHmac, getApiInfos, isVersionSuperiorOrEqual } from "@/utils"

import { ClientError } from "./ClientError"
import type { THTTPClientV2Configuration } from "./HTTPClientV2Configuration"
import { HTTPClientV2Configuration } from "./HTTPClientV2Configuration"
import type {
  TDiagramConfiguration,
  TExportConfiguration,
  TMathConfiguration,
  TRawContentConfiguration,
  TTextConfiguration,
} from "./recognition"

type TApiError = {
  code?: string
  message: string
}

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
  strokes: {
    id: string
    pointerType: string
    x: number[]
    y: number[]
    t: number[]
    p: number[]
  }[]
}

/**
 * @group Client
 */
export class HTTPClientV2 {
  #logger = LoggerManager.getLogger(LoggerCategory.CLIENT)

  configuration: HTTPClientV2Configuration

  constructor(config: TPartialDeep<THTTPClientV2Configuration>) {
    this.#logger.info("constructor", { config })
    this.configuration = new HTTPClientV2Configuration(config)
  }

  get url() {
    return `${this.configuration.server.scheme}://${this.configuration.server.host}/api/v4.0/iink/recognize`
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

  protected buildData(strokes: TStrokeMinimal[]): THTTPClientV2PostData {
    this.#logger.info("buildData", { strokes })

    const contentType: string =
      this.configuration.recognition.type === "Raw Content"
        ? "Raw Content"
        : this.configuration.recognition.type.charAt(0).toUpperCase() +
          this.configuration.recognition.type.slice(1).toLowerCase()

    const data = {
      configuration: this.postConfig,
      scaleX: 0.265,
      scaleY: 0.265,
      contentType,
      strokes: strokes.map((s) => StrokeOps.formatToSend(s)),
    }
    this.#logger.debug("buildData", { data })
    return data
  }

  protected async post(data: unknown, mimeType: string): Promise<unknown> {
    this.#logger.info("post", { data, mimeType })
    const headers = new Headers()
    headers.append("Accept", mimeType)
    headers.append("applicationKey", this.configuration.server.applicationKey)
    let hmacKey: string | undefined
    try {
      // If an HMAC key is provided, compute the HMAC of the request body and add it to the headers
      if (this.configuration.server.hmacKey) {
        if (typeof this.configuration.server.hmacKey == "string") {
          hmacKey = this.configuration.server.hmacKey
        } else if (typeof this.configuration.server.hmacKey == "function") {
          hmacKey = await this.configuration.server.hmacKey(this.configuration.server.applicationKey)
        } else {
          throw new Error("HMAC key is not a string nor a function")
        }
        if (hmacKey) {
          const hmac = await computeHmac(JSON.stringify(data), this.configuration.server.applicationKey, hmacKey)
          headers.append("hmac", hmac)
        }
      }
    } catch (error: Error | unknown) {
      // If there is an error during HMAC computation, log the error and proceed without the HMAC header
      if (error instanceof Error) {
        this.#logger.error("post.computeHmac", error.message)
      } else {
        this.#logger.error("post.computeHmac", String(error))
      }
    }
    headers.append("Content-Type", "application/json")

    if (!this.configuration.server.version) {
      this.configuration.server.version = (await getApiInfos(this.configuration)).version
    }

    if (this.configuration.server.version && isVersionSuperiorOrEqual(this.configuration.server.version, "2.0.4")) {
      headers.append("myscript-client-name", "iink-ts")
      headers.append("myscript-client-version", "4.0.0")
    }

    const reqInit: RequestInit = {
      method: "POST",
      headers,
      body: JSON.stringify(data),
      credentials: "omit",
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
          result = await response
            .clone()
            .json()
            .catch(async () => await response.text())
          break
        default:
          result = await response.text()
          break
      }
      this.#logger.debug("post", { result })
      return result
    } else {
      if (response.headers.get("content-type")?.includes("application/json")) {
        const err = (await response.json()) as TApiError
        this.#logger.error("post", { err })
        throw err
      } else {
        const err: TApiError = {
          code: response.status.toString(),
          message: await response.text(),
        }
        this.#logger.error("post", { err })
        throw err
      }
    }
  }

  protected async tryFetch(data: THTTPClientV2PostData, mimeType: string): Promise<TExportV2 | never> {
    this.#logger.debug("tryFetch", {
      data,
      mimeType,
    })
    return this.post(data, mimeType)
      .then((res) => {
        const exports: TExportV2 = {}
        exports[mimeType] = res as TJIIXExport | string | Blob
        this.#logger.debug("tryFetch", {
          exports,
        })
        return exports
      })
      .catch((err) => {
        this.#logger.error("tryFetch", {
          data,
          mimeType,
          err,
        })
        let message = err.message || ClientError.UNKNOWN
        if (!err.code) {
          message = ClientError.CANT_ESTABLISH
        } else if (err.code === "access.not.granted") {
          message = ClientError.WRONG_CREDENTIALS
        }
        const error = new Error(message)
        throw error
      })
  }

  protected getMimeTypes(requestedMimeTypes?: string[]): string[] {
    this.#logger.info("getMimeTypes", {
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

  async send(strokes: TStrokeMinimal[], requestedMimeTypes?: string[]): Promise<TExportV2> {
    this.#logger.info("send", strokes)

    const recognition: TExportV2 = {}
    if (strokes.length === 0) {
      return Promise.resolve(recognition)
    }
    const mimeTypes = requestedMimeTypes || this.getMimeTypes()

    const data = this.buildData(strokes)
    const exports: TExportV2[] = await Promise.all(mimeTypes.map((mimeType) => this.tryFetch(data, mimeType)))
    exports.forEach((e) => {
      Object.assign(recognition, e)
    })

    this.#logger.debug("send", recognition)
    return recognition
  }
}
