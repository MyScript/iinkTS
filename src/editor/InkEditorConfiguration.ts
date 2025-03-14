import { DefaultGrabberConfiguration, TGrabberConfiguration } from "../grabber"
import { DefaultHistoryConfiguration, THistoryConfiguration } from "../history"
import { DefaultLoggerConfiguration, TLoggerConfiguration } from "../logger"
import { DefaultRecognizerHTTPV2Configuration, RecognizerHTTPV2Configuration, TRecognizerHTTPV2Configuration, TRecognizerHTTPV2RecognitionConfiguration, TServerHTTPConfiguration } from "../recognizer"
import { DefaultIIRendererConfiguration, TIIRendererConfiguration } from "../renderer"
import { DefaultStyle, TStyle } from "../style"
import { convertPixelToMillimeter, mergeDeep, PartialDeep } from "../utils"
import { TEditorConfiguration } from "./AbstractEditor"
import { DefaultIEditorTriggerConfiguration, TIEditorTriggerConfiguration } from "./IEditorTriggerConfiguration"


/**
 * @group Editor
 */
export type TInkEditorConfiguration = TEditorConfiguration & TRecognizerHTTPV2Configuration & {
  rendering: TIIRendererConfiguration
  "undo-redo": THistoryConfiguration
  grabber: TGrabberConfiguration
  triggers: TIEditorTriggerConfiguration
  logger: TLoggerConfiguration
  penStyle: TStyle
}

/**
 * @group Editor
 * @source
 */
export const DefaultInkEditorConfiguration: TInkEditorConfiguration = {
  server: DefaultRecognizerHTTPV2Configuration.server,
  recognition: DefaultRecognizerHTTPV2Configuration.recognition,
  rendering: DefaultIIRendererConfiguration,
  grabber: DefaultGrabberConfiguration,
  triggers: DefaultIEditorTriggerConfiguration,
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
  recognition: TRecognizerHTTPV2RecognitionConfiguration
  rendering: TIIRendererConfiguration
  "undo-redo": THistoryConfiguration
  grabber: TGrabberConfiguration
  triggers: TIEditorTriggerConfiguration
  logger: TLoggerConfiguration
  penStyle: TStyle

  constructor(configuration?: PartialDeep<InkEditorConfiguration>)
  {
    const { server, recognition } = new RecognizerHTTPV2Configuration(configuration)
    this.server = server
    this.recognition = recognition
    this.rendering = mergeDeep({}, DefaultInkEditorConfiguration.rendering, configuration?.rendering)
    this.recognition.text.guides.enable = this.rendering.guides.enable
    if (this.rendering.guides.enable)
    {
      this.recognition.text.guides["line-gap-mm"] = convertPixelToMillimeter(this.rendering.guides.gap)
    }
    this.grabber = mergeDeep({}, DefaultInkEditorConfiguration.grabber, configuration?.grabber)
    this["undo-redo"] = mergeDeep({}, DefaultInkEditorConfiguration["undo-redo"], configuration?.["undo-redo"])
    this.triggers = mergeDeep({}, DefaultInkEditorConfiguration.triggers, configuration?.triggers)
    this.logger = mergeDeep({}, DefaultInkEditorConfiguration.logger, configuration?.logger)
    this.penStyle = mergeDeep({}, DefaultInkEditorConfiguration.penStyle, configuration?.penStyle)
  }
}
