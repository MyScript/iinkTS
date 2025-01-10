import { mergeDeep, PartialDeep } from "../utils"
import { DefaultStyle, TStyle } from "../style"
import { DefaultLoggerConfiguration, TLoggerConfiguration } from "../logger"
import { DefaultGrabberConfiguration, TGrabberConfiguration } from "../grabber"
import { DefaultHistoryConfiguration, THistoryConfiguration } from "../history"
import { DefaultMenuConfiguration, TMenuConfiguration } from "../menu"
import { DefaultOIRecognizerConfiguration, OIRecognizerConfiguration, TOIRecognitionConfiguration, TOIRecognizerConfiguration, TServerWebsocketConfiguration } from "../recognizer"
import { DefaultOIRendererConfiguration, TOIRendererConfiguration } from "../renderer"
import { DefaultGestureConfiguration, TGestureConfiguration } from "../gesture"
import { TEditorConfiguration } from "./AbstractEditor"
import { DefaultSnapConfiguration, SnapConfiguration, TSnapConfiguration } from "../snap"

/**
 * @group Editor
 */
export type TEditorOffscreenConfiguration = TEditorConfiguration & TOIRecognizerConfiguration & {
 "undo-redo": THistoryConfiguration
  rendering: TOIRendererConfiguration
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
export const DefaultEditorOffscreenConfiguration: TEditorOffscreenConfiguration = {
  server: DefaultOIRecognizerConfiguration.server,
  recognition: DefaultOIRecognizerConfiguration.recognition,
  menu: DefaultMenuConfiguration,
  rendering: DefaultOIRendererConfiguration,
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
export class EditorOffscreenConfiguration implements TEditorOffscreenConfiguration
{
  grabber: TGrabberConfiguration
  logger: TLoggerConfiguration
  server: TServerWebsocketConfiguration
  recognition: TOIRecognitionConfiguration
  rendering: TOIRendererConfiguration
  "undo-redo": THistoryConfiguration
  menu: TMenuConfiguration

  penStyle: TStyle
  fontStyle: {
    size: number | "auto"
    weight: "bold" | "normal" | "auto"
  }
  gesture: TGestureConfiguration
  snap: TSnapConfiguration

  constructor(configuration?: PartialDeep<TEditorOffscreenConfiguration>)
  {
    const { server, recognition } =  new OIRecognizerConfiguration(configuration)
    this.recognition = recognition
    this.server = server

    this.grabber = mergeDeep({}, DefaultEditorOffscreenConfiguration.grabber, configuration?.grabber)
    this.logger = mergeDeep({}, DefaultEditorOffscreenConfiguration.logger, configuration?.logger)
    this.rendering = mergeDeep({}, DefaultEditorOffscreenConfiguration.rendering, configuration?.rendering)
    this["undo-redo"] = mergeDeep({}, DefaultEditorOffscreenConfiguration["undo-redo"], configuration?.["undo-redo"])
    this.menu = mergeDeep({}, DefaultEditorOffscreenConfiguration.menu, configuration?.menu)
    this.gesture = mergeDeep({}, DefaultEditorOffscreenConfiguration.gesture, configuration?.gesture)
    this.snap = new SnapConfiguration(configuration?.snap)

    this.penStyle = mergeDeep({}, DefaultEditorOffscreenConfiguration.penStyle, configuration?.penStyle)
    this.fontStyle = mergeDeep({}, DefaultEditorOffscreenConfiguration.fontStyle, configuration?.fontStyle)
  }
}
