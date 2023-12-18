
/**
 * @group Configuration
 */
export type TUndoRedoConfiguration = {
  maxStackSize: number
}

/**
 * @group Configuration
 */
export const DefaultUndoRedoConfiguration: TUndoRedoConfiguration = {
  maxStackSize: 100
}
