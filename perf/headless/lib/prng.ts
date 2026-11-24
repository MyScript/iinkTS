/**
 * mulberry32 — a 32-bit seeded generator. Deterministic, uniform enough for fixture geometry, and
 * short enough to read. The benches must produce the same document on every machine, so no source
 * of entropy other than the seed is allowed anywhere in the generator.
 */
export function createPrng(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Uniform integer in `[min, max]`. */
export function nextInt(rng: () => number, min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1))
}

/** Uniform float in `[min, max)`. */
export function nextFloat(rng: () => number, min: number, max: number): number {
  return min + rng() * (max - min)
}
