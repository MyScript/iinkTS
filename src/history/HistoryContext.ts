/**
 * @group History
 */
export type THistoryContext = {
  canUndo: boolean
  canRedo: boolean
  empty: boolean
  stackIndex: number
  /** @remarks number of steps currently available to undo. For local canvas variants this equals `stackIndex`; for the SSR canvas variant it is populated from the backend `contentChanged` message instead, since the server is the source of truth for the undo stack. */
  possibleUndoCount: number
}

/**
 * @group History
 */
export const getInitialHistoryContext = (): THistoryContext => {
  return {
    stackIndex: 0,
    possibleUndoCount: 0,
    canRedo: false,
    canUndo: false,
    empty: true,
  }
}
