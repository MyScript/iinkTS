import { describe, test, expect, beforeEach, afterEach, jest } from "@jest/globals"

import { createCanvasMock, asCanvas } from "../../__mocks__/createCanvasMock"
import { IIPlaybackManager } from "@/iink"
import type { TStroke, TPartialDeep } from "@/iink"

function buildPartialStroke(startT: number, pointCount = 3): TPartialDeep<TStroke> {
  return {
    pointers: Array.from({ length: pointCount }, (_, i) => ({
      x: i * 10,
      y: i * 10,
      t: startT + i * 15,
      p: 0.5,
    })),
  }
}

describe("IIPlaybackManager.ts", () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.clearAllTimers()
    jest.useRealTimers()
  })

  test("should instanciate idle with empty progress", () => {
    const canvas = createCanvasMock()
    const manager = new IIPlaybackManager(asCanvas(canvas))
    expect(manager.state).toEqual("idle")
    expect(manager.progress).toEqual({ current: 0, total: 0 })
  })

  test("should call onEnd immediately when strokes is empty", () => {
    const canvas = createCanvasMock()
    const manager = new IIPlaybackManager(asCanvas(canvas))
    const onEnd = jest.fn()
    manager.onEnd = onEnd

    manager.play([])

    expect(onEnd).toHaveBeenCalledTimes(1)
    expect(canvas.writer.start).not.toHaveBeenCalled()
  })

  test("should drive writer.start/continue/end point by point in order", () => {
    const canvas = createCanvasMock()
    const manager = new IIPlaybackManager(asCanvas(canvas))
    const onProgress = jest.fn()
    const onEnd = jest.fn()
    manager.onProgress = onProgress
    manager.onEnd = onEnd

    const strokeA = buildPartialStroke(1000, 3) // points at 1000, 1015, 1030
    const strokeB = buildPartialStroke(1100, 2) // points at 1100, 1115

    manager.play([strokeB, strokeA]) // out of order on purpose

    expect(manager.state).toEqual("playing")
    expect(canvas.writer.start).not.toHaveBeenCalled()

    jest.advanceTimersByTime(0) // strokeA point 0 (offset 0)
    expect(canvas.writer.start).toHaveBeenCalledTimes(1)
    expect(canvas.writer.continue).not.toHaveBeenCalled()

    jest.advanceTimersByTime(15) // strokeA point 1 (offset 15)
    expect(canvas.writer.continue).toHaveBeenCalledTimes(1)

    jest.advanceTimersByTime(15) // strokeA point 2 (offset 30) — last of stroke A
    expect(canvas.writer.end).toHaveBeenCalledTimes(1)
    expect(onProgress).toHaveBeenNthCalledWith(1, 1, 2)

    jest.advanceTimersByTime(70) // strokeB point 0 (offset 100) — new start
    expect(canvas.writer.start).toHaveBeenCalledTimes(2)

    jest.advanceTimersByTime(15) // strokeB point 1 (offset 115) — last of stroke B
    expect(canvas.writer.end).toHaveBeenCalledTimes(2)
    expect(onProgress).toHaveBeenNthCalledWith(2, 2, 2)
    expect(onEnd).toHaveBeenCalledTimes(1)
    expect(manager.state).toEqual("idle")
  })

  test("should start then end immediately for a single-point stroke", () => {
    const canvas = createCanvasMock()
    const manager = new IIPlaybackManager(asCanvas(canvas))

    manager.play([buildPartialStroke(0, 1)])
    jest.advanceTimersByTime(0)

    expect(canvas.writer.start).toHaveBeenCalledTimes(1)
    expect(canvas.writer.end).toHaveBeenCalledTimes(1)
    expect(canvas.writer.continue).not.toHaveBeenCalled()
  })

  test("should scale delays down when speed > 1", () => {
    const canvas = createCanvasMock()
    const manager = new IIPlaybackManager(asCanvas(canvas))

    manager.play([buildPartialStroke(0, 2), buildPartialStroke(200, 2)], 2)

    jest.advanceTimersByTime(0)
    expect(canvas.writer.start).toHaveBeenCalledTimes(1)

    jest.advanceTimersByTime(99) // (200-15)/2 = 92.5ms remaining after first stroke's points
    jest.advanceTimersByTime(1)
    expect(canvas.writer.start).toHaveBeenCalledTimes(2)
  })

  test("should stop scheduling further points on pause and resume from there", () => {
    const canvas = createCanvasMock()
    const manager = new IIPlaybackManager(asCanvas(canvas))
    const onStateChange = jest.fn()
    manager.onStateChange = onStateChange

    manager.play([buildPartialStroke(0, 2), buildPartialStroke(500, 2)])
    jest.advanceTimersByTime(0)
    expect(canvas.writer.start).toHaveBeenCalledTimes(1)

    jest.advanceTimersByTime(100)
    manager.pause()
    expect(manager.state).toEqual("paused")
    expect(onStateChange).toHaveBeenCalledWith("paused")

    jest.advanceTimersByTime(2000)
    expect(canvas.writer.start).toHaveBeenCalledTimes(1) // no new stroke started while paused

    manager.resume()
    expect(manager.state).toEqual("playing")
    jest.advanceTimersByTime(2000)
    expect(canvas.writer.start).toHaveBeenCalledTimes(2)
  })

  test("should reset progress, clear pending timers, and finalize a mid-stroke on stop", () => {
    const canvas = createCanvasMock()
    const manager = new IIPlaybackManager(asCanvas(canvas))

    manager.play([buildPartialStroke(0, 3), buildPartialStroke(500, 2)])
    jest.advanceTimersByTime(0)
    expect(canvas.writer.start).toHaveBeenCalledTimes(1)
    expect(canvas.writer.end).not.toHaveBeenCalled()

    manager.stop()
    expect(manager.state).toEqual("idle")
    expect(manager.progress).toEqual({ current: 0, total: 0 })
    expect(canvas.writer.end).toHaveBeenCalledTimes(1) // mid-stroke finalized

    jest.advanceTimersByTime(2000)
    expect(canvas.writer.start).toHaveBeenCalledTimes(1) // second stroke never fires
  })

  test("should reschedule remaining points when speed changes mid-playback", () => {
    const canvas = createCanvasMock()
    const manager = new IIPlaybackManager(asCanvas(canvas))

    manager.play([buildPartialStroke(0, 2), buildPartialStroke(1000, 2)])
    jest.advanceTimersByTime(0)
    expect(canvas.writer.start).toHaveBeenCalledTimes(1)

    manager.setSpeed(10) // second stroke offset 1000ms at 1x -> 100ms at 10x
    jest.advanceTimersByTime(99)
    expect(canvas.writer.start).toHaveBeenCalledTimes(1)
    jest.advanceTimersByTime(1)
    expect(canvas.writer.start).toHaveBeenCalledTimes(2)
  })

  test("should no-op pause/resume when not applicable", () => {
    const canvas = createCanvasMock()
    const manager = new IIPlaybackManager(asCanvas(canvas))
    const onStateChange = jest.fn()
    manager.onStateChange = onStateChange

    manager.pause() // idle, nothing to pause
    manager.resume() // idle, nothing to resume
    expect(onStateChange).not.toHaveBeenCalled()
    expect(manager.state).toEqual("idle")
  })

  test("should clear pending timers on destroy", () => {
    const canvas = createCanvasMock()
    const manager = new IIPlaybackManager(asCanvas(canvas))

    manager.play([buildPartialStroke(0, 2), buildPartialStroke(500, 2)])
    jest.advanceTimersByTime(0)
    expect(canvas.writer.start).toHaveBeenCalledTimes(1)

    manager.destroy()
    jest.advanceTimersByTime(2000)
    expect(canvas.writer.start).toHaveBeenCalledTimes(1)
  })

  describe("blocking real user pointer input during playback (via canvas.readOnly)", () => {
    test("should set canvas.readOnly once playback starts", () => {
      const canvas = createCanvasMock()
      const manager = new IIPlaybackManager(asCanvas(canvas))

      expect(canvas.readOnly).toBe(false)
      manager.play([buildPartialStroke(0, 2)])
      expect(canvas.readOnly).toBe(true)
    })

    test("should clear canvas.readOnly on immediate pause (not mid-stroke)", () => {
      const canvas = createCanvasMock()
      const manager = new IIPlaybackManager(asCanvas(canvas))

      manager.play([buildPartialStroke(0, 2), buildPartialStroke(500, 2)])
      jest.advanceTimersByTime(15) // first stroke fully fired (start + end), idle between strokes
      manager.pause()

      expect(canvas.readOnly).toBe(false)
    })

    test("should keep canvas.readOnly set until a mid-stroke pause request completes, then clear it", () => {
      const canvas = createCanvasMock()
      const manager = new IIPlaybackManager(asCanvas(canvas))

      manager.play([buildPartialStroke(0, 3), buildPartialStroke(500, 2)])
      jest.advanceTimersByTime(0) // stroke's first point only - mid-stroke
      manager.pause() // deferred: stroke still in progress

      expect(canvas.readOnly).toBe(true)

      jest.advanceTimersByTime(30) // remaining points of the stroke fire, completing it
      expect(canvas.readOnly).toBe(false)
    })

    test("should set canvas.readOnly again on resume", () => {
      const canvas = createCanvasMock()
      const manager = new IIPlaybackManager(asCanvas(canvas))

      manager.play([buildPartialStroke(0, 2), buildPartialStroke(500, 2)])
      jest.advanceTimersByTime(15)
      manager.pause()
      expect(canvas.readOnly).toBe(false)

      manager.resume()
      expect(canvas.readOnly).toBe(true)
    })

    test("should clear canvas.readOnly once playback ends naturally", () => {
      const canvas = createCanvasMock()
      const manager = new IIPlaybackManager(asCanvas(canvas))

      manager.play([buildPartialStroke(0, 2)])
      jest.advanceTimersByTime(15)

      expect(manager.state).toEqual("idle")
      expect(canvas.readOnly).toBe(false)
    })

    test("should clear canvas.readOnly on stop", () => {
      const canvas = createCanvasMock()
      const manager = new IIPlaybackManager(asCanvas(canvas))

      manager.play([buildPartialStroke(0, 2), buildPartialStroke(500, 2)])
      jest.advanceTimersByTime(0)
      manager.stop()

      expect(canvas.readOnly).toBe(false)
    })

    test("should clear canvas.readOnly on destroy", () => {
      const canvas = createCanvasMock()
      const manager = new IIPlaybackManager(asCanvas(canvas))

      manager.play([buildPartialStroke(0, 2), buildPartialStroke(500, 2)])
      jest.advanceTimersByTime(0)
      manager.destroy()

      expect(canvas.readOnly).toBe(false)
    })
  })
})
