/**
 * The stroke shapes the recognition protocol deals in, and the one conversion between them.
 *
 * Both types are declared here rather than imported from the symbol layer on purpose: the client is
 * meant to be usable on its own, so it owns the shape of what it sends. TypeScript is structural, so
 * a `TStroke` from the symbol layer satisfies {@link TRecognitionStroke} with no import in either
 * direction and no conversion at the call site.
 */

import type { TMatrixTransform } from "@/core"
import { applyMatrixToPoint, isIdentityMatrix, isVersionSuperiorOrEqual } from "@/core"

/**
 * One captured point of a stroke. `x` and `y` are required; `t` and `p` are not, so a caller that
 * builds strokes itself — a custom renderer, an importer — can hand over geometry alone.
 * @group Client
 */
export type TRecognitionPointer = {
  x: number
  y: number
  /**
   * Capture time in milliseconds, counted from the start of the stroke this pointer belongs to —
   * so the first pointer of a stroke sits at 0. {@link toWireStroke} adds the stroke's
   * `creationTime` back on, because the wire carries absolute instants.
   *
   * **Recognition quality depends on it.** The recognizer uses the interval between points to tell
   * a deliberate stroke from a fast one, to segment characters and to resolve ambiguous shapes.
   * Leave it out and recognition still runs, but on geometry alone — expect measurably worse
   * results, especially on cursive text and on shapes drawn in several passes. Supply it whenever
   * the capture source has it, even approximately.
   */
  dt?: number
  /** Pen pressure, 0 to 1. Affects stroke width when rendered; recognition tolerates its absence. */
  p?: number
}

/**
 * What a caller hands the recognizer: an identified sequence of captured pointers, and nothing else.
 * Style, bounds and derived geometry are the document's business, not the server's.
 * @group Client
 */
export type TRecognitionStroke = {
  id: string
  pointerType: string
  pointers: TRecognitionPointer[]
  /**
   * Epoch instant the stroke began — the origin its pointers' {@link TRecognitionPointer.dt} count
   * from, and what {@link toWireStroke} adds back to reach the absolute times the wire carries.
   *
   * The recognizer reads the order strokes were written in from those absolute times, and uses it
   * for gesture detection. Omit it and the stroke's points still carry the right intervals among
   * themselves, but the stroke as a whole loses its place against the others.
   */
  creationTime?: number
  /**
   * The stroke's affine transform, if any. Baked into absolute coordinates by {@link toWireStroke}
   * before the pointers reach the wire — the server only ever deals in absolute geometry.
   *
   * Optional so a caller with no notion of a transform — building a `TRecognitionStroke` by hand
   * rather than handing over a `TStroke` from the symbol layer — can omit it; absent is identity.
   */
  transform?: TMatrixTransform
}

/**
 * What actually goes on the wire: the same pointers transposed into one array per component, which
 * is the form the recognition API expects.
 *
 * Timing goes either as `t` (absolute instants) or, for a server that reads it, as `t0` (the first
 * pointer's absolute instant) plus `dt` (each pointer's offset from it), which is shorter.
 * The timing and `p` are absent when the stroke did not carry them — see {@link toWireStroke} for why
 * they are omitted whole rather than padded.
 * @group Client
 */
export type TWireStroke = {
  id: string
  pointerType: string
  x: number[]
  y: number[]
  p?: number[]
  t?: number[]
  t0?: number
  dt?: number[]
}

/**
 * @group Client
 */
export type TWireStrokeOptions = {
  /** Send `t0` + `dt` instead of `t`; see {@link supportsRelativeTimestamps} */
  relativeTimestamps?: boolean
}

// First server version reading `t0` + `dt`; an older one ignores them and would get no timing at all
const RELATIVE_TIMESTAMPS_SERVER_VERSION = "4.6.0"

/**
 * Whether a server of this version reads `t0` + `dt`. An unknown version answers no: `t` is the form
 * every server reads.
 * @group Client
 */
export function supportsRelativeTimestamps(serverVersion: string | undefined): boolean {
  return !!serverVersion && isVersionSuperiorOrEqual(serverVersion, RELATIVE_TIMESTAMPS_SERVER_VERSION)
}

/**
 * Transposes a stroke's pointers into the protocol's column arrays.
 *
 * The output shape is part of the wire contract — every key, and the order pointers appear in each
 * array, is what the server parses. It is asserted against a literal in
 * `test/unit/client/shared/StrokeSerializer.test.ts` so it cannot drift with a refactor.
 *
 * `t` and `p` are all-or-nothing: an array is emitted only if **every** pointer supplies that value.
 * The server reads each pointer by taking the same index across the arrays, so a partially filled
 * one would misalign with `x`/`y` and silently corrupt the stroke; and padding a gap with a made-up
 * timestamp is worse than sending none, because the recognizer would treat the invention as capture
 * data. A stroke where only some points are timed is a caller bug, and dropping the column is the
 * only reading of it that cannot mislead the server.
 *
 * With `relativeTimestamps`, the same instants go as `t0` + `dt`, rounded to whole milliseconds:
 * the server reads both as integers.
 * @group Client
 */
export function toWireStroke(stroke: TRecognitionStroke, options: TWireStrokeOptions = {}): TWireStroke {
  const toAbsolute = createPointerTransformer(stroke.transform)
  const wire: TWireStroke = {
    id: stroke.id,
    pointerType: stroke.pointerType,
    x: [],
    y: [],
  }
  const t: number[] = []
  const p: number[] = []
  let everyPointerIsTimed = true
  let everyPointerHasPressure = true

  stroke.pointers.forEach((rawPointer) => {
    const pointer = toAbsolute(rawPointer)
    wire.x.push(pointer.x)
    wire.y.push(pointer.y)
    if (typeof pointer.dt === "number" && typeof stroke.creationTime === "number") {
      t.push(+(stroke.creationTime + pointer.dt).toFixed(3))
    } else {
      everyPointerIsTimed = false
    }
    if (typeof pointer.p === "number") {
      p.push(pointer.p)
    } else {
      everyPointerHasPressure = false
    }
  })

  if (everyPointerIsTimed && t.length) {
    if (options.relativeTimestamps) {
      Object.assign(wire, toRelativeTimestamps(t))
    } else {
      wire.t = t
    }
  }
  if (everyPointerHasPressure && p.length) {
    wire.p = p
  }
  return wire
}

function toRelativeTimestamps(t: number[]): Pick<TWireStroke, "t0" | "dt"> {
  const t0 = Math.round(t[0])
  return { t0, dt: t.map((instant) => Math.round(instant) - t0) }
}

/**
 * Builds the function that bakes a stroke's matrix into one pointer's absolute position.
 *
 * Identity — no transform at all, or one that leaves everything where it is — returns the pointer
 * unchanged: no new object, no matrix math. The vast majority of strokes in any document were never
 * moved, and re-sending them is the common path, so it has to stay allocation-free.
 *
 * `t` and `p` ride along untouched: the matrix moves position only, and a pointer that never had a
 * timestamp or pressure must not acquire one by passing through here.
 *
 * Coordinates round to three decimals via {@link applyMatrixToPoint}, the same precision the
 * document stores everywhere else — the wire should not carry more precision than the model does.
 */
function createPointerTransformer(
  transform: TMatrixTransform | undefined
): (pointer: TRecognitionPointer) => TRecognitionPointer {
  if (!transform || isIdentityMatrix(transform)) {
    return (pointer) => pointer
  }
  return (pointer) => ({ ...pointer, ...applyMatrixToPoint(pointer, transform) })
}
