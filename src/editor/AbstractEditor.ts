import { getApiInfos, PartialDeep, TApiInfos } from "../utils"
import {
  LoggerCategory,
  LoggerManager,
  DefaultLoggerConfiguration,
  TLoggerConfiguration
} from "../logger"
import { TServerHTTPConfiguration } from "../recognizer"
import { EditorEvent } from "./EditorEvent"
import { EditorLayer } from "./EditorLayer"

/**
 * @hidden
 * @group Editor
 */
export type TEditorConfiguration = {
  logger: TLoggerConfiguration
}

/**
 * @group Editor
 */
export type EditorType = "WEBSOCKET" | "REST" | "OFFSCREEN" | "REST-RECOGNIZER"

/**
 * @hidden
 * @group Editor
 */
export type EditorOptionsBase = {
  configuration: TEditorConfiguration
  override?: {
    cssClass?: string
  }
}

/**
 * @hidden
 * @group Editor
 */
export abstract class AbstractEditor
{
  logger = LoggerManager.getLogger(LoggerCategory.EDITOR)
  layers: EditorLayer
  event: EditorEvent
  info?: TApiInfos

  #loggerConfiguration!: TLoggerConfiguration

  constructor(rootElement: HTMLElement, options?: PartialDeep<EditorOptionsBase>)
  {
    this.loggerConfiguration = Object.assign({}, DefaultLoggerConfiguration, options?.configuration?.logger)
    this.logger.info("constructor", { rootElement, options })

    this.event = new EditorEvent(rootElement)
    this.layers = new EditorLayer(rootElement, options?.override?.cssClass || "ms-editor")

    //@ts-ignore
    rootElement.editor = this
  }

  get loggerConfiguration(): TLoggerConfiguration
  {
    return this.#loggerConfiguration
  }

  set loggerConfiguration(loggerConfig: TLoggerConfiguration)
  {
    this.#loggerConfiguration = Object.assign({}, DefaultLoggerConfiguration, loggerConfig)
    LoggerManager.setLoggerLevel(this.#loggerConfiguration)
  }

  abstract initialize(): Promise<void>

  abstract clear(): Promise<void>

  abstract destroy(): Promise<void>

  async loadInfo(server: TServerHTTPConfiguration): Promise<TApiInfos>
  {
    if (!this.info) {
      this.info = await getApiInfos({ server })
    }
    return this.info
  }
}
