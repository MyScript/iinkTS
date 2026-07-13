import { describe, test, expect, beforeEach, afterEach, jest } from "@jest/globals"

import { createCanvasMock, asEditor } from "../../__mocks__/createCanvasMock"
import { IIPlaybackManager } from "@/manager/interactive/IIPlaybackManager"
import type { TStroke } from "@/symbol"
import type { TPartialDeep } from "@/utils"

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
    const editor = createCanvasMock()
    const manager = new IIPlaybackManager(asEditor(editor))
    expect(manager.state).toEqual("idle")
    expect(manager.progress).toEqual({ current: 0, total: 0 })
  })

  test("should call onEnd immediately when strokes is empty", () => {
    const editor = createCanvasMock()
    const manager = new IIPlaybackManager(asEditor(editor))
    const onEnd = jest.fn()
    manager.onEnd = onEnd

    manager.play([])

    expect(onEnd).toHaveBeenCalledTimes(1)
    expect(editor.writer.start).not.toHaveBeenCalled()
  })

  test("should drive writer.start/continue/end point by point in order", () => {
    const editor = createCanvasMock()
    const manager = new IIPlaybackManager(asEditor(editor))
    const onProgress = jest.fn()
    const onEnd = jest.fn()
    manager.onProgress = onProgress
    manager.onEnd = onEnd

    const strokeA = buildPartialStroke(1000, 3) // points at 1000, 1015, 1030
    const strokeB = buildPartialStroke(1100, 2) // points at 1100, 1115

    manager.play([strokeB, strokeA]) // out of order on purpose

    expect(manager.state).toEqual("playing")
    expect(editor.writer.start).not.toHaveBeenCalled()

    jest.advanceTimersByTime(0) // strokeA point 0 (offset 0)
    expect(editor.writer.start).toHaveBeenCalledTimes(1)
    expect(editor.writer.continue).not.toHaveBeenCalled()

    jest.advanceTimersByTime(15) // strokeA point 1 (offset 15)
    expect(editor.writer.continue).toHaveBeenCalledTimes(1)

    jest.advanceTimersByTime(15) // strokeA point 2 (offset 30) — last of stroke A
    expect(editor.writer.end).toHaveBeenCalledTimes(1)
    expect(onProgress).toHaveBeenNthCalledWith(1, 1, 2)

    jest.advanceTimersByTime(70) // strokeB point 0 (offset 100) — new start
    expect(editor.writer.start).toHaveBeenCalledTimes(2)

    jest.advanceTimersByTime(15) // strokeB point 1 (offset 115) — last of stroke B
    expect(editor.writer.end).toHaveBeenCalledTimes(2)
    expect(onProgress).toHaveBeenNthCalledWith(2, 2, 2)
    expect(onEnd).toHaveBeenCalledTimes(1)
    expect(manager.state).toEqual("idle")
  })

  test("should start then end immediately for a single-point stroke", () => {
    const editor = createCanvasMock()
    const manager = new IIPlaybackManager(asEditor(editor))

    manager.play([buildPartialStroke(0, 1)])
    jest.advanceTimersByTime(0)

    expect(editor.writer.start).toHaveBeenCalledTimes(1)
    expect(editor.writer.end).toHaveBeenCalledTimes(1)
    expect(editor.writer.continue).not.toHaveBeenCalled()
  })

  test("should scale delays down when speed > 1", () => {
    const editor = createCanvasMock()
    const manager = new IIPlaybackManager(asEditor(editor))

    manager.play([buildPartialStroke(0, 2), buildPartialStroke(200, 2)], 2)

    jest.advanceTimersByTime(0)
    expect(editor.writer.start).toHaveBeenCalledTimes(1)

    jest.advanceTimersByTime(99) // (200-15)/2 = 92.5ms remaining after first stroke's points
    jest.advanceTimersByTime(1)
    expect(editor.writer.start).toHaveBeenCalledTimes(2)
  })

  test("should stop scheduling further points on pause and resume from there", () => {
    const editor = createCanvasMock()
    const manager = new IIPlaybackManager(asEditor(editor))
    const onStateChange = jest.fn()
    manager.onStateChange = onStateChange

    manager.play([buildPartialStroke(0, 2), buildPartialStroke(500, 2)])
    jest.advanceTimersByTime(0)
    expect(editor.writer.start).toHaveBeenCalledTimes(1)

    jest.advanceTimersByTime(100)
    manager.pause()
    expect(manager.state).toEqual("paused")
    expect(onStateChange).toHaveBeenCalledWith("paused")

    jest.advanceTimersByTime(2000)
    expect(editor.writer.start).toHaveBeenCalledTimes(1) // no new stroke started while paused

    manager.resume()
    expect(manager.state).toEqual("playing")
    jest.advanceTimersByTime(2000)
    expect(editor.writer.start).toHaveBeenCalledTimes(2)
  })

  test("should reset progress, clear pending timers, and finalize a mid-stroke on stop", () => {
    const editor = createCanvasMock()
    const manager = new IIPlaybackManager(asEditor(editor))

    manager.play([buildPartialStroke(0, 3), buildPartialStroke(500, 2)])
    jest.advanceTimersByTime(0)
    expect(editor.writer.start).toHaveBeenCalledTimes(1)
    expect(editor.writer.end).not.toHaveBeenCalled()

    manager.stop()
    expect(manager.state).toEqual("idle")
    expect(manager.progress).toEqual({ current: 0, total: 0 })
    expect(editor.writer.end).toHaveBeenCalledTimes(1) // mid-stroke finalized

    jest.advanceTimersByTime(2000)
    expect(editor.writer.start).toHaveBeenCalledTimes(1) // second stroke never fires
  })

  test("should reschedule remaining points when speed changes mid-playback", () => {
    const editor = createCanvasMock()
    const manager = new IIPlaybackManager(asEditor(editor))

    manager.play([buildPartialStroke(0, 2), buildPartialStroke(1000, 2)])
    jest.advanceTimersByTime(0)
    expect(editor.writer.start).toHaveBeenCalledTimes(1)

    manager.setSpeed(10) // second stroke offset 1000ms at 1x -> 100ms at 10x
    jest.advanceTimersByTime(99)
    expect(editor.writer.start).toHaveBeenCalledTimes(1)
    jest.advanceTimersByTime(1)
    expect(editor.writer.start).toHaveBeenCalledTimes(2)
  })

  test("should no-op pause/resume when not applicable", () => {
    const editor = createCanvasMock()
    const manager = new IIPlaybackManager(asEditor(editor))
    const onStateChange = jest.fn()
    manager.onStateChange = onStateChange

    manager.pause() // idle, nothing to pause
    manager.resume() // idle, nothing to resume
    expect(onStateChange).not.toHaveBeenCalled()
    expect(manager.state).toEqual("idle")
  })

  test("should clear pending timers on destroy", () => {
    const editor = createCanvasMock()
    const manager = new IIPlaybackManager(asEditor(editor))

    manager.play([buildPartialStroke(0, 2), buildPartialStroke(500, 2)])
    jest.advanceTimersByTime(0)
    expect(editor.writer.start).toHaveBeenCalledTimes(1)

    manager.destroy()
    jest.advanceTimersByTime(2000)
    expect(editor.writer.start).toHaveBeenCalledTimes(1)
  })
})
