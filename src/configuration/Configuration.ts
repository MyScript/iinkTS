
import { LoggerClass } from "../Constants"
import { LoggerManager } from "../logger"
import { PartialDeep, mergeDeep } from "../utils"
import { DefaultGrabberConfiguration, TGrabberConfiguration } from "./GrabberConfiguration"
import { DefaultRecognitionConfiguration, TRecognitionConfiguration } from "./RecognitionConfiguration"
import { DefaultRenderingConfiguration, TRenderingConfiguration } from "./RenderingConfiguration"
import { DefaultServerConfiguration, TServerConfiguration } from "./ServerConfiguration"
import { DefaultTriggerConfiguration, TTriggerConfiguration } from "./TriggerConfiguration"
import { DefaultUndoRedoConfiguration, TUndoRedoConfiguration } from "./UndoRedoConfiguration"

/**
 * @group Configuration
 */
export type TConfiguration = {
  server: TServerConfiguration
  recognition: TRecognitionConfiguration
  grabber: TGrabberConfiguration
  rendering: TRenderingConfiguration
  triggers: TTriggerConfiguration
  "undo-redo": TUndoRedoConfiguration
}

/**
 * @group Configuration
 */
export const DefaultConfiguration: TConfiguration = {
  server: DefaultServerConfiguration,
  recognition: DefaultRecognitionConfiguration,
  grabber: DefaultGrabberConfiguration,
  rendering: DefaultRenderingConfiguration,
  triggers: DefaultTriggerConfiguration,
  "undo-redo": DefaultUndoRedoConfiguration
}

/**
 * @group Configuration
 */
export class Configuration implements TConfiguration
{
  #logger = LoggerManager.getLogger(LoggerClass.CONFIGURATION)

  grabber: TGrabberConfiguration
  recognition: TRecognitionConfiguration
  rendering: TRenderingConfiguration
  server: TServerConfiguration
  triggers: TTriggerConfiguration
  "undo-redo": TUndoRedoConfiguration

  constructor(configuration?: PartialDeep<TConfiguration>)
  {
    this.#logger.info("constructor", { configuration })
    this.grabber = JSON.parse(JSON.stringify(DefaultConfiguration.grabber))
    this.recognition = JSON.parse(JSON.stringify(DefaultConfiguration.recognition))
    this.rendering = JSON.parse(JSON.stringify(DefaultConfiguration.rendering))
    this.server = JSON.parse(JSON.stringify(DefaultConfiguration.server))
    this.triggers = JSON.parse(JSON.stringify(DefaultConfiguration.triggers))

    this.overrideDefaultConfiguration(configuration)
  }

  overrideDefaultConfiguration(configuration?: PartialDeep<TConfiguration>): void
  {
    this.#logger.info("overrideDefaultConfiguration", { configuration })
    const defaultConf = JSON.parse(JSON.stringify(DefaultConfiguration))
    this.grabber = mergeDeep({}, defaultConf.grabber, configuration?.grabber)
    this.recognition = mergeDeep({}, defaultConf.recognition, configuration?.recognition)
    this.rendering = mergeDeep({}, defaultConf.rendering, configuration?.rendering)
    this.server = mergeDeep({}, defaultConf.server, configuration?.server)
    this.triggers = mergeDeep({}, defaultConf.triggers, configuration?.triggers)
    this["undo-redo"] = mergeDeep({}, defaultConf["undo-redo"], configuration?.["undo-redo"])

    this.recognition.text.mimeTypes = configuration?.recognition?.text?.mimeTypes || defaultConf.recognition.text.mimeTypes
    this.recognition.math.mimeTypes = configuration?.recognition?.math?.mimeTypes || defaultConf.recognition.math.mimeTypes
    this.recognition.diagram.mimeTypes = configuration?.recognition?.diagram?.mimeTypes || defaultConf.recognition.diagram.mimeTypes

    if (this.server?.useWindowLocation) {
      this.server.scheme = window.location.protocol.indexOf("s") > -1 ? "https" : "http"
      this.server.host = window.location.host
    }

    if (
      this.server.protocol === "REST" &&
      this.triggers.exportContent === "POINTER_UP"
    ) {
      this.triggers.exportContent = "QUIET_PERIOD"
      this.triggers.exportContentDelay = Math.max(this.triggers.exportContentDelay, 50)
    }

    if (
      this.server.protocol === "WEBSOCKET" &&
      this.recognition.type === "TEXT"
    ) {
      if (
        this.rendering.smartGuide.enable &&
        !this.recognition.text.mimeTypes.includes("application/vnd.myscript.jiix")
      ) {
        // mimeType required for smartGuide
        this.recognition.text.mimeTypes.push("application/vnd.myscript.jiix")
      }
    } else {
      // smartGuide enable only on websocket text
      this.rendering.smartGuide.enable = false
    }
    this.#logger.debug("overrideDefaultConfiguration", { configuration: this })
  }
}
