import { DefaultGrabberConfiguration, TGrabberConfiguration } from "../grabber"
import { DefaultHistoryConfiguration, THistoryConfiguration } from "../history"
import { DefaultLoggerConfiguration, TLoggerConfiguration } from "../logger"
import { DefaultInkDeprecatedRecognizerConfiguration, InkRecognizerConfiguration, TInkDeprecatedRecognitionConfiguration, TInkDeprecatedRecognizerConfiguration , TServerHTTPConfiguration } from "../recognizer"
import { DefaultRendererConfiguration, TRendererConfiguration } from "../renderer"
import { DefaultStyle, TStyle } from "../style"
import { mergeDeep, PartialDeep } from "../utils"
import { TEditorConfiguration } from "./AbstractEditor"
import { DefaultEditorTriggerConfiguration, TEditorTriggerConfiguration } from "./EditorTriggerConfiguration"


/**
 * @group Editor
 */
export type TInkEditorConfiguration = TEditorConfiguration & TInkDeprecatedRecognizerConfiguration & {
  renderer: TRendererConfiguration
  "undo-redo": THistoryConfiguration
  grabber: TGrabberConfiguration
  triggers: TEditorTriggerConfiguration
  penStyle: TStyle
  logger: TLoggerConfiguration
}

/**
 * @group Editor
 * @source
 */
export const DefaultInkEditorConfiguration: TInkEditorConfiguration = {
  server: DefaultInkDeprecatedRecognizerConfiguration.server,
  recognition: DefaultInkDeprecatedRecognizerConfiguration.recognition,
  renderer: DefaultRendererConfiguration,
  grabber: DefaultGrabberConfiguration,
  triggers: DefaultEditorTriggerConfiguration,
  "undo-redo": DefaultHistoryConfiguration,
  logger: DefaultLoggerConfiguration,
  penStyle: DefaultStyle,
}

/**
 * @group Editor
 */
export class InkEditorConfiguration implements TInkEditorConfiguration
{
  server: TServerHTTPConfiguration
  recognition: TInkDeprecatedRecognitionConfiguration
  renderer: TRendererConfiguration
  "undo-redo": THistoryConfiguration
  grabber: TGrabberConfiguration
  triggers: TEditorTriggerConfiguration
  logger: TLoggerConfiguration
  penStyle: TStyle

  constructor(configuration?: PartialDeep<InkEditorConfiguration>)
  {
    const { server, recognition } = new InkRecognizerConfiguration(configuration)
    this.server = server
    this.recognition = recognition
    this.renderer = mergeDeep({}, DefaultInkEditorConfiguration.renderer, configuration?.renderer)
    this.grabber = mergeDeep({}, DefaultInkEditorConfiguration.grabber, configuration?.grabber)
    this["undo-redo"] = mergeDeep({}, DefaultInkEditorConfiguration["undo-redo"], configuration?.["undo-redo"])
    this.triggers = mergeDeep({}, DefaultInkEditorConfiguration.triggers, configuration?.triggers)
    this.penStyle = mergeDeep({}, DefaultInkEditorConfiguration.penStyle, configuration?.penStyle)
    this.logger = mergeDeep({}, DefaultInkEditorConfiguration.logger, configuration?.logger)
  }
}