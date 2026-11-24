import type { TCanvasOperationLabel } from "@/canvas"

/**
 * Operation labels that identify an in-progress user gesture (pointer down through pointer up).
 * While any of these is active, synchronizing with the backend should be deferred so it never
 * contends with the gesture for the main thread.
 * @group Canvas
 */
export const GESTURE_OPERATION_LABELS: readonly TCanvasOperationLabel[] = [
  "Writing",
  "Translating",
  "Resizing",
  "Rotating",
] as const
