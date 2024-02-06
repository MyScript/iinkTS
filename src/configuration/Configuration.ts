
import { LoggerClass } from "../Constants"
import { LoggerManager } from "../logger"
import { PartialDeep, mergeDeep } from "../utils"
import { DefaultGrabberConfiguration, TGrabberConfiguration } from "./GrabberConfiguration"
import { DefaultMenuConfiguration, TMenuConfiguration } from "./MenuConfiguration"
import { DefaultRecognitionConfiguration, TRecognitionConfiguration } from "./RecognitionConfiguration"
import { DefaultRenderingConfiguration, TRenderingConfiguration } from "./RenderingConfiguration"
import { DefaultServerConfiguration, TServerConfiguration } from "./ServerConfiguration"
import { DefaultTriggerConfiguration, TTriggerConfiguration } from "./TriggerConfiguration"
import { DefaultUndoRedoConfiguration, TUndoRedoConfiguration } from "./UndoRedoConfiguration"

/**
 * @group Configuration
 */
export type TConfiguration = {
  offscreen: boolean
  server: TServerConfiguration
  recognition: TRecognitionConfiguration
  grabber: TGrabberConfiguration
  rendering: TRenderingConfiguration
  triggers: TTriggerConfiguration
  "undo-redo": TUndoRedoConfiguration,
  menu: TMenuConfiguration
}

/**
 * @group Configuration
 */
export const DefaultConfiguration: TConfiguration = {
  offscreen: false,
  server: DefaultServerConfiguration,
  recognition: DefaultRecognitionConfiguration,
  grabber: DefaultGrabberConfiguration,
  rendering: DefaultRenderingConfiguration,
  triggers: DefaultTriggerConfiguration,
  "undo-redo": DefaultUndoRedoConfiguration,
  menu: DefaultMenuConfiguration
}

/**
 * @group Configuration
 */
export class Configuration implements TConfiguration
{
  #logger = LoggerManager.getLogger(LoggerClass.CONFIGURATION)

  offscreen: boolean
  grabber: TGrabberConfiguration
  recognition: TRecognitionConfiguration
  rendering: TRenderingConfiguration
  server: TServerConfiguration
  triggers: TTriggerConfiguration
  "undo-redo": TUndoRedoConfiguration
  menu: TMenuConfiguration

  constructor(configuration?: PartialDeep<TConfiguration>)
  {
    this.#logger.info("constructor", { configuration })
    this.offscreen = DefaultConfiguration.offscreen
    this.grabber = structuredClone(DefaultConfiguration.grabber)
    this.recognition = structuredClone(DefaultConfiguration.recognition)
    this.rendering = structuredClone(DefaultConfiguration.rendering)
    this.server = structuredClone(DefaultConfiguration.server)
    this["undo-redo"] = structuredClone(DefaultConfiguration["undo-redo"])
    this.triggers = structuredClone(DefaultConfiguration.triggers)
    this.menu = structuredClone(DefaultConfiguration.menu)

    this.overrideDefaultConfiguration(configuration)
  }

  overrideDefaultConfiguration(configuration?: PartialDeep<TConfiguration>): void
  {
    this.#logger.info("overrideDefaultConfiguration", { configuration })
    const defaultConf = structuredClone(DefaultConfiguration) as TConfiguration
    this.offscreen = Boolean(configuration?.offscreen)
    this.grabber = mergeDeep({}, defaultConf.grabber, configuration?.grabber)
    this.recognition = mergeDeep({}, defaultConf.recognition, configuration?.recognition)
    this.rendering = mergeDeep({}, defaultConf.rendering, configuration?.rendering)
    this.server = mergeDeep({}, defaultConf.server, configuration?.server)
    this.triggers = mergeDeep({}, defaultConf.triggers, configuration?.triggers)
    this["undo-redo"] = mergeDeep({}, defaultConf["undo-redo"], configuration?.["undo-redo"])
    this.menu = mergeDeep({}, defaultConf.menu, configuration?.menu)

    this.recognition.text.mimeTypes = (configuration?.recognition?.text?.mimeTypes || defaultConf.recognition.text.mimeTypes) as ("text/plain" | "application/vnd.myscript.jiix")[]
    this.recognition.math.mimeTypes = (configuration?.recognition?.math?.mimeTypes || defaultConf.recognition.math.mimeTypes) as ("application/vnd.myscript.jiix" | "application/x-latex" | "application/mathml+xml")[]
    this.recognition.diagram.mimeTypes = (configuration?.recognition?.diagram?.mimeTypes || defaultConf.recognition.diagram.mimeTypes) as ("application/vnd.myscript.jiix" | "application/vnd.openxmlformats-officedocument.presentationml.presentation" | "image/svg+xml")[]
    this.recognition["raw-content"].gestures = (configuration?.recognition?.["raw-content"]?.gestures || defaultConf.recognition["raw-content"].gestures) as ("underline" | "scratch-out" | "join" | "insert" | "strike-through" | "surround")[] | undefined

    if (this.server?.useWindowLocation) {
      this.server.scheme = window.location.protocol.indexOf("s") > -1 ? "https" : "http"
      this.server.host = window.location.host
    }

    if (this.offscreen) {
      this.recognition.type = "Raw Content"
      this.rendering.smartGuide.enable = false
      this.server.protocol = "WEBSOCKET"
    }
    else {
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
      // raw-content.gestures Unrecognized when not offscreen
      delete this.recognition["raw-content"].gestures
      this.menu.style.enable = false
    }
    this.#logger.debug("overrideDefaultConfiguration", { configuration: this })
  }
}
