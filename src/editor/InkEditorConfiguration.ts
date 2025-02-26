import { DefaultGrabberConfiguration, TGrabberConfiguration } from "../grabber"
import { DefaultHistoryConfiguration, THistoryConfiguration } from "../history"
import { DefaultLoggerConfiguration, TLoggerConfiguration } from "../logger"
import { DefaultInkRecognizerConfiguration, InkRecognizerConfiguration, TInkRecognizerConfiguration, TInkRecognizerRecognitionConfiguration, TServerHTTPConfiguration } from "../recognizer"
import { DefaultRendererConfiguration, TRendererConfiguration } from "../renderer"
import { DefaultStyle, TStyle } from "../style"
import { convertPixelToMillimeter, mergeDeep, PartialDeep } from "../utils"
import { TEditorConfiguration } from "./AbstractEditor"
import { DefaultEditorTriggerConfiguration, TEditorTriggerConfiguration } from "./EditorTriggerConfiguration"


/**
 * @group Editor
 */
export type TInkEditorConfiguration = TEditorConfiguration & TInkRecognizerConfiguration & {
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
export const DefaultInkEditorConfiguration: TInkEditorConfiguration = {
  server: DefaultInkRecognizerConfiguration.server,
  recognition: DefaultInkRecognizerConfiguration.recognition,
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
  recognition: TInkRecognizerRecognitionConfiguration
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
    this.recognition.text.guides.enable = this.renderer.guides.enable
    if (this.renderer.guides.enable)
    {
      this.recognition.text.guides["line-gap-mm"] = convertPixelToMillimeter(this.renderer.guides.gap)
    }
    this.grabber = mergeDeep({}, DefaultInkEditorConfiguration.grabber, configuration?.grabber)
    this["undo-redo"] = mergeDeep({}, DefaultInkEditorConfiguration["undo-redo"], configuration?.["undo-redo"])
    this.triggers = mergeDeep({}, DefaultInkEditorConfiguration.triggers, configuration?.triggers)
    this.logger = mergeDeep({}, DefaultInkEditorConfiguration.logger, configuration?.logger)
    this.penStyle = mergeDeep({}, DefaultInkEditorConfiguration.penStyle, configuration?.penStyle)
  }
}
