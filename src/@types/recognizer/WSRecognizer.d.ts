import { TExport } from "../model/Export"

export type TWSMessageEvent = {
  type: string
  [key: string]: unknown
}

export type TWSMessageEventError = {
  type: string
  code?: number | string
  message?: string
  data? : {
    code: number | string
    message: string
  }
}

export type TWSMessageEventHMACChallenge = TWSMessageEvent & {
  hmacChallenge: string
  iinkSessionId: string
}

export type TWSMessageEventContentPackageDescriptionMessage = TWSMessageEvent & {
  contentPartCount: number
}

export type TWSMessageEventPartChange = TWSMessageEvent & {
  partIdx: number
  partId: string
  partCount: number
}

export type TWSMessageEventContentChange = TWSMessageEvent & {
  partId: string
  canUndo: boolean
  canRedo: boolean
  empty: boolean
  undoStackIndex: number
  possibleUndoCount: number
}

export type TWSMessageEventExport = TWSMessageEvent & {
  partId: string
  exports: TExport
}

export type TUpdatePatchType = "REPLACE_ALL" | "REMOVE_ELEMENT" | "REPLACE_ELEMENT" | "REMOVE_CHILD" | "APPEND_CHILD" | "INSERT_BEFORE" | "REMOVE_ATTRIBUTE" | "SET_ATTRIBUTE"

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

export type TWSMessageEventSVGPatch = TWSMessageEvent & {
  updates: TUpdatePatch[]
  layer: ("MODEL" | "CAPTURE")
}
