import { TGesture } from "../gesture"
import { TExport } from "../model"

/**
 * @group Recognizer
 */
export enum TOIMessageType
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
 * @description use to type message to send to backend
 */
export type TOIMessageEvent = {
  type: string
  [key: string]: unknown
}

/**
 * @group Recognizer
 */
export type TOIMessage<T = string> = {
  type: T
}

/**
 * @group Recognizer
 */
export type TOIMessageEventAuthenticated = TOIMessage<TOIMessageType.Authenticated>

/**
 * @group Recognizer
 */
export type TOIMessageEventHMACChallenge = TOIMessage<TOIMessageType.HMAC_Challenge> & {
  hmacChallenge: string
  iinkSessionId: string
}

/**
 * @group Recognizer
 */
export type TOISessionDescriptionMessage = TOIMessage<TOIMessageType.SessionDescription> & {
  contentPartCount: number
  iinkSessionId: string
}

/**
 * @group Recognizer
 */
export type TOIMessageEventNewPart = TOIMessage<TOIMessageType.NewPart> & {
  id: string
  idx: null
}

/**
 * @group Recognizer
 */
export type TOIMessageEventPartChange = TOIMessage<TOIMessageType.PartChanged> & {
  partIdx: number
  partId: string
  partCount: number
}

/**
 * @group Recognizer
 */
export type TOIMessageEventContentChange = TOIMessage<TOIMessageType.ContentChanged> & {
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
export type TOIMessageEventExport = TOIMessage<TOIMessageType.Exported> & {
  partId: string
  exports: TExport
}

/**
 * @group Recognizer
 */
export type TOIMessageEventGesture = TOIMessage<TOIMessageType.GestureDetected> & TGesture

/**
 * @group Recognizer
 */
export type TOIMessageEventContextlessGesture = TOIMessage<TOIMessageType.ContextlessGesture> & {
  gestureType: "none" | "scratch" | "left-right" | "right-left" | "bottom-top" | "top-bottom" | "surround",
  strokeId: string
}

/**
 * @group Recognizer
 */
export type TOIMessageEventPong = TOIMessage<TOIMessageType.Pong>

/**
 * @group Recognizer
 */
export type TOIMessageEventIdle = TOIMessage<TOIMessageType.Idle>

/**
 * @group Recognizer
 */
export type TOIMessageEventError = TOIMessage<TOIMessageType.Error> & {
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
export type TOIMessageReceived =
  TOIMessageEventAuthenticated |
  TOIMessageEventHMACChallenge |
  TOISessionDescriptionMessage |
  TOIMessageEventNewPart |
  TOIMessageEventPartChange |
  TOIMessageEventContentChange |
  TOIMessageEventExport |
  TOIMessageEventGesture |
  TOIMessageEventContextlessGesture |
  TOIMessageEventPong |
  TOIMessageEventIdle |
  TOIMessageEventError
