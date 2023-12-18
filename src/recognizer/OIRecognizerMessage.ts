import { TGestureType } from "../gesture"
import { TExport } from "../model"

export type TOIMessageEvent = {
  type: string
  [key: string]: unknown
}

export type TOIMessageEventError = {
  type: string
  code?: number | string
  message?: string
  data? : {
    code: number | string
    message: string
  }
}

export type TOIMessageEventHMACChallenge = TOIMessageEvent & {
  hmacChallenge: string
  iinkSessionId: string
}

export type TContentPackageDescriptionMessage = TOIMessageEvent & {
  contentPartCount: number
}

export type TOIMessageEventPartChange = TOIMessageEvent & {
  partIdx: number
  partId: string
  partCount: number
}

export type TOIMessageEventContentChange = TOIMessageEvent & {
  partId: string
  canUndo: boolean
  canRedo: boolean
  empty: boolean
  undoStackIndex: number
  possibleUndoCount: number
}

export type TOIMessageEventExport = TOIMessageEvent & {
  partId: string
  exports: TExport
}

export type TOIMessageEventGesture = TOIMessageEvent & {
  gestureType: TGestureType
  gestureStrokeId: string
  strokeIds: string[]
  strokeBeforeIds: string[]
  strokeAfterIds: string[]
  subStrokes?: { x: number[], y: number[] }[]
}
