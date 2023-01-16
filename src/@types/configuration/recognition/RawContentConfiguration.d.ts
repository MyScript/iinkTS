
import { TEraserConfiguration } from "./EraserConfiguration"
import { TTextConfConfiguration } from "./TextConfiguration"

export type TRecognitionConfiguration = {
  text: boolean
  shape: boolean
}

export type TRawContentConfiguration = {
  text?: TTextConfConfiguration
  "session-time"?: number
  recognition?: TRecognitionConfiguration
  eraser?: TEraserConfiguration
}