import type { TExport } from "@/model"

/**
 * @group Client
 */
export type TWebSocketSSRClientMessage = {
  type: string
  [key: string]: unknown
}

/**
 * @group Client
 */
export type TWebSocketSSRClientMessageError = {
  type: string
  code?: number | string
  message?: string
  data?: {
    code: number | string
    message: string
  }
}

/**
 * @group Client
 */
export type TWebSocketSSRClientMessageHMACChallenge = TWebSocketSSRClientMessage & {
  hmacChallenge: string
  iinkSessionId: string
}

/**
 * @group Client
 */
export type TWebSocketSSRClientMessageContentPackageDescriptionMessage = TWebSocketSSRClientMessage & {
  contentPartCount: number
}

/**
 * @group Client
 */
export type TWebSocketSSRClientMessagePartChange = TWebSocketSSRClientMessage & {
  partIdx: number
  partId: string
  partCount: number
}

/**
 * @group Client
 */
export type TWebSocketSSRClientMessageContentChange = TWebSocketSSRClientMessage & {
  partId: string
  canUndo: boolean
  canRedo: boolean
  empty: boolean
  undoStackIndex: number
  possibleUndoCount: number
}

/**
 * @group Client
 */
export type TWebSocketSSRClientMessageExport = TWebSocketSSRClientMessage & {
  partId: string
  exports: TExport
}

/**
 * @group Client
 */
export type TUpdatePatchType =
  | "REPLACE_ALL"
  | "REMOVE_ELEMENT"
  | "REPLACE_ELEMENT"
  | "REMOVE_CHILD"
  | "APPEND_CHILD"
  | "INSERT_BEFORE"
  | "REMOVE_ATTRIBUTE"
  | "SET_ATTRIBUTE"

/**
 * @group Client
 */
export type TUpdatePatch = {
  type: TUpdatePatchType
}

/**
 * @group Client
 */
export type TUpdatePatchReplaceAll = TUpdatePatch & {
  type: "REPLACE_ALL"
  svg: string
}

/**
 * @group Client
 */
export type TUpdatePatchReplaceELement = TUpdatePatch & {
  type: "REPLACE_ELEMENT"
  id: string
  svg: string
}

/**
 * @group Client
 */
export type TUpdatePatchInsertBefore = TUpdatePatch & {
  type: "INSERT_BEFORE"
  refId: string
  svg: string
}

/**
 * @group Client
 */
export type TUpdatePatchRemoveElement = TUpdatePatch & {
  type: "REMOVE_ELEMENT"
  id: string
}

/**
 * @group Client
 */
export type TUpdatePatchAppendChild = TUpdatePatch & {
  type: "APPEND_CHILD"
  parentId?: string
  svg: string
}

/**
 * @group Client
 */
export type TUpdatePatchRemoveChild = TUpdatePatch & {
  type: "REMOVE_CHILD"
  parentId: string
  index: number
}

/**
 * @group Client
 */
export type TUpdatePatchRemoveAttribut = TUpdatePatch & {
  type: "REMOVE_ATTRIBUTE"
  id?: string
  name: string
}

/**
 * @group Client
 */
export type TUpdatePatchSetAttribut = TUpdatePatch & {
  type: "SET_ATTRIBUTE"
  id?: string
  name: string
  value: string
}

/**
 * @group Client
 */
export type TWebSocketSSRClientMessageSVGPatch = TWebSocketSSRClientMessage & {
  updates: TUpdatePatch[]
  layer: "MODEL" | "CAPTURE"
}
