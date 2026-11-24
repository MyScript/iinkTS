/**
 * Every label ever passed to `startOperation`/`endOperation`/`trackOperation` (shown on the
 * canvas state badge tooltip). `Writing`/`Translating`/`Resizing`/`Rotating` additionally
 * identify an in-progress user gesture — see {@link GESTURE_OPERATION_LABELS}.
 * @group Canvas
 */
export type TCanvasOperationLabel =
  | "Recognizing"
  | "Writing"
  | "Translating"
  | "Resizing"
  | "Rotating"
  | "Synchronizing"
  | "Applying gesture"
  | "Converting"
  | "Computing"
  | "Updating variables"
  | "Loading variables"
  | "Evaluating"
  | "Checking"
  | "Exporting"
  | "Importing"
  | "Undoing"
  | "Redoing"
  | "Clearing"
  | "Removing strokes"
