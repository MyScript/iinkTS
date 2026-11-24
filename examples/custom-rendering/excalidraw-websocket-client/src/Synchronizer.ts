import type { ExcalidrawElement, ExcalidrawFreeDrawElement } from "@excalidraw/excalidraw/element/types"
import type { AppState } from "@excalidraw/excalidraw/types"
import type { TRecognitionStroke, WebSocketClient } from "iink-ts"
import { geometrySignature, isFreeDraw, POINT_INTERVAL_MS, toRecognitionStroke } from "./FreeDrawStroke"

/**
 * A multi-selection move emits one change per frame; the batch gathers what one frame emitted
 */
const BATCH_DELAY_MS = 10

type TSentStroke = { signature: string, creationTime: number }

type TStrokeDiff = {
  added: ExcalidrawFreeDrawElement[]
  replaced: ExcalidrawFreeDrawElement[]
  erased: string[]
}

/**
 * Excalidraw only hands over the whole scene on each change: the diff against what the recognizer
 * already has is computed here
 */
export class Synchronizer
{
  onError?: (error: Error) => void
  /** Resolves whether a lone new stroke was applied as a gesture on converted content */
  applyGesture?: (stroke: TRecognitionStroke) => Promise<boolean>

  private sent = new Map<string, TSentStroke>()
  private latestElements: readonly ExcalidrawElement[] = []
  private batchTimer?: ReturnType<typeof setTimeout>
  private queue: Promise<void> = Promise.resolve()

  constructor(private readonly client: WebSocketClient) { }

  /**
   * Nothing is sent while a stroke is drawn or a selection is dragged, resized or rotated:
   * the change that ends the interaction carries the final geometry
   */
  onChange(elements: readonly ExcalidrawElement[], appState: AppState): void
  {
    if (appState.newElement || appState.selectedElementsAreBeingDragged || appState.isResizing || appState.isRotating) return
    this.latestElements = elements
    clearTimeout(this.batchTimer)
    this.batchTimer = setTimeout(() => this.flush(), BATCH_DELAY_MS)
  }

  private diff(): TStrokeDiff
  {
    const live = this.latestElements.filter(isFreeDraw).filter(e => !e.isDeleted)
    const liveIds = new Set(live.map(e => e.id))
    return {
      added: live.filter(e => !this.sent.has(e.id)),
      replaced: live.filter(e => this.hasMoved(e)),
      erased: [...this.sent.keys()].filter(id => !liveIds.has(id)),
    }
  }

  private hasMoved(element: ExcalidrawFreeDrawElement): boolean
  {
    const sent = this.sent.get(element.id)
    return !!sent && sent.signature !== geometrySignature(element)
  }

  private markSent(element: ExcalidrawFreeDrawElement): void
  {
    // A stroke is first seen once drawn: its synthesized points must end now, not start now,
    // or a long stroke overlaps in time the gesture drawn right after it
    const creationTime = this.sent.get(element.id)?.creationTime
      ?? Date.now() - (element.points.length - 1) * POINT_INTERVAL_MS
    this.sent.set(element.id, { signature: geometrySignature(element), creationTime })
  }

  private toStrokes(elements: ExcalidrawFreeDrawElement[])
  {
    return elements.map(e => toRecognitionStroke(e, this.sent.get(e.id)?.creationTime ?? Date.now()))
  }

  private flush(): void
  {
    const { added, replaced, erased } = this.diff()
    erased.forEach(id => this.sent.delete(id))
    added.forEach(e => this.markSent(e))
    replaced.forEach(e => this.markSent(e))

    // Chained so the server receives the operations in the order the scene produced them
    this.queue = this.queue
      .then(async () =>
      {
        if (erased.length) await this.client.eraseStrokes(erased)
        if (replaced.length) await this.client.replaceStrokes(replaced.map(e => e.id), this.toStrokes(replaced))
        if (added.length) await this.addStrokes(this.toStrokes(added))
      })
      .catch(error => this.onError?.(error instanceof Error ? error : new Error(String(error))))
  }

  /**
   * A gesture is always a single stroke, drawn on its own. One already applied on converted content
   * is still sent, so the server keeps the same strokes as the scene until its erasure follows
   */
  private async addStrokes(strokes: TRecognitionStroke[]): Promise<void>
  {
    const isAppliedGesture = strokes.length === 1 && !!(await this.applyGesture?.(strokes[0]))
    await this.client.addStrokes(strokes, strokes.length === 1 && !isAppliedGesture)
  }

  /**
   * Sends what is still batched and resolves once the recognizer has everything, so an export
   * made afterwards reflects the whole scene
   */
  settle(): Promise<void>
  {
    clearTimeout(this.batchTimer)
    this.flush()
    return this.queue
  }

  destroy(): void
  {
    clearTimeout(this.batchTimer)
  }
}
