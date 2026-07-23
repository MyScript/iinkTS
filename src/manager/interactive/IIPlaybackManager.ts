import type { TInteractiveInkCanvas } from "@/canvas/TInteractiveInkCanvas"
import type { TPointerInfo } from "@/grabber"
import { LoggerCategory } from "@/logger"
import type { TPointer, TStroke } from "@/symbol"
import type { TPartialDeep } from "@/utils"

import { IIAbstractManager } from "./IIAbstractManager"

/**
 * @group Manager
 */
export type TPlaybackState = "idle" | "playing" | "paused"

/**
 * @hidden
 */
type TScheduledPoint = {
  /** Timeline offset (ms, unscaled) relative to the first point of the first stroke. */
  offset: number
  point: TPointer
  isFirstOfStroke: boolean
  isLastOfStroke: boolean
}

/**
 * Replays a recorded set of strokes on the canvas, point by point, honoring
 * their original relative timing (roadmap: Stroke Playback / Animation).
 *
 * Each point is fed to `canvas.writer` (`start`/`continue`/`end`) at the
 * moment it was originally recorded (scaled by `speed`), so ink appears to
 * be drawn progressively rather than strokes popping in fully formed.
 * Play / pause / resume / stop and live speed changes are supported.
 *
 * @group Manager
 */
export class IIPlaybackManager extends IIAbstractManager {
  protected managerName = "IIPlaybackManager"

  /** Called after each stroke is completed, with the running count. */
  onProgress?: (current: number, total: number) => void
  /** Called whenever play/pause/resume/stop changes the manager's state. */
  onStateChange?: (state: TPlaybackState) => void
  /** Called once every stroke has been replayed. */
  onEnd?: () => void

  #target = document.createElement("div")
  #schedule: TScheduledPoint[] = []
  #totalStrokes = 0
  #timers: ReturnType<typeof setTimeout>[] = []
  #speed = 1
  #state: TPlaybackState = "idle"
  #firedIndex = 0
  #firedStrokes = 0
  /** True while a stroke has been started but not yet ended (mid-stroke). */
  #strokeInProgress = false
  /** Unscaled timeline position already covered by points fired so far. */
  #elapsedOffset = 0
  /** `performance.now()` when the current run of timers was (re)scheduled. */
  #scheduledAt = 0
  /** `canvas.writer.detectGesture` value to restore once playback pauses/stops/ends. */
  #initialDetectGesture: boolean | null = null
  /** True when `pause()` was called mid-stroke; pause takes effect once that stroke ends. */
  #pauseRequested = false

  constructor(canvas: TInteractiveInkCanvas) {
    super(canvas, LoggerCategory.MANAGER)
  }

  get state(): TPlaybackState {
    return this.#state
  }

  get progress(): { current: number; total: number } {
    return { current: this.#firedStrokes, total: this.#totalStrokes }
  }

  #setState(state: TPlaybackState): void {
    if (this.#state === state) {
      return
    }
    this.#state = state
    this.onStateChange?.(state)
  }

  #clearTimers(): void {
    this.#timers.forEach(clearTimeout)
    this.#timers = []
  }

  /** Disable gesture detection for the duration of playback, remembering the prior value. */
  #disableGestureDetection(): void {
    if (this.#initialDetectGesture === null) {
      this.#initialDetectGesture = this.canvas.writer.detectGesture
      this.canvas.writer.detectGesture = false
    }
  }

  /** Restore `canvas.writer.detectGesture` to its pre-playback value. */
  #restoreGestureDetection(): void {
    if (this.#initialDetectGesture !== null) {
      this.canvas.writer.detectGesture = this.#initialDetectGesture
      this.#initialDetectGesture = null
    }
  }

  #toPointerInfo(point: TPointer, type: string): TPointerInfo {
    return {
      clientX: point.x,
      clientY: point.y,
      isPrimary: true,
      type,
      pointerType: "pen",
      target: this.#target,
      pointer: { x: point.x, y: point.y, t: point.t, p: point.p },
      button: 0,
      buttons: 1,
    }
  }

  #run(): void {
    this.#scheduledAt = performance.now()
    this.#disableGestureDetection()
    this.#setState("playing")
    for (let i = this.#firedIndex; i < this.#schedule.length; i++) {
      const entry = this.#schedule[i]
      const remainingOffset = entry.offset - this.#elapsedOffset
      const delay = Math.max(0, remainingOffset / this.#speed)
      this.#timers.push(setTimeout(() => this.#fire(i), delay))
    }
  }

  #fire(index: number): void {
    const entry = this.#schedule[index]
    if (entry.isFirstOfStroke) {
      this.canvas.writer.start(this.#toPointerInfo(entry.point, "pointerdown"))
      this.#strokeInProgress = true
    }
    if (entry.isLastOfStroke) {
      Promise.resolve(this.canvas.writer.end(this.#toPointerInfo(entry.point, "pointerup"))).catch((error: Error) =>
        this.canvas.manageError(error)
      )
      this.#strokeInProgress = false
    } else if (!entry.isFirstOfStroke) {
      this.canvas.writer.continue(this.#toPointerInfo(entry.point, "pointermove"))
    }

    this.#firedIndex = index + 1
    if (entry.isLastOfStroke) {
      this.#firedStrokes++
      this.onProgress?.(this.#firedStrokes, this.#totalStrokes)
    }
    if (this.#firedIndex === this.#schedule.length) {
      this.#restoreGestureDetection()
      this.#setState("idle")
      this.onEnd?.()
    } else if (this.#pauseRequested && entry.isLastOfStroke) {
      this.#pauseRequested = false
      this.#completePause()
    }
  }

  /** Finalize a stroke left mid-progress (started but not yet ended). */
  #finalizeStrokeInProgress(): void {
    if (!this.#strokeInProgress || this.#firedIndex === 0) {
      return
    }
    const lastFired = this.#schedule[this.#firedIndex - 1]
    Promise.resolve(this.canvas.writer.end(this.#toPointerInfo(lastFired.point, "pointerup"))).catch((error: Error) =>
      this.canvas.manageError(error)
    )
    this.#strokeInProgress = false
  }

  /** Stop scheduling further points and switch to `paused` (or `idle` if nothing is left). */
  #completePause(): void {
    this.#elapsedOffset += (performance.now() - this.#scheduledAt) * this.#speed
    this.#clearTimers()
    this.#restoreGestureDetection()
    if (this.#firedIndex === this.#schedule.length) {
      this.#setState("idle")
      this.onEnd?.()
      return
    }
    this.#setState("paused")
  }

  /**
   * Start replaying `strokes` in order of their first point's timestamp.
   * Stops any run already in progress.
   * @param strokes - Recorded strokes to replay (same shape as `importPointEvents`).
   * @param speed - Playback speed multiplier (1 = original timing, 2 = twice as fast).
   */
  play(strokes: TPartialDeep<TStroke>[], speed = 1): void {
    this.logger.info("play", { count: strokes.length, speed })
    this.stop()
    this.#speed = speed
    if (strokes.length === 0) {
      this.onEnd?.()
      return
    }
    const sortedStrokes = [...strokes].sort((a, b) => (a.pointers?.[0]?.t ?? 0) - (b.pointers?.[0]?.t ?? 0))
    const t0 = sortedStrokes[0].pointers?.[0]?.t ?? 0

    this.#schedule = sortedStrokes.flatMap((stroke) => {
      const points = (stroke.pointers ?? []).filter(
        (p): p is TPointer => p?.x !== undefined && p?.y !== undefined && p?.t !== undefined && p?.p !== undefined
      )
      return points.map((point, i) => ({
        offset: point.t - t0,
        point,
        isFirstOfStroke: i === 0,
        isLastOfStroke: i === points.length - 1,
      }))
    })
    this.#totalStrokes = sortedStrokes.length
    this.#firedIndex = 0
    this.#firedStrokes = 0
    this.#elapsedOffset = 0
    this.#strokeInProgress = false
    this.#pauseRequested = false
    this.#run()
  }

  /**
   * Pause playback, preserving progress so `resume()` continues from here.
   * If a stroke is mid-progress, pause is deferred until that stroke completes
   * naturally - it is never cut short.
   */
  pause(): void {
    if (this.#state !== "playing") {
      return
    }
    if (this.#strokeInProgress) {
      this.#pauseRequested = true
      return
    }
    this.#completePause()
  }

  /** Resume playback from where it was paused. */
  resume(): void {
    if (this.#state !== "paused") {
      return
    }
    this.#run()
  }

  /** Stop playback and reset progress. Already-replayed strokes remain on the canvas. */
  stop(): void {
    this.#clearTimers()
    this.#finalizeStrokeInProgress()
    this.#restoreGestureDetection()
    this.#schedule = []
    this.#totalStrokes = 0
    this.#firedIndex = 0
    this.#firedStrokes = 0
    this.#elapsedOffset = 0
    this.#pauseRequested = false
    this.#setState("idle")
  }

  /**
   * Change the playback speed. If currently playing, remaining points are
   * rescheduled immediately at the new speed without losing progress.
   */
  setSpeed(speed: number): void {
    if (this.#state === "playing") {
      this.#elapsedOffset += (performance.now() - this.#scheduledAt) * this.#speed
      this.#clearTimers()
      this.#speed = speed
      this.#run()
    } else {
      this.#speed = speed
    }
  }

  protected onDestroy(): void {
    this.#clearTimers()
    this.#restoreGestureDetection()
  }
}
