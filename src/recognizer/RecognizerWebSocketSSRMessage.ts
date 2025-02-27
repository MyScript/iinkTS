import { TExport } from "../model"

/**
 * @group Recognizer
 */
export type TRecognizerWebSocketSSRMessage = {
  type: string
  [key: string]: unknown
}

/**
 * @group Recognizer
 */
export type TRecognizerWebSocketSSRMessageError = {
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
export type TRecognizerWebSocketSSRMessageHMACChallenge = TRecognizerWebSocketSSRMessage & {
  hmacChallenge: string
  iinkSessionId: string
}

/**
 * @group Recognizer
 */
export type TRecognizerWebSocketSSRMessageContentPackageDescriptionMessage = TRecognizerWebSocketSSRMessage & {
  contentPartCount: number
}

/**
 * @group Recognizer
 */
export type TRecognizerWebSocketSSRMessagePartChange = TRecognizerWebSocketSSRMessage & {
  partIdx: number
  partId: string
  partCount: number
}

/**
 * @group Recognizer
 */
export type TRecognizerWebSocketSSRMessageContentChange = TRecognizerWebSocketSSRMessage & {
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
export type TRecognizerWebSocketSSRMessageExport = TRecognizerWebSocketSSRMessage & {
  partId: string
  exports: TExport
}

/**
 * @group Recognizer
 */
export type TUpdatePatchType = "REPLACE_ALL" | "REMOVE_ELEMENT" | "REPLACE_ELEMENT" | "REMOVE_CHILD" | "APPEND_CHILD" | "INSERT_BEFORE" | "REMOVE_ATTRIBUTE" | "SET_ATTRIBUTE"

/**
 * @group Recognizer
 */
export type TUpdatePatch = {
  type: TUpdatePatchType
}

/**
 * @group Recognizer
 */
export type TUpdatePatchReplaceAll = TUpdatePatch & {
  type: "REPLACE_ALL",
  svg: string
}

/**
 * @group Recognizer
 */
export type TUpdatePatchReplaceELement = TUpdatePatch & {
  type: "REPLACE_ELEMENT",
  id: string
  svg: string
}

/**
 * @group Recognizer
 */
export type TUpdatePatchInsertBefore = TUpdatePatch & {
  type: "INSERT_BEFORE",
  refId: string
  svg: string
}

/**
 * @group Recognizer
 */
export type TUpdatePatchRemoveElement = TUpdatePatch & {
  type: "REMOVE_ELEMENT",
  id: string
}

/**
 * @group Recognizer
 */
export type TUpdatePatchAppendChild = TUpdatePatch & {
  type: "APPEND_CHILD",
  parentId?: string
  svg: string
}

/**
 * @group Recognizer
 */
export type TUpdatePatchRemoveChild = TUpdatePatch & {
  type: "REMOVE_CHILD",
  parentId: string
  index: number
}

/**
 * @group Recognizer
 */
export type TUpdatePatchRemoveAttribut = TUpdatePatch & {
  type: "REMOVE_ATTRIBUTE",
  id?: string
  name: string
}

/**
 * @group Recognizer
 */
export type TUpdatePatchSetAttribut = TUpdatePatch & {
  type: "SET_ATTRIBUTE",
  id?: string
  name: string
  value: string
}

/**
 * @group Recognizer
 */
export type TRecognizerWebSocketSSRMessageSVGPatch = TRecognizerWebSocketSSRMessage & {
  updates: TUpdatePatch[]
  layer: ("MODEL" | "CAPTURE")
}
