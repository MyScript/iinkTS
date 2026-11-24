import type { TPointer } from "@/core"

/** Nominal half-width: the multiplier at which a stroke draws exactly its own style width. */
const WIDTH_NOMINAL = 1

/**
 * Canvas units per millisecond below which a stroke draws at its full width.
 *
 * Without a reference the thinning starts from a standstill, so even the slowest part of a stroke
 * came out under full width and the whole range was never used - every nib looked flatter than it
 * should. Anchoring the response here lets a deliberate stroke reach full width and leaves the
 * entire range for the speeds above it.
 */
const REFERENCE_SPEED = 0.05

/**
 * The largest share of a stroke's own length that one end's taper may consume.
 *
 * A taper measured only in absolute units swallows a short stroke whole: real handwriting runs
 * about 55 units per stroke, so a 22-unit taper at each end left 11 units of full width, and the
 * broadest nibs came out as limp even lines. Capping the taper against the stroke's own length
 * keeps the shape of the taper on a long stroke and still lets a short one reach full width.
 */
const TAPER_SHARE = 0.25

/**
 * The writing instruments a stroke can be drawn with.
 * @group Styles
 */
export type TPenNib = "ballpoint" | "pencil" | "fountain" | "brush"

/**
 * How one instrument turns a captured stroke into a thickness.
 * @group Styles
 */
export type TNibProfile = {
  /** How sharply speed thins the line. `0` draws a line of constant width. */
  speed: number
  /** Floor on the half-width multiplier, so a fast stroke never disappears. */
  min: number
  /**
   * Ceiling on the half-width multiplier. Above `1` the stroke may draw *wider* than its nominal
   * width — which is what a loaded brush does, and what a nib that can only subtract cannot.
   */
  max: number
  /** Canvas units over which each end ramps up, capped by `TAPER_SHARE` (a quarter of the stroke's length). `0` gives blunt ends. */
  taperLength: number
  /** Multiplier at the very tip of a stroke. */
  taperMin: number
  /** Whether a pen's own reported pressure overrides the estimate. */
  usePressure: boolean
  /**
   * Edge angle of a broad-edge nib, in radians, held fixed as the hand moves.
   *
   * When set, width follows the angle between the direction of travel and this edge instead of
   * following speed: pulling across the edge lays down the full width, pulling along it lays down
   * almost nothing. That is what makes a stroke look written with a pen rather than drawn with a
   * tube, and it is a property of geometry alone — it needs no timing, so it survives a document
   * that carries none.
   */
  edgeAngle?: number
  /** Width when travelling straight along the edge. Broad-edge nibs only. */
  edgeMin?: number
  /**
   * How many pointers on either side the width is averaged over. A tuft of hair has inertia: it
   * takes some distance to spread and to recover, so its width must not track speed point by point.
   */
  smoothing?: number
}

/**
 * @group Styles
 * @source
 */
export const PEN_NIBS: Record<TPenNib, TNibProfile> = {
  /** Uniform line, blunt ends. Neither speed, pressure nor direction changes it. */
  ballpoint: {
    speed: 0,
    min: WIDTH_NOMINAL,
    max: WIDTH_NOMINAL,
    taperLength: 0,
    taperMin: WIDTH_NOMINAL,
    usePressure: false,
  },
  /** The default: a visible swell through slow curves, without the extremes of the two below. */
  pencil: { speed: 0.9, min: 0.35, max: WIDTH_NOMINAL, taperLength: 10, taperMin: 0.35, usePressure: true },
  /**
   * A broad edge held at 45°, the classic italic hold. Width is decided by where the hand is going,
   * not how fast: the sides of an `o` come out full and its top and bottom hairline.
   */
  fountain: {
    speed: 0,
    min: 0.15,
    max: 1.15,
    taperLength: 8,
    taperMin: 0.4,
    usePressure: false,
    edgeAngle: Math.PI / 4,
    edgeMin: 0.15,
  },
  /** Loaded with ink: it swells past its nominal width where the hand slows, and comes to a point. */
  brush: { speed: 1.6, min: 0.12, max: 1.6, taperLength: 18, taperMin: 0.15, usePressure: true, smoothing: 3 },
}

/**
 * @group Styles
 */
export const DEFAULT_PEN_NIB: TPenNib = "pencil"

/**
 * Narrows a style value to a nib. A style is a loose bag of strings and numbers, so what it holds
 * under `pen` has to be checked rather than trusted — an unknown name falls back to the default.
 * @group Styles
 */
/**
 * Per-stroke adjustments to a nib's profile, read off the style the stroke was drawn with.
 *
 * A tuned value belongs to the stroke and not to the tool, for the same reason the nib does: change
 * the setting and what is already on the canvas must keep the look it was written with, so two
 * settings can be compared side by side.
 * @group Styles
 */
export type TNibOverrides = Partial<TNibProfile>

/**
 * Reads a stroke's nib adjustments out of its style.
 *
 * `penAngle` is in degrees, because that is what a person picks from a list; the profile holds
 * radians. Anything that is not a usable number is ignored rather than coerced — a style is a loose
 * bag of strings and numbers, and a missing key must leave the nib's own value in place.
 * @group Styles
 */
export function readNibOverrides(style: Readonly<Record<string, unknown>>): TNibOverrides {
  const overrides: TNibOverrides = {}
  const angle = style.penAngle
  if (typeof angle === "number" && Number.isFinite(angle)) {
    overrides.edgeAngle = (angle * Math.PI) / 180
  }
  const smoothing = style.penSmoothing
  if (typeof smoothing === "number" && Number.isFinite(smoothing) && smoothing >= 0) {
    overrides.smoothing = smoothing
  }
  const speed = style.penSpeed
  if (typeof speed === "number" && Number.isFinite(speed) && speed >= 0) {
    overrides.speed = speed
  }
  return overrides
}

/**
 * @group Styles
 */
export function isPenNib(value: unknown): value is TPenNib {
  return typeof value === "string" && Object.prototype.hasOwnProperty.call(PEN_NIBS, value)
}

/**
 * Whether a stroke's pointers carry timing that was actually measured.
 *
 * A stroke read from a document with no timing at all gets its `dt` filled in from the pointer
 * index, which reads as one unit of travel per point — a speed with no relation to how fast the
 * pen moved. Shading such a stroke by "speed" would render the invention, so it is left flat.
 */
function hasMeasuredTiming(pointers: readonly TPointer[]): boolean {
  return pointers.some((pointer, i) => pointer.dt !== i)
}

/**
 * Whether the device reported a pressure of its own.
 *
 * A mouse reports a constant 0.5 while its button is down, and a finger usually reports a constant
 * too; only a pen varies. A constant would flatten the whole stroke to one width, so it is read as
 * "no pressure available" rather than as a measurement.
 */
function hasDevicePressure(pointers: readonly TPointer[], pointerType: string, nib: TNibProfile): boolean {
  if (!nib.usePressure || pointerType !== "pen" || pointers.length < 2) {
    return false
  }
  const first = pointers[0].p
  return pointers.some((pointer) => pointer.p !== first && pointer.p > 0 && pointer.p <= 1)
}

/**
 * Speed at each pointer in canvas units per millisecond, by central difference so the value at a
 * point reflects the motion through it rather than the motion into it.
 */
function computeSpeeds(pointers: readonly TPointer[]): number[] {
  const segments = pointers.slice(0, -1).map((pointer, i) => {
    const next = pointers[i + 1]
    const elapsed = next.dt - pointer.dt
    const distance = Math.hypot(next.x - pointer.x, next.y - pointer.y)
    return elapsed > 0 ? distance / elapsed : 0
  })
  return pointers.map((_, i) => {
    const before = segments[i - 1]
    const after = segments[i]
    if (before === undefined) {
      return after ?? 0
    }
    if (after === undefined) {
      return before
    }
    return (before + after) / 2
  })
}

/**
 * Direction of travel at each pointer, in radians, by central difference — the tangent through a
 * point rather than the segment into it, so a broad-edge nib reads the curve and not the polyline.
 */
function computeDirections(pointers: readonly TPointer[]): number[] {
  return pointers.map((pointer, i) => {
    const before = pointers[i - 1] ?? pointer
    const after = pointers[i + 1] ?? pointer
    return Math.atan2(after.y - before.y, after.x - before.x)
  })
}

/** Running average over `window` pointers on either side. */
function smooth(values: number[], window: number): number[] {
  if (window < 1) {
    return values
  }
  return values.map((_, i) => {
    const from = Math.max(0, i - window)
    const to = Math.min(values.length - 1, i + window)
    let sum = 0
    for (let k = from; k <= to; k++) {
      sum += values[k]
    }
    return sum / (to - from + 1)
  })
}

/**
 * The half-width multiplier to draw at each pointer, within the nib's own `[min, max]`.
 *
 * What decides the width depends on the instrument, in this order:
 * 1. a **broad edge**, when the nib has one — the angle between travel and the edge, which is what
 *    makes a stroke look written rather than extruded, and which needs no timing at all;
 * 2. the **pressure** a pen reported, when it reported one — a measurement beats an estimate;
 * 3. otherwise the pen's **speed**.
 *
 * Speed, and not the gap between consecutive points. The two agree only while the sampling rate
 * holds steady, and it does not: the browser coalesces samples under load, and the display path
 * decimates them. Deriving width from spacing made a stroke change thickness according to how busy
 * the main thread happened to be. Distance over elapsed time reads the same however densely the
 * stroke was sampled.
 * @group Styles
 */
export function computeWidthProfile(
  pointers: readonly TPointer[],
  pointerType: string,
  nib: TPenNib = DEFAULT_PEN_NIB,
  overrides?: TNibOverrides
): number[] {
  const profile = { ...(PEN_NIBS[nib] ?? PEN_NIBS[DEFAULT_PEN_NIB]), ...overrides }
  if (pointers.length < 2) {
    return pointers.map(() => WIDTH_NOMINAL)
  }

  const edgeAngle = profile.edgeAngle
  const broadEdge = edgeAngle !== undefined
  const usePressure = !broadEdge && hasDevicePressure(pointers, pointerType, profile)
  const useSpeed = !broadEdge && !usePressure && profile.speed > 0 && hasMeasuredTiming(pointers)
  const directions = broadEdge ? computeDirections(pointers) : []
  const speeds = useSpeed ? computeSpeeds(pointers) : []

  // Arc length at each pointer, to taper the ends over a distance rather than over a point count:
  // a stroke of four widely spaced points would otherwise be tapered end to end.
  let travelled = 0
  const arcLengths = pointers.map((pointer, i) => {
    if (i > 0) {
      travelled += Math.hypot(pointer.x - pointers[i - 1].x, pointer.y - pointers[i - 1].y)
    }
    return travelled
  })
  const total = arcLengths[arcLengths.length - 1]
  const taperLength = Math.min(profile.taperLength, total * TAPER_SHARE)

  const bases = pointers.map((pointer, i) => {
    if (broadEdge) {
      const edgeMin = profile.edgeMin ?? profile.min
      const across = Math.abs(Math.sin(directions[i] - edgeAngle))
      return edgeMin + (profile.max - edgeMin) * across
    }
    if (usePressure) {
      return pointer.p * profile.max
    }
    if (useSpeed) {
      return profile.max - profile.speed * Math.max(0, Math.sqrt(speeds[i]) - Math.sqrt(REFERENCE_SPEED))
    }
    return profile.max
  })
  const shaped = smooth(bases, profile.smoothing ?? 0)

  return shaped.map((base, i) => {
    const fromStart = arcLengths[i]
    const fromEnd = total - arcLengths[i]
    const ramp = taperLength > 0 ? Math.min(1, fromStart / taperLength, fromEnd / taperLength) : 1
    const taper = profile.taperMin + (1 - profile.taperMin) * Math.max(0, ramp)
    return +Math.min(profile.max, Math.max(profile.min, base * taper)).toFixed(3)
  })
}

/**
 * The pointers to build a stroke's outline from: the captured geometry, with `p` replaced by the
 * width the renderer should draw there.
 *
 * `p` on a stored pointer is what the device measured and nothing else. The outline helpers read
 * `p` as a half-width multiplier, so the substitution happens here, once, on a copy — the document
 * never holds a rendering decision.
 * @group Styles
 */
export function computeOutlinePointers(
  pointers: readonly TPointer[],
  pointerType: string,
  nib?: TPenNib,
  overrides?: TNibOverrides
): TPointer[] {
  const profile = computeWidthProfile(pointers, pointerType, nib, overrides)
  return pointers.map((pointer, i) => ({ ...pointer, p: profile[i] }))
}
