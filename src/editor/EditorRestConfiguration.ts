import { DefaultGrabberConfiguration, TGrabberConfiguration } from "../grabber"
import { DefaultHistoryConfiguration, THistoryConfiguration } from "../history"
import { DefaultLoggerConfiguration, TLoggerConfiguration } from "../logger"
import { DefaultRestRecognizerConfiguration, RestRecognizerConfiguration, TRestRecognitionConfiguration, TRestRecognizerConfiguration, TServerHTTPConfiguration } from "../recognizer"
import { DefaultRendererConfiguration, TRendererConfiguration } from "../renderer"
import { DefaultTheme, TPenStyle, TTheme } from "../style"
import { mergeDeep, PartialDeep } from "../utils"
import { TEditorConfiguration } from "./AbstractEditor"
import { DefaultEditorTriggerConfiguration, TEditorTriggerConfiguration } from "./EditorTriggerConfiguration"


/**
 * @group Editor
 */
export type TEditorRestConfiguration = TEditorConfiguration & TRestRecognizerConfiguration & {
  rendering: TRendererConfiguration
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
export const DefaultEditorRestConfiguration: TEditorRestConfiguration = {
  server: DefaultRestRecognizerConfiguration.server,
  recognition: DefaultRestRecognizerConfiguration.recognition,
  rendering: DefaultRendererConfiguration,
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
export class EditorRestConfiguration implements TEditorRestConfiguration
{
  server: TServerHTTPConfiguration
  recognition: TRestRecognitionConfiguration
  rendering: TRendererConfiguration
  "undo-redo": THistoryConfiguration
  grabber: TGrabberConfiguration
  triggers: TEditorTriggerConfiguration
  logger: TLoggerConfiguration
  penStyle: TPenStyle
  penStyleClasses?: string
  theme: TTheme

  constructor(configuration?: PartialDeep<TEditorRestConfiguration>)
  {
    const { server, recognition } = new RestRecognizerConfiguration(configuration)
    this.server = server
    this.recognition = recognition
    this.rendering = mergeDeep({}, DefaultEditorRestConfiguration.rendering, configuration?.rendering)
    this.grabber = mergeDeep({}, DefaultEditorRestConfiguration.grabber, configuration?.grabber)
    this["undo-redo"] = mergeDeep({}, DefaultEditorRestConfiguration["undo-redo"], configuration?.["undo-redo"])
    this.triggers = mergeDeep({}, DefaultEditorRestConfiguration.triggers, configuration?.triggers)
    this.logger = mergeDeep({}, DefaultEditorRestConfiguration.logger, configuration?.logger)
    this.penStyle = mergeDeep({}, DefaultEditorRestConfiguration.penStyle, configuration?.penStyle)
    this.penStyleClasses = configuration?.penStyleClasses || this.penStyleClasses
    this.theme = mergeDeep({}, DefaultEditorRestConfiguration.theme, configuration?.theme)
  }
}
