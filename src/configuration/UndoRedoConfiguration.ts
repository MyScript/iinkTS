
/**
 * @group Configuration
 */
export type TUndoRedoConfiguration = {
  maxStackSize: number
}

/**
 * @group Event
 */
export const DefaultUndoRedoConfiguration: TUndoRedoConfiguration = {
  maxStackSize: 100
}
