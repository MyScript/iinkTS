import type { THistoryContext } from "@/history"

import type { TExportWire } from "../jiix/JIIX"

/**
 * @group Client
 * @summary List all authorized gestures
 */
export type TGestureType = "UNDERLINE" | "SCRATCH" | "JOIN" | "INSERT" | "STRIKETHROUGH" | "SURROUND"

/**
 * @group Client
 * @remarks
 *  when gestureType = "INSERT", subStrokes represent the two parts
 *  when gestureType = "SCRATCH", subStrokes represent the part to substract at the stroke corresponding fullStrokeId
 */
export type TGesture = {
  gestureType: TGestureType
  gestureStrokeId: string
  strokeIds: string[]
  strokeBeforeIds: string[]
  strokeAfterIds: string[]
  subStrokes?: {
    fullStrokeId: string
    x: number[]
    y: number[]
  }[]
}

/**
 * @group Client
 */
export enum TWebSocketClientMessageType {
  HMAC_Challenge = "hmacChallenge",
  Authenticated = "authenticated",
  SessionDescription = "sessionDescription",
  NewPart = "newPart",
  PartChanged = "partChanged",
  ConfigurationChanged = "configurationChanged",
  ContentChanged = "contentChanged",
  Idle = "idle",
  Pong = "pong",
  Exported = "exported",
  GestureDetected = "gestureDetected",
  ContextlessGesture = "contextlessGesture",
  MathSolverResult = "mathSolverResult",
  Error = "error",
  Ack = "ack",
}

/**
 * @group Client
 */
export type TWebSocketClientMessage<T = string> = {
  type: T
  [key: string]: unknown
}

/**
 * @group Client
 */
export type TWebSocketClientMessageAuthenticated = TWebSocketClientMessage<TWebSocketClientMessageType.Authenticated>

/**
 * @group Client
 */
export type TWebSocketClientMessageHMACChallenge =
  TWebSocketClientMessage<TWebSocketClientMessageType.HMAC_Challenge> & {
    hmacChallenge: string
    iinkSessionId: string
  }

/**
 * @group Client
 */
export type TInteractiveInkSessionDescriptionMessage =
  TWebSocketClientMessage<TWebSocketClientMessageType.SessionDescription> & {
    contentPartCount: number
    iinkSessionId: string
  }

/**
 * @group Client
 */
export type TWebSocketClientMessageNewPart = TWebSocketClientMessage<TWebSocketClientMessageType.NewPart> & {
  id: string
  idx: null
}

/**
 * @group Client
 */
export type TWebSocketClientMessagePartChange = TWebSocketClientMessage<TWebSocketClientMessageType.PartChanged> & {
  partIdx: number
  partId: string
  partCount: number
}

/**
 * @group Client
 */
export type TWebSocketClientMessageContentChange =
  TWebSocketClientMessage<TWebSocketClientMessageType.ContentChanged> & {
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
export type TWebSocketClientMessageExport = TWebSocketClientMessage<TWebSocketClientMessageType.Exported> & {
  partId: string
  exports: TExportWire
}

/**
 * @group Client
 */
export type TWebSocketClientMessageGesture = TWebSocketClientMessage<TWebSocketClientMessageType.GestureDetected> &
  TGesture

/**
 * @group Client
 */
export type TWebSocketClientConfigurationChanged =
  TWebSocketClientMessage<TWebSocketClientMessageType.ConfigurationChanged>

/**
 * @group Client
 */
export type TWebSocketClientMessageContextlessGesture =
  TWebSocketClientMessage<TWebSocketClientMessageType.ContextlessGesture> & {
    gestureType: "none" | "scratch" | "left-right" | "right-left" | "bottom-top" | "top-bottom" | "surround"
    strokeId: string
  }

/**
 * @group Client
 */
export type TWebSocketClientMessagePong = TWebSocketClientMessage<TWebSocketClientMessageType.Pong>

/**
 * @group Client
 */
export type TWebSocketClientMessageIdle = TWebSocketClientMessage<TWebSocketClientMessageType.Idle>

/**
 * @group Client
 */
export type TWebSocketConfigurationCHanged = TWebSocketClientMessage<TWebSocketClientMessageType.ConfigurationChanged>

/**
 * @group Client
 */
export type TMathVariable = {
  name: string
  value?: number
  sourceType?: "UNDEFINED" | "API" | "API_GLOBAL" | "BLOCK" | "PREDEFINED"
  sourceId?: string
  occurrenceCount?: number
}

/**
 * @group Client
 */
export type TMathEvaluable = {
  inputName: string
  outputName: string
}

/**
 * @group Client
 */
export type TMathVariableDefinition = {
  name: string
  value: number
}

/**
 * @group Client
 */
export type TMathVariableDefinitionInfo = {
  value: number
  sourceType: "UNDEFINED" | "API" | "API_GLOBAL" | "BLOCK" | "PREDEFINED"
  blockId: string
}

/**
 * @group Client
 */
export type TMathVariableDefinitions = {
  name: string
  definitions: TMathVariableDefinitionInfo[]
}

/**
 * @group Client
 * @summary `result` of a math solver message, by `action`
 * @remarks Every action of {@link TWebSocketClientMessageMathSolverResult} comes from this map: adding an entry adds the message.
 */
export type TMathSolverResultMap = {
  "available-actions": string[]
  "get-diagnostic": string
  "numerical-computation": string
  "get-variables": TMathVariable[]
  "set-variable-value": undefined
  "get-variable-value": number
  "get-evaluables": TMathEvaluable[]
  "remove-variable-value": undefined
  "as-variable-definition": TMathVariableDefinition
  "get-variable-definitions": TMathVariableDefinitions[]
  evaluate: number[][]
}

/**
 * @group Client
 */
export type TMathSolverAction = keyof TMathSolverResultMap

/**
 * @group Client
 * @summary Math solver message for one action
 * @remarks `result` is optional when the action answers nothing; `get-variable-definitions` is not tied to a block, so it has no `blockId`.
 */
export type TWebSocketClientMessageMathSolver<A extends TMathSolverAction> =
  TWebSocketClientMessage<TWebSocketClientMessageType.MathSolverResult> & {
    action: A
  } & (undefined extends TMathSolverResultMap[A]
      ? { result?: TMathSolverResultMap[A] }
      : { result: TMathSolverResultMap[A] }) &
    (A extends "get-variable-definitions" ? unknown : { blockId: string })

/**
 * @group Client
 */
export type TWebSocketClientMessageMathSolverAvailableActions = TWebSocketClientMessageMathSolver<"available-actions">

/**
 * @group Client
 */
export type TWebSocketClientMessageMathSolverGetDiagnostic = TWebSocketClientMessageMathSolver<"get-diagnostic">

/**
 * @group Client
 */
export type TWebSocketClientMessageMathSolverNumericalComputation =
  TWebSocketClientMessageMathSolver<"numerical-computation">

/**
 * @group Client
 */
export type TWebSocketClientMessageMathSolverGetVariables = TWebSocketClientMessageMathSolver<"get-variables">

/**
 * @group Client
 */
export type TWebSocketClientMessageMathSolverSetVariableValue = TWebSocketClientMessageMathSolver<"set-variable-value">

/**
 * @group Client
 */
export type TWebSocketClientMessageMathSolverGetVariableValue = TWebSocketClientMessageMathSolver<"get-variable-value">

/**
 * @group Client
 */
export type TWebSocketClientMessageMathSolverGetEvaluables = TWebSocketClientMessageMathSolver<"get-evaluables">

/**
 * @group Client
 */
export type TWebSocketClientMessageMathSolverEvaluate = TWebSocketClientMessageMathSolver<"evaluate">

/**
 * @group Client
 */
export type TWebSocketClientMessageMathSolverRemoveVariableValue =
  TWebSocketClientMessageMathSolver<"remove-variable-value">

/**
 * @group Client
 */
export type TWebSocketClientMessageMathSolverAsVariableDefinition =
  TWebSocketClientMessageMathSolver<"as-variable-definition">

/**
 * @group Client
 */
export type TWebSocketClientMessageMathSolverGetVariableDefinitions =
  TWebSocketClientMessageMathSolver<"get-variable-definitions">

/**
 * @group Client
 */
export type TWebSocketClientMessageMathSolverResult = {
  [A in TMathSolverAction]: TWebSocketClientMessageMathSolver<A>
}[TMathSolverAction]

/**
 * @group Client
 */
export type TWebSocketClientMessageError = TWebSocketClientMessage<TWebSocketClientMessageType.Error> & {
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
export type TWebSocketClientMessageAck = TWebSocketClientMessage<TWebSocketClientMessageType.Ack>

/**
 * @group Client
 * @summary Message the server sends, by {@link TWebSocketClientMessageType}
 * @remarks Every member of the enum needs an entry: {@link TWebSocketClientMessageReceived} indexes this map with the whole enum, so a missing one stops compiling.
 */
export type TWebSocketClientMessageReceivedMap = {
  [TWebSocketClientMessageType.HMAC_Challenge]: TWebSocketClientMessageHMACChallenge
  [TWebSocketClientMessageType.Authenticated]: TWebSocketClientMessageAuthenticated
  [TWebSocketClientMessageType.SessionDescription]: TInteractiveInkSessionDescriptionMessage
  [TWebSocketClientMessageType.NewPart]: TWebSocketClientMessageNewPart
  [TWebSocketClientMessageType.PartChanged]: TWebSocketClientMessagePartChange
  [TWebSocketClientMessageType.ContentChanged]: TWebSocketClientMessageContentChange
  [TWebSocketClientMessageType.Idle]: TWebSocketClientMessageIdle
  [TWebSocketClientMessageType.Pong]: TWebSocketClientMessagePong
  [TWebSocketClientMessageType.Exported]: TWebSocketClientMessageExport
  [TWebSocketClientMessageType.GestureDetected]: TWebSocketClientMessageGesture
  [TWebSocketClientMessageType.ContextlessGesture]: TWebSocketClientMessageContextlessGesture
  [TWebSocketClientMessageType.MathSolverResult]: TWebSocketClientMessageMathSolverResult
  [TWebSocketClientMessageType.Error]: TWebSocketClientMessageError
  [TWebSocketClientMessageType.Ack]: TWebSocketClientMessageAck
  [TWebSocketClientMessageType.ConfigurationChanged]: TWebSocketClientConfigurationChanged
}

/**
 * @group Client
 */
export type TWebSocketClientMessageReceived = TWebSocketClientMessageReceivedMap[TWebSocketClientMessageType]

/**
 * @group Client
 * @summary The undo/redo state a `contentChanged` message carries, both websocket protocols alike
 */
export function readHistoryContext(
  message: Pick<
    TWebSocketClientMessageContentChange,
    "canUndo" | "canRedo" | "empty" | "undoStackIndex" | "possibleUndoCount"
  >
): THistoryContext {
  return {
    canUndo: message.canUndo,
    canRedo: message.canRedo,
    empty: message.empty,
    stackIndex: message.undoStackIndex,
    possibleUndoCount: message.possibleUndoCount,
  }
}
