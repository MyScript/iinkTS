import { TGesture } from "../gesture"
import { TExport } from "../model"

/**
 * @group Recognizer
 */
export enum TInteractiveInkMessageType
{
  HMAC_Challenge = "hmacChallenge",
  Authenticated = "authenticated",
  SessionDescription = "sessionDescription",
  NewPart = "newPart",
  PartChanged = "partChanged",
  ContentChanged = "contentChanged",
  Idle = "idle",
  Pong = "pong",
  Exported = "exported",
  GestureDetected = "gestureDetected",
  ContextlessGesture = "contextlessGesture",
  Error = "error",
}

/**
 * @group Recognizer
 * @remarks use to type message to send to backend
 */
export type TInteractiveInkMessageEvent = {
  type: string
  [key: string]: unknown
}

/**
 * @group Recognizer
 */
export type TInteractiveInkMessage<T = string> = {
  type: T
}

/**
 * @group Recognizer
 */
export type TInteractiveInkMessageEventAuthenticated = TInteractiveInkMessage<TInteractiveInkMessageType.Authenticated>

/**
 * @group Recognizer
 */
export type TInteractiveInkMessageEventHMACChallenge = TInteractiveInkMessage<TInteractiveInkMessageType.HMAC_Challenge> & {
  hmacChallenge: string
  iinkSessionId: string
}

/**
 * @group Recognizer
 */
export type TInteractiveInkSessionDescriptionMessage = TInteractiveInkMessage<TInteractiveInkMessageType.SessionDescription> & {
  contentPartCount: number
  iinkSessionId: string
}

/**
 * @group Recognizer
 */
export type TInteractiveInkMessageEventNewPart = TInteractiveInkMessage<TInteractiveInkMessageType.NewPart> & {
  id: string
  idx: null
}

/**
 * @group Recognizer
 */
export type TInteractiveInkMessageEventPartChange = TInteractiveInkMessage<TInteractiveInkMessageType.PartChanged> & {
  partIdx: number
  partId: string
  partCount: number
}

/**
 * @group Recognizer
 */
export type TInteractiveInkMessageEventContentChange = TInteractiveInkMessage<TInteractiveInkMessageType.ContentChanged> & {
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
export type TInteractiveInkMessageEventExport = TInteractiveInkMessage<TInteractiveInkMessageType.Exported> & {
  partId: string
  exports: TExport
}

/**
 * @group Recognizer
 */
export type TInteractiveInkMessageEventGesture = TInteractiveInkMessage<TInteractiveInkMessageType.GestureDetected> & TGesture

/**
 * @group Recognizer
 */
export type TInteractiveInkMessageEventContextlessGesture = TInteractiveInkMessage<TInteractiveInkMessageType.ContextlessGesture> & {
  gestureType: "none" | "scratch" | "left-right" | "right-left" | "bottom-top" | "top-bottom" | "surround",
  strokeId: string
}

/**
 * @group Recognizer
 */
export type TInteractiveInkMessageEventPong = TInteractiveInkMessage<TInteractiveInkMessageType.Pong>

/**
 * @group Recognizer
 */
export type TInteractiveInkMessageEventIdle = TInteractiveInkMessage<TInteractiveInkMessageType.Idle>

/**
 * @group Recognizer
 */
export type TInteractiveInkMessageEventError = TInteractiveInkMessage<TInteractiveInkMessageType.Error> & {
  code?: number | string
  message?: string
  data?: {
    code: number | string
    message: string
  }
}

/**
 * @group Recognizer
 */
export type TInteractiveInkMessageReceived =
  TInteractiveInkMessageEventAuthenticated |
  TInteractiveInkMessageEventHMACChallenge |
  TInteractiveInkSessionDescriptionMessage |
  TInteractiveInkMessageEventNewPart |
  TInteractiveInkMessageEventPartChange |
  TInteractiveInkMessageEventContentChange |
  TInteractiveInkMessageEventExport |
  TInteractiveInkMessageEventGesture |
  TInteractiveInkMessageEventContextlessGesture |
  TInteractiveInkMessageEventPong |
  TInteractiveInkMessageEventIdle |
  TInteractiveInkMessageEventError
