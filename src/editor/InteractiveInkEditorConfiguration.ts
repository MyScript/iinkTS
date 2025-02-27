import { mergeDeep, PartialDeep } from "../utils"
import { DefaultStyle, TStyle } from "../style"
import { DefaultLoggerConfiguration, TLoggerConfiguration } from "../logger"
import { DefaultGrabberConfiguration, TGrabberConfiguration } from "../grabber"
import { DefaultHistoryConfiguration, THistoryConfiguration } from "../history"
import { DefaultMenuConfiguration, TMenuConfiguration } from "../menu"
import { DefaultRecognizerWebSocketConfiguration, RecognizerWebSocketConfiguration, TRecognitionWebSocketConfiguration, TRecognizerWebSocketConfiguration, TServerWebsocketConfiguration } from "../recognizer"
import { DefaultIIRendererConfiguration, TIIRendererConfiguration } from "../renderer"
import { DefaultGestureConfiguration, TGestureConfiguration } from "../gesture"
import { TEditorConfiguration } from "./AbstractEditor"
import { DefaultSnapConfiguration, SnapConfiguration, TSnapConfiguration } from "../snap"

/**
 * @group Editor
 */
export type TInteractiveInkEditorConfiguration = TEditorConfiguration & TRecognizerWebSocketConfiguration & {
 "undo-redo": THistoryConfiguration
  rendering: TIIRendererConfiguration
  grabber: TGrabberConfiguration
  menu: TMenuConfiguration
  penStyle: TStyle,
  fontStyle: {
    size: number | "auto"
    weight: "bold" | "normal" | "auto"
  }
  gesture: TGestureConfiguration
  snap: TSnapConfiguration
}

/**
 * @group Editor
 * @source
 */
export const DefaultInteractiveInkEditorConfiguration: TInteractiveInkEditorConfiguration = {
  server: DefaultRecognizerWebSocketConfiguration.server,
  recognition: DefaultRecognizerWebSocketConfiguration.recognition,
  menu: DefaultMenuConfiguration,
  rendering: DefaultIIRendererConfiguration,
  logger: DefaultLoggerConfiguration,
  grabber: DefaultGrabberConfiguration,
  "undo-redo": DefaultHistoryConfiguration,

  penStyle: DefaultStyle,
  fontStyle: {
    size: "auto",
    weight: "auto",
  },
  gesture: DefaultGestureConfiguration,
  snap: DefaultSnapConfiguration
}

/**
 * @group Editor
 */
export class InteractiveInkEditorConfiguration implements TInteractiveInkEditorConfiguration
{
  grabber: TGrabberConfiguration
  logger: TLoggerConfiguration
  server: TServerWebsocketConfiguration
  recognition: TRecognitionWebSocketConfiguration
  rendering: TIIRendererConfiguration
  "undo-redo": THistoryConfiguration
  menu: TMenuConfiguration

  penStyle: TStyle
  fontStyle: {
    size: number | "auto"
    weight: "bold" | "normal" | "auto"
  }
  gesture: TGestureConfiguration
  snap: TSnapConfiguration

  constructor(configuration?: PartialDeep<TInteractiveInkEditorConfiguration>)
  {
    const { server, recognition } =  new RecognizerWebSocketConfiguration(configuration)
    this.recognition = recognition
    this.server = server

    this.grabber = mergeDeep({}, DefaultInteractiveInkEditorConfiguration.grabber, configuration?.grabber)
    this.logger = mergeDeep({}, DefaultInteractiveInkEditorConfiguration.logger, configuration?.logger)
    this.rendering = mergeDeep({}, DefaultInteractiveInkEditorConfiguration.rendering, configuration?.rendering)
    this["undo-redo"] = mergeDeep({}, DefaultInteractiveInkEditorConfiguration["undo-redo"], configuration?.["undo-redo"])
    this.menu = mergeDeep({}, DefaultInteractiveInkEditorConfiguration.menu, configuration?.menu)
    this.gesture = mergeDeep({}, DefaultInteractiveInkEditorConfiguration.gesture, configuration?.gesture)
    this.snap = new SnapConfiguration(configuration?.snap)

    this.penStyle = mergeDeep({}, DefaultInteractiveInkEditorConfiguration.penStyle, configuration?.penStyle)
    this.fontStyle = mergeDeep({}, DefaultInteractiveInkEditorConfiguration.fontStyle, configuration?.fontStyle)
  }
}
