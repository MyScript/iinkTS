import { createPrng, nextFloat, nextInt } from "./prng.ts"

/**
 * A stroke as the generator produces it, before it becomes a library symbol. Kept structural so the
 * generator has no dependency on the built bundle and can be unit-tested on its own.
 */
export type TGeneratedStroke = {
  pointerType: string
  pointers: { x: number; y: number; dt: number; p: number }[]
}

/**
 * Page geometry. Strokes are laid out as words on baselines rather than scattered, because the
 * spatial distribution is what the hit-test and spatial-index benches are sensitive to: real ink is
 * dense along lines and sparse between them, and a uniform scatter would make any index look good.
 */
const PAGE_WIDTH = 1200
const LEFT_MARGIN = 40
const FIRST_BASELINE = 60
const LINE_HEIGHT = 42
const WORD_GAP = 14
const X_STEP = 4.5

/**
 * Pointer count per stroke. The mean of 16 matches the reference document measured in
 * `.local/bench-history/` (64 490 pointers over 4419 strokes, 14.6 per stroke), which keeps the
 * per-stroke clone and bounds costs comparable to real ink.
 */
const MIN_POINTERS = 8
const MAX_POINTERS = 24

/** Milliseconds between two pointers of the same stroke — a plausible sampling rate. */
const POINTER_INTERVAL_MS = 8

/**
 * `count` strokes laid out as handwriting on a page, derived entirely from `seed`. The same
 * `(count, seed)` pair yields byte-identical geometry on any machine, which is what lets the bench
 * baseline be compared across runs. Nothing is read from disk: there is no fixture to commit.
 */
export function generateDocument(count: number, seed = 1): TGeneratedStroke[] {
  const rng = createPrng(seed)
  const strokes: TGeneratedStroke[] = []
  let cursorX = LEFT_MARGIN
  let baseline = FIRST_BASELINE

  for (let i = 0; i < count; i++) {
    const pointerCount = nextInt(rng, MIN_POINTERS, MAX_POINTERS)
    const width = pointerCount * X_STEP

    if (cursorX + width > PAGE_WIDTH - LEFT_MARGIN) {
      cursorX = LEFT_MARGIN
      baseline += LINE_HEIGHT
    }

    // One stroke: a short scribble around the baseline. The sinusoid gives it a stable shape, the
    // jitter keeps every stroke distinct so no cache can collapse them into one.
    const amplitude = nextFloat(rng, 4, 11)
    const phase = nextFloat(rng, 0, Math.PI * 2)
    const pointers: TGeneratedStroke["pointers"] = []
    for (let j = 0; j < pointerCount; j++) {
      const progress = j / (pointerCount - 1 || 1)
      pointers.push({
        x: cursorX + j * X_STEP + nextFloat(rng, -0.6, 0.6),
        y: baseline + Math.sin(phase + progress * Math.PI * 2) * amplitude + nextFloat(rng, -0.6, 0.6),
        // Milliseconds since *this stroke's* gesture began, so the first pointer of every stroke is
        // at 0 — `dt` is relative by definition, where the `t` this replaces was one clock running
        // across the whole document. The interval is constant, so `j` reproduces it exactly.
        dt: j * POINTER_INTERVAL_MS,
        p: nextFloat(rng, 0.45, 1),
      })
    }

    strokes.push({ pointerType: "pen", pointers })
    cursorX += width + WORD_GAP
  }

  return strokes
}

/** Total pointer count — the context every per-pointer cost has to be read against. */
export function countPointers(strokes: readonly TGeneratedStroke[]): number {
  return strokes.reduce((total, s) => total + s.pointers.length, 0)
}
