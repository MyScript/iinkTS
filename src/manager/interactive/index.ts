/**
 * @group Manager
 * @summary Interactive Ink managers
 *
 * These managers are used with the InteractiveInkEditor variant (WebSocket API with advanced features).
 * They handle selection, resizing, rotation, text editing, gesture recognition, and more.
 *
 * @remarks
 * All managers in this group work with InteractiveInkEditor and depend on the IIModel (Interactive Ink Model).
 */
export * from "./IIConversionManager"
export * from "./IIMoveManager"
export * from "./IIResizeManager"
export * from "./IIRotationManager"
export * from "./IISelectionManager"
export * from "./IITextManager"
export * from "./IITranslateManager"
export * from "./IIWriterManager"
export * from "./IIGestureManager"
export * from "./IISnapManager"
