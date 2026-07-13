import type { TCanvasConfiguration } from "@/canvas/AbstractCanvas"
import type { TCanvasTriggerConfiguration } from "@/canvas/CanvasTriggerConfiguration"
import { DefaultCanvasTriggerConfiguration } from "@/canvas/CanvasTriggerConfiguration"
import type {
  THTTPClientV2Configuration,
  THTTPClientV2RecognitionConfiguration,
  TServerHTTPConfiguration,
} from "@/client"
import { DefaultHTTPClientV2Configuration, HTTPClientV2Configuration } from "@/client"
import type { TGrabberConfiguration } from "@/grabber"
import { DefaultGrabberConfiguration } from "@/grabber"
import type { THistoryConfiguration } from "@/history"
import { DefaultHistoryConfiguration } from "@/history"
import type { TLoggerConfiguration } from "@/logger"
import { DefaultLoggerConfiguration } from "@/logger"
import type { TIIRendererConfiguration } from "@/renderer"
import { DefaultIIRendererConfiguration } from "@/renderer"
import type { TStyle } from "@/style"
import { DefaultStyle } from "@/style"
import type { TPartialDeep } from "@/utils"
import { convertPixelToMillimeter, mergeDeep } from "@/utils"

/**
 * @group Canvas
 */
export type TInkCanvasConfiguration = TCanvasConfiguration &
  THTTPClientV2Configuration & {
    rendering: TIIRendererConfiguration
    "undo-redo": THistoryConfiguration
    grabber: TGrabberConfiguration
    triggers: TCanvasTriggerConfiguration
    logger: TLoggerConfiguration
    penStyle: TStyle
  }

/**
 * @group Canvas
 * @source
 */
export const DefaultInkCanvasConfiguration: TInkCanvasConfiguration = {
  server: DefaultHTTPClientV2Configuration.server,
  recognition: DefaultHTTPClientV2Configuration.recognition,
  rendering: DefaultIIRendererConfiguration,
  grabber: DefaultGrabberConfiguration,
  triggers: DefaultCanvasTriggerConfiguration,
  "undo-redo": DefaultHistoryConfiguration,
  logger: DefaultLoggerConfiguration,
  penStyle: DefaultStyle,
}

/**
 * @group Canvas
 */
export class InkCanvasConfiguration implements TInkCanvasConfiguration {
  server: TServerHTTPConfiguration
  recognition: THTTPClientV2RecognitionConfiguration
  rendering: TIIRendererConfiguration
  "undo-redo": THistoryConfiguration
  grabber: TGrabberConfiguration
  triggers: TCanvasTriggerConfiguration
  logger: TLoggerConfiguration
  penStyle: TStyle

  constructor(configuration?: TPartialDeep<InkCanvasConfiguration>) {
    const { server, recognition } = new HTTPClientV2Configuration(configuration)
    this.server = server
    this.recognition = recognition
    this.rendering = mergeDeep({}, DefaultInkCanvasConfiguration.rendering, configuration?.rendering)
    this.recognition.text.guides.enable = this.rendering.guides.enable
    if (this.rendering.guides.enable) {
      this.recognition.text.guides["line-gap-mm"] = convertPixelToMillimeter(this.rendering.guides.gap)
    }
    this.grabber = mergeDeep({}, DefaultInkCanvasConfiguration.grabber, configuration?.grabber)
    this["undo-redo"] = mergeDeep({}, DefaultInkCanvasConfiguration["undo-redo"], configuration?.["undo-redo"])
    this.triggers = mergeDeep({}, DefaultInkCanvasConfiguration.triggers, configuration?.triggers)
    this.logger = mergeDeep({}, DefaultInkCanvasConfiguration.logger, configuration?.logger)
    this.penStyle = mergeDeep({}, DefaultInkCanvasConfiguration.penStyle, configuration?.penStyle)
  }
}
