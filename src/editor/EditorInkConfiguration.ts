import { DefaultGrabberConfiguration, TGrabberConfiguration } from "../grabber"
import { DefaultHistoryConfiguration, THistoryConfiguration } from "../history"
import { DefaultLoggerConfiguration, TLoggerConfiguration } from "../logger"
import { DefaultRestRecognizerConfiguration, RecognizerInkConfiguration, TRestRecognitionConfiguration, TRestRecognizerConfiguration, TServerHTTPConfiguration } from "../recognizer"
import { DefaultRendererConfiguration, TRendererConfiguration } from "../renderer"
import { DefaultStyle, TStyle } from "../style"
import { mergeDeep, PartialDeep } from "../utils"
import { TEditorConfiguration } from "./AbstractEditor"
import { DefaultEditorTriggerConfiguration, TEditorTriggerConfiguration } from "./EditorTriggerConfiguration"


/**
 * @group Editor
 */
export type TEditorInkConfiguration = TEditorConfiguration & TRestRecognizerConfiguration & {
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
export const DefaultEditorInkConfiguration: TEditorInkConfiguration = {
  server: DefaultRestRecognizerConfiguration.server,
  recognition: DefaultRestRecognizerConfiguration.recognition,
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
export class EditorInkConfiguration implements TEditorInkConfiguration
{
  server: TServerHTTPConfiguration
  recognition: TRestRecognitionConfiguration
  renderer: TRendererConfiguration
  "undo-redo": THistoryConfiguration
  grabber: TGrabberConfiguration
  triggers: TEditorTriggerConfiguration
  logger: TLoggerConfiguration
  penStyle: TStyle

  constructor(configuration?: PartialDeep<EditorInkConfiguration>)
  {
    const { server, recognition } = new RecognizerInkConfiguration(configuration)
    this.server = server
    this.recognition = recognition
    this.renderer = mergeDeep({}, DefaultEditorInkConfiguration.renderer, configuration?.renderer)
    this.grabber = mergeDeep({}, DefaultEditorInkConfiguration.grabber, configuration?.grabber)
    this["undo-redo"] = mergeDeep({}, DefaultEditorInkConfiguration["undo-redo"], configuration?.["undo-redo"])
    this.triggers = mergeDeep({}, DefaultEditorInkConfiguration.triggers, configuration?.triggers)
    this.penStyle = mergeDeep({}, DefaultEditorInkConfiguration.penStyle, configuration?.penStyle)
    this.logger = mergeDeep({}, DefaultEditorInkConfiguration.logger, configuration?.logger)
  }
}