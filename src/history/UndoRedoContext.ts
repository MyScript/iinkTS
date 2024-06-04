/**
 * @group History
 */
export type TUndoRedoContext = {
  canUndo: boolean
  canRedo: boolean
  empty: boolean
  stackIndex: number
  possibleUndoCount: number
}

/**
 * @group History
 */
export const getInitialUndoRedoContext = (): TUndoRedoContext => {
  return {
    stackIndex: 0,
    possibleUndoCount: 0,
    canRedo: false,
    canUndo: false,
    empty: true,
  }
}
