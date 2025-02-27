import { DefaultGrabberConfiguration, TGrabberConfiguration } from "../grabber"
import { DefaultHistoryConfiguration, THistoryConfiguration } from "../history"
import { DefaultLoggerConfiguration, TLoggerConfiguration } from "../logger"
import { DefaultRecognizerHTTPV1Configuration, RecognizerHTTPV1Configuration, TRecognitionHTTPV1Configuration, TRecognizerHTTPV1Configuration, TServerHTTPConfiguration } from "../recognizer"
import { DefaultRendererConfiguration, TRendererConfiguration } from "../renderer"
import { DefaultTheme, TPenStyle, TTheme } from "../style"
import { mergeDeep, PartialDeep } from "../utils"
import { TEditorConfiguration } from "./AbstractEditor"
import { DefaultEditorTriggerConfiguration, TEditorTriggerConfiguration } from "./EditorTriggerConfiguration"


/**
 * @group Editor
 */
export type TInkEditorDeprecatedConfiguration = TEditorConfiguration & TRecognizerHTTPV1Configuration & {
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
export const DefaultInkEditorDeprecatedConfiguration: TInkEditorDeprecatedConfiguration = {
  server: DefaultRecognizerHTTPV1Configuration.server,
  recognition: DefaultRecognizerHTTPV1Configuration.recognition,
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
export class InkEditorDeprecatedConfiguration implements TInkEditorDeprecatedConfiguration
{
  server: TServerHTTPConfiguration
  recognition: TRecognitionHTTPV1Configuration
  rendering: TRendererConfiguration
  "undo-redo": THistoryConfiguration
  grabber: TGrabberConfiguration
  triggers: TEditorTriggerConfiguration
  logger: TLoggerConfiguration
  penStyle: TPenStyle
  penStyleClasses?: string
  theme: TTheme

  constructor(configuration?: PartialDeep<TInkEditorDeprecatedConfiguration>)
  {
    const { server, recognition } = new RecognizerHTTPV1Configuration(configuration)
    this.server = server
    this.recognition = recognition
    this.rendering = mergeDeep({}, DefaultInkEditorDeprecatedConfiguration.rendering, configuration?.rendering)
    this.grabber = mergeDeep({}, DefaultInkEditorDeprecatedConfiguration.grabber, configuration?.grabber)
    this["undo-redo"] = mergeDeep({}, DefaultInkEditorDeprecatedConfiguration["undo-redo"], configuration?.["undo-redo"])
    this.triggers = mergeDeep({}, DefaultInkEditorDeprecatedConfiguration.triggers, configuration?.triggers)
    this.logger = mergeDeep({}, DefaultInkEditorDeprecatedConfiguration.logger, configuration?.logger)
    this.penStyle = mergeDeep({}, DefaultInkEditorDeprecatedConfiguration.penStyle, configuration?.penStyle)
    this.penStyleClasses = configuration?.penStyleClasses || this.penStyleClasses
    this.theme = mergeDeep({}, DefaultInkEditorDeprecatedConfiguration.theme, configuration?.theme)
  }
}
