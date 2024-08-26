import { TConfiguration, TLoggerConfiguration } from "../configuration"
import { InsertAction, StrikeThroughAction, SurroundAction } from "../gesture"
import { IGrabber } from "../grabber"
import { OIMenuAction, OIMenuIntention, OIMenuStyle } from "../menu"
import { OIRecognizer, RestRecognizer, WSRecognizer } from "../recognizer"
import { TStyle, TTheme } from "../style"

/**
 * @group Behavior
 * @remarks behaviors.menu, behaviors.gesture and fontStyle are only usable in the case of offscreen
 */
export type TBehaviorOptions = {
  configuration: TConfiguration
  behaviors?: {
    grabber?: IGrabber
    recognizer?: RestRecognizer | WSRecognizer | OIRecognizer
    menu?: {
      style?: OIMenuStyle
      intention?: OIMenuIntention
      action?: OIMenuAction
    },
    gesture?: {
      surround?: SurroundAction
      strikeThrough?: StrikeThroughAction
      insert?: InsertAction
    },
    snap?: {
      grid?: boolean
      element?: boolean
      angle?: number
    }
  }
  penStyle?: TStyle
  fontStyle?: {
    size?: number
    weight?: "bold" | "normal"
  }
  theme?: TTheme
  logger?: TLoggerConfiguration
}
