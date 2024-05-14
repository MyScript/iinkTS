import { TGesture } from "../gesture"
import { TExport } from "../model"

/**
 * @group Recognizer
 */
export type TOIMessageEvent = {
  type: string
  [key: string]: unknown
}

/**
 * @group Recognizer
 */
export type TOIMessageEventError = {
  type: string
  code?: number | string
  message?: string
  data? : {
    code: number | string
    message: string
  }
}

/**
 * @group Recognizer
 */
export type TOIMessageEventHMACChallenge = TOIMessageEvent & {
  hmacChallenge: string
  iinkSessionId: string
}

/**
 * @group Recognizer
 */
export type TContentPackageDescriptionMessage = TOIMessageEvent & {
  contentPartCount: number
}

/**
 * @group Recognizer
 */
export type TOIMessageEventPartChange = TOIMessageEvent & {
  partIdx: number
  partId: string
  partCount: number
}

/**
 * @group Recognizer
 */
export type TOIMessageEventContentChange = TOIMessageEvent & {
  partId: string
  canUndo: boolean
  canRedo: boolean
  empty: boolean
  undoStackIndex: number
  possibleUndoCount: number
}

/**
 * @group Recognizer
 */
export type TOIMessageEventExport = TOIMessageEvent & {
  partId: string
  exports: TExport
}

/**
 * @group Recognizer
 */
export type TOIMessageEventGesture = TOIMessageEvent & TGesture

/**
 * @group Recognizer
 */
export type TContextlessGestureType = {
  type: "none" | "scratch" | "left-right" | "right-left" | "bottom-top" | "top-bottom" | "surround" | string,
}
/**
 * @group Recognizer
 */
export type TOIMessageEventContextlessGesture = TOIMessageEvent & {
  gestures: TContextlessGestureType[]
}
