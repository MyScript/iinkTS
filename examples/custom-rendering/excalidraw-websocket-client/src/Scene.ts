import { CaptureUpdateAction, newElementWith } from "@excalidraw/excalidraw"
import type { ExcalidrawElement } from "@excalidraw/excalidraw/element/types"
import type { AppState, ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types"

export type TElementPatch = Partial<Pick<ExcalidrawElement, "strokeWidth" | "groupIds">>

type TSceneUpdate = {
  erase?: Iterable<string>
  patches?: Map<string, TElementPatch>
  add?: readonly ExcalidrawElement[]
  selectedIds?: string[]
}

const toSelection = (ids: string[]): AppState["selectedElementIds"] =>
  Object.fromEntries(ids.map(id => [id, true as const]))

/**
 * One scene update, so that one gesture or one conversion is one undo step
 */
export const updateScene = (api: ExcalidrawImperativeAPI, update: TSceneUpdate): void =>
{
  const erase = new Set(update.erase)
  const elements = api.getSceneElementsIncludingDeleted().map(e =>
  {
    if (erase.has(e.id)) return newElementWith(e, { isDeleted: true })
    const patch = update.patches?.get(e.id)
    return patch ? newElementWith(e, patch) : e
  })
  api.updateScene({
    elements: [...elements, ...(update.add ?? [])],
    appState: update.selectedIds ? { selectedElementIds: toSelection(update.selectedIds) } : undefined,
    captureUpdate: CaptureUpdateAction.IMMEDIATELY,
  })
}

/**
 * Recolors strokes to point at them, outside the undo history; returns what puts their colors back
 */
export const highlightStrokes = (api: ExcalidrawImperativeAPI, ids: string[], color: string): (() => void) =>
{
  const targets = new Set(ids)
  const originalColors = new Map<string, string>()
  const recolor = (colorOf: (element: ExcalidrawElement) => string | undefined) => api.updateScene({
    elements: api.getSceneElementsIncludingDeleted().map(e =>
    {
      const strokeColor = colorOf(e)
      return strokeColor === undefined ? e : newElementWith(e, { strokeColor })
    }),
    captureUpdate: CaptureUpdateAction.NEVER,
  })
  recolor(e =>
  {
    if (!targets.has(e.id)) return
    originalColors.set(e.id, e.strokeColor)
    return color
  })
  return () => recolor(e => originalColors.get(e.id))
}
