import { TExport } from "../model/Model"


export type TWebSocketEvent = {
  type: string
  [key: string]: unknown
}

export type TWebSocketErrorEvent = {
  type: string
  code?: number | string
  message?: string
  data? : {
    code: number | string
    message: string
  }
}

export type TWebSocketHMACChallengeEvent = TWebSocketEvent & {
  hmacChallenge: string
  iinkSessionId: string
}

export type TContentPackageDescriptionMessage = TWebSocketEvent & {
  contentPartCount: number
}

export type TWebSocketPartChangeEvent = TWebSocketEvent & {
  partIdx: number
  partId: string
  partCount: number
}

export type TWebSocketContentChangeEvent = TWebSocketEvent & {
  partId: string
  canUndo: boolean
  canRedo: boolean
  empty: boolean
  undoStackIndex: number
  possibleUndoCount: number
}

export type TWebSocketExportEvent = TWebSocketEvent & {
  partId: string
  exports: TExport
}

export type TUpdatePatchType = 'REPLACE_ALL' | 'REMOVE_ELEMENT' | 'REPLACE_ELEMENT' | 'REMOVE_CHILD' | 'APPEND_CHILD' | 'INSERT_BEFORE' | 'REMOVE_ATTRIBUTE' | 'SET_ATTRIBUTE'

export type TUpdatePatch = {
  type: TUpdatePatchType
}

export type TUpdatePatchReplaceAll = TUpdatePatch & {
  svg: string
}

export type TUpdatePatchReplaceELement = TUpdatePatch & {
  id: string
  svg: string
}

export type TUpdatePatchInsertBefore = TUpdatePatch & {
  refId: string
  svg: string
}

export type TUpdatePatchRemoveElement = TUpdatePatch & {
  id: string
}

export type TUpdatePatchAppendChild = TUpdatePatch & {
  parentId?: string
  svg: string
}

export type TUpdatePatchRemoveChild = TUpdatePatch & {
  parentId: string
  index: number
}

export type TUpdatePatchRemoveAttribut = TUpdatePatch & {
  id?: string
  name: string
}

export type TUpdatePatchSetAttribut = TUpdatePatch & {
  id?: string
  name: string
  value: string
}

export type TWebSocketSVGPatchEvent = TWebSocketEvent & {
  updates: TUpdatePatch[]
  layer: ('MODEL' | 'CAPTURE')
}