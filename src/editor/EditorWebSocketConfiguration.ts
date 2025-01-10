import { DefaultGrabberConfiguration, TGrabberConfiguration } from "../grabber"
import { DefaultHistoryConfiguration, THistoryConfiguration } from "../history"
import { DefaultLoggerConfiguration, TLoggerConfiguration } from "../logger"
import { DefaultWSRecognizerConfiguration, TWSRecognitionConfiguration, TWSRecognizerConfiguration, WSRecognizerConfiguration, TServerWebsocketConfiguration } from "../recognizer"
import { DefaultRendererConfiguration, TRendererConfiguration } from "../renderer"
import { DefaultTheme, TPenStyle, TTheme } from "../style"
import { mergeDeep, PartialDeep } from "../utils"
import { TEditorConfiguration } from "./AbstractEditor"
import { DefaultEditorTriggerConfiguration, TEditorTriggerConfiguration } from "./EditorTriggerConfiguration"

/**
 * @group Editor
 */
export type TEditorWebSocketConfiguration = TEditorConfiguration & TWSRecognizerConfiguration & {
  rendering: TRendererConfiguration
  smartGuide: {
    enable: boolean
  },
  "undo-redo": THistoryConfiguration
  grabber: TGrabberConfiguration
  triggers: TEditorTriggerConfiguration
  logger: TLoggerConfiguration
  penStyle: TPenStyle,
  penStyleClasses?: string
  theme: TTheme
}

/**
 * @group Editor
 * @source
 */
export const DefaultEditorWebSocketConfiguration: TEditorWebSocketConfiguration = {
  server: DefaultWSRecognizerConfiguration.server,
  recognition: DefaultWSRecognizerConfiguration.recognition,
  rendering: DefaultRendererConfiguration,
  smartGuide: {
    enable: true
  },
  grabber: DefaultGrabberConfiguration,
  triggers: DefaultEditorTriggerConfiguration,
  "undo-redo": DefaultHistoryConfiguration,
  logger: DefaultLoggerConfiguration,
  penStyle: {},
  theme: DefaultTheme
}

/**
 * @group Editor
 */
export class EditorWebSocketConfiguration implements TEditorWebSocketConfiguration
{
  server: TServerWebsocketConfiguration
  recognition: TWSRecognitionConfiguration
  rendering: TRendererConfiguration
  smartGuide: {
    enable: boolean
  }
  "undo-redo": THistoryConfiguration
  grabber: TGrabberConfiguration
  triggers: TEditorTriggerConfiguration
  logger: TLoggerConfiguration
  penStyle: TPenStyle
  penStyleClasses?: string
  theme: TTheme

  constructor(configuration?: PartialDeep<TEditorWebSocketConfiguration>)
  {
    const { server, recognition } = new WSRecognizerConfiguration(configuration)
    this.server = server
    this.recognition = recognition

    this.rendering = mergeDeep({}, DefaultEditorWebSocketConfiguration.rendering, configuration?.rendering)
    this.smartGuide = mergeDeep({}, DefaultEditorWebSocketConfiguration.smartGuide, configuration?.smartGuide)
    this["undo-redo"] = mergeDeep({}, DefaultEditorWebSocketConfiguration["undo-redo"], configuration?.["undo-redo"])
    this.grabber = mergeDeep({}, DefaultEditorWebSocketConfiguration.grabber, configuration?.grabber)
    this.triggers = mergeDeep({}, DefaultEditorWebSocketConfiguration.triggers, configuration?.triggers)
    this.logger = mergeDeep({}, DefaultEditorWebSocketConfiguration.logger, configuration?.logger)
    this.penStyle = mergeDeep({}, DefaultEditorWebSocketConfiguration.penStyle, configuration?.penStyle)
    this.penStyleClasses = configuration?.penStyleClasses || this.penStyleClasses
    this.theme = mergeDeep({}, DefaultEditorWebSocketConfiguration.theme, configuration?.theme)

    if (this.recognition.type !== "TEXT") {
      this.smartGuide.enable = false
    }
    if (this.smartGuide.enable && !this.recognition.text.mimeTypes.includes("application/vnd.myscript.jiix")) {
      this.recognition.text.mimeTypes.push("application/vnd.myscript.jiix")
    }

  }
}
