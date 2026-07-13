import type { TGesture } from "@/manager"
import type { TExport } from "@/model"

/**
 * @group Client
 */
export enum TWebSocketClientMessageType {
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
  MathSolverResult = "mathSolverResult",
  Error = "error",
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
  exports: TExport
}

/**
 * @group Client
 */
export type TWebSocketClientMessageGesture = TWebSocketClientMessage<TWebSocketClientMessageType.GestureDetected> &
  TGesture

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
export type TWebSocketClientMessageMathSolverAvailableActions =
  TWebSocketClientMessage<TWebSocketClientMessageType.MathSolverResult> & {
    blockId: string
    action: "available-actions"
    result: string[]
  }

/**
 * @group Client
 */
export type TWebSocketClientMessageMathSolverGetDiagnostic =
  TWebSocketClientMessage<TWebSocketClientMessageType.MathSolverResult> & {
    blockId: string
    action: "get-diagnostic"
    result: string
  }

/**
 * @group Client
 */
export type TWebSocketClientMessageMathSolverNumericalComputation =
  TWebSocketClientMessage<TWebSocketClientMessageType.MathSolverResult> & {
    blockId: string
    action: "numerical-computation"
    result: string
  }

/**
 * @group Client
 */
export type TWebSocketClientMessageMathSolverGetVariables =
  TWebSocketClientMessage<TWebSocketClientMessageType.MathSolverResult> & {
    blockId: string
    action: "get-variables"
    result: TMathVariable[]
  }

/**
 * @group Client
 */
export type TWebSocketClientMessageMathSolverSetVariableValue =
  TWebSocketClientMessage<TWebSocketClientMessageType.MathSolverResult> & {
    blockId: string
    action: "set-variable-value"
    result?: undefined
  }

/**
 * @group Client
 */
export type TWebSocketClientMessageMathSolverGetVariableValue =
  TWebSocketClientMessage<TWebSocketClientMessageType.MathSolverResult> & {
    blockId: string
    action: "get-variable-value"
    result: number
  }

/**
 * @group Client
 */
export type TWebSocketClientMessageMathSolverGetEvaluables =
  TWebSocketClientMessage<TWebSocketClientMessageType.MathSolverResult> & {
    blockId: string
    action: "get-evaluables"
    result: TMathEvaluable[]
  }

/**
 * @group Client
 */
export type TWebSocketClientMessageMathSolverEvaluate =
  TWebSocketClientMessage<TWebSocketClientMessageType.MathSolverResult> & {
    blockId: string
    action: "evaluate"
    result: number[][]
  }

/**
 * @group Client
 */
export type TWebSocketClientMessageMathSolverRemoveVariableValue =
  TWebSocketClientMessage<TWebSocketClientMessageType.MathSolverResult> & {
    blockId: string
    action: "remove-variable-value"
    result?: undefined
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
export type TWebSocketClientMessageMathSolverAsVariableDefinition =
  TWebSocketClientMessage<TWebSocketClientMessageType.MathSolverResult> & {
    blockId: string
    action: "as-variable-definition"
    result: TMathVariableDefinition
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
 */
export type TWebSocketClientMessageMathSolverGetVariableDefinitions =
  TWebSocketClientMessage<TWebSocketClientMessageType.MathSolverResult> & {
    action: "get-variable-definitions"
    result: TMathVariableDefinitions[]
  }

/**
 * @group Client
 */
export type TWebSocketClientMessageMathSolverResult =
  | TWebSocketClientMessageMathSolverAvailableActions
  | TWebSocketClientMessageMathSolverGetDiagnostic
  | TWebSocketClientMessageMathSolverNumericalComputation
  | TWebSocketClientMessageMathSolverGetVariables
  | TWebSocketClientMessageMathSolverSetVariableValue
  | TWebSocketClientMessageMathSolverGetVariableValue
  | TWebSocketClientMessageMathSolverGetEvaluables
  | TWebSocketClientMessageMathSolverRemoveVariableValue
  | TWebSocketClientMessageMathSolverAsVariableDefinition
  | TWebSocketClientMessageMathSolverGetVariableDefinitions
  | TWebSocketClientMessageMathSolverEvaluate

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
export type TWebSocketClientMessageReceived =
  | TWebSocketClientMessageAuthenticated
  | TWebSocketClientMessageHMACChallenge
  | TInteractiveInkSessionDescriptionMessage
  | TWebSocketClientMessageNewPart
  | TWebSocketClientMessagePartChange
  | TWebSocketClientMessageContentChange
  | TWebSocketClientMessageExport
  | TWebSocketClientMessageGesture
  | TWebSocketClientMessageContextlessGesture
  | TWebSocketClientMessagePong
  | TWebSocketClientMessageIdle
  | TWebSocketClientMessageMathSolverResult
  | TWebSocketClientMessageError
