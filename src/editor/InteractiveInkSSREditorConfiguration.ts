import { DefaultGrabberConfiguration, TGrabberConfiguration } from "../grabber"
import { DefaultHistoryConfiguration, THistoryConfiguration } from "../history"
import { DefaultLoggerConfiguration, TLoggerConfiguration } from "../logger"
import { DefaultRecognizerWebSocketSSRConfiguration, TRecognizerWebSocketSSRRecognitionConfiguration, TRecognizerWebSocketSSRConfiguration, RecognizerWebSocketSSRConfiguration, TServerWebsocketConfiguration } from "../recognizer"
import { DefaultRendererConfiguration, TRendererConfiguration } from "../renderer"
import { DefaultTheme, TPenStyle, TTheme } from "../style"
import { mergeDeep, PartialDeep } from "../utils"
import { TEditorConfiguration } from "./AbstractEditor"
import { DefaultEditorTriggerConfiguration, TEditorTriggerConfiguration } from "./EditorTriggerConfiguration"

/**
 * @group Editor
 */
export type TInteractiveInkSSREditorConfiguration = TEditorConfiguration & TRecognizerWebSocketSSRConfiguration & {
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
export const DefaultInteractiveInkSSREditorConfiguration: TInteractiveInkSSREditorConfiguration = {
  server: DefaultRecognizerWebSocketSSRConfiguration.server,
  recognition: DefaultRecognizerWebSocketSSRConfiguration.recognition,
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
export class InteractiveInkSSREditorConfiguration implements TInteractiveInkSSREditorConfiguration
{
  server: TServerWebsocketConfiguration
  recognition: TRecognizerWebSocketSSRRecognitionConfiguration
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

  constructor(configuration?: PartialDeep<TInteractiveInkSSREditorConfiguration>)
  {
    const { server, recognition } = new RecognizerWebSocketSSRConfiguration(configuration)
    this.server = server
    this.recognition = recognition

    this.rendering = mergeDeep({}, DefaultInteractiveInkSSREditorConfiguration.rendering, configuration?.rendering)
    this.smartGuide = mergeDeep({}, DefaultInteractiveInkSSREditorConfiguration.smartGuide, configuration?.smartGuide)
    this["undo-redo"] = mergeDeep({}, DefaultInteractiveInkSSREditorConfiguration["undo-redo"], configuration?.["undo-redo"])
    this.grabber = mergeDeep({}, DefaultInteractiveInkSSREditorConfiguration.grabber, configuration?.grabber)
    this.triggers = mergeDeep({}, DefaultInteractiveInkSSREditorConfiguration.triggers, configuration?.triggers)
    this.logger = mergeDeep({}, DefaultInteractiveInkSSREditorConfiguration.logger, configuration?.logger)
    this.penStyle = mergeDeep({}, DefaultInteractiveInkSSREditorConfiguration.penStyle, configuration?.penStyle)
    this.penStyleClasses = configuration?.penStyleClasses || this.penStyleClasses
    this.theme = mergeDeep({}, DefaultInteractiveInkSSREditorConfiguration.theme, configuration?.theme)

    if (this.recognition.type !== "TEXT") {
      this.smartGuide.enable = false
    }
    if (this.smartGuide.enable && !this.recognition.text.mimeTypes.includes("application/vnd.myscript.jiix")) {
      this.recognition.text.mimeTypes.push("application/vnd.myscript.jiix")
    }

  }
}
