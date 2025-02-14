import { DefaultGrabberConfiguration, TGrabberConfiguration } from "../grabber"
import { DefaultHistoryConfiguration, THistoryConfiguration } from "../history"
import { DefaultLoggerConfiguration, TLoggerConfiguration } from "../logger"
import { DefaultRecognizerInkConfiguration, RecognizerInkConfiguration, TRecognizerInkConfiguration, TRecognizerInkRecognitionConfiguration, TServerHTTPConfiguration } from "../recognizer"
import { DefaultRendererConfiguration, TRendererConfiguration } from "../renderer"
import { DefaultStyle, TStyle } from "../style"
import { mergeDeep, PartialDeep } from "../utils"
import { TEditorConfiguration } from "./AbstractEditor"
import { DefaultEditorTriggerConfiguration, TEditorTriggerConfiguration } from "./EditorTriggerConfiguration"


/**
 * @group Editor
 */
export type TEditorInkConfiguration = TEditorConfiguration & TRecognizerInkConfiguration & {
  renderer: TRendererConfiguration
  "undo-redo": THistoryConfiguration
  grabber: TGrabberConfiguration
  triggers: TEditorTriggerConfiguration
  logger: TLoggerConfiguration
  penStyle: TStyle
}

/**
 * @group Editor
 * @source
 */
export const DefaultEditorInkConfiguration: TEditorInkConfiguration = {
  server: DefaultRecognizerInkConfiguration.server,
  recognition: DefaultRecognizerInkConfiguration.recognition,
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
  recognition: TRecognizerInkRecognitionConfiguration
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
    this.renderer = mergeDeep({}, DefaultEditorInkConfiguration.renderer, configuration?.renderer)
    this.grabber = mergeDeep({}, DefaultEditorInkConfiguration.grabber, configuration?.grabber)
    this["undo-redo"] = mergeDeep({}, DefaultEditorInkConfiguration["undo-redo"], configuration?.["undo-redo"])
    this.triggers = mergeDeep({}, DefaultEditorInkConfiguration.triggers, configuration?.triggers)
    this.logger = mergeDeep({}, DefaultEditorInkConfiguration.logger, configuration?.logger)
    this.penStyle = mergeDeep({}, DefaultEditorInkConfiguration.penStyle, configuration?.penStyle)
  }
}