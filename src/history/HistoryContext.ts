/**
 * @group History
 */
export type THistoryContext = {
  canUndo: boolean
  canRedo: boolean
  empty: boolean
  stackIndex: number
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
