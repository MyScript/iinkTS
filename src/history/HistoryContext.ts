/**
 * @group History
 */
export type THistoryContext = {
  canUndo: boolean
  canRedo: boolean
  empty: boolean
  stackIndex: number
  /** @remarks populated from the backend `contentChanged` message; only meaningful for the SSR canvas variant, where the server is the source of truth for the undo stack. */
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
