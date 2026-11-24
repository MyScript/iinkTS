import type { Geometry2d, TOBB, TPoint, TSegment } from "@/core"
import { isIdentityMatrix } from "@/core"
import type { TBaseSymbol } from "@/symbol"

import { symbolRegistry } from "./SymbolRegistry"

/**
 * Derived geometry, keyed on the symbol object itself.
 *
 * No invalidation, and none is needed: `SymbolStore` deep-freezes what it commits and hands back a
 * `structuredClone` from `draft()`, so a symbol whose geometry changed is a different object and
 * cannot collide with its own stale entry. An unfrozen object is a draft mid-edit — computed every
 * time, never stored, which is the one case where identity would lie.
 */
const cache = new WeakMap<TBaseSymbol, Geometry2d>()

/**
 * The pre-matrix geometry, cached separately from the transformed result `cache` above holds.
 *
 * A moved symbol's raw geometry does not depend on its matrix, so it would be wasteful to recompute
 * it from the util every time something needs the untransformed shape — `DecoratorUtil` is exactly
 * such a caller, reading a decorator's or its host's raw bounds to draw geometry the `transform`
 * attribute alone repositions.
 */
const rawCache = new WeakMap<TBaseSymbol, Geometry2d>()

/**
 * Freezes `value` and everything reachable from it, skipping whatever is already frozen.
 *
 * A util's geometry is only as immutable as whichever util built it: some hand back
 * a store-frozen symbol's own nested data as-is, others build fresh, unfrozen arrays. Without this,
 * a single stray write on one of the latter — `SymbolGeometry.boundsOf(s).width = 999` — would
 * poison every later read of `s`, for good, since the cache never recomputes for a frozen symbol.
 * The `isFrozen` early-out keeps this from doing redundant work on data a store-committed symbol
 * already froze.
 */
function deepFreeze<TValue>(value: TValue): TValue {
  if (value === null || typeof value !== "object" || Object.isFrozen(value)) {
    return value
  }
  Object.freeze(value)
  for (const key of Object.getOwnPropertyNames(value)) {
    deepFreeze((value as Record<string, unknown>)[key])
  }
  return value
}

/** The shape a symbol's util describes for it. */
function fromUtil(symbol: TBaseSymbol): Geometry2d {
  return symbolRegistry.getUtilFor(symbol).getGeometry(symbol)
}

/**
 * Freezes a geometry and the values it derives.
 *
 * `deepFreeze` alone is not enough for an object: `vertices`, `bounds` and `edges` are getters on the
 * prototype and hold their results in private fields, neither of which `Object.getOwnPropertyNames`
 * reaches. Freezing the instance would therefore protect nothing at all — so each derived value is
 * read out and frozen on its own, which also settles the lazy fields while the symbol is known to be
 * frozen. That is no more eager than the record this replaces, which was fully built by
 * the util before it ever reached the cache.
 *
 * Only ever called for a frozen symbol, and that restriction is load-bearing rather than an
 * optimisation: a converted util hands back the symbol's own arrays — `PointSet2d`'s vertices *are*
 * `stroke.pointers` — so freezing a draft's geometry would freeze the draft, and the next
 * `addPointer` would throw.
 */
function freezeGeometry(geometry: Geometry2d): Geometry2d {
  deepFreeze(geometry.bounds)
  deepFreeze(geometry.vertices)
  deepFreeze(geometry.edges)
  // Frozen, then the original reference returned: `Object.freeze`'s return type is `Readonly<T>`,
  // which drops the protected members and so no longer satisfies `Geometry2d`.
  Object.freeze(geometry)
  return geometry
}

/**
 * A symbol's geometry straight from its util, before its matrix is applied — cached the same way
 * `of` below caches the transformed result, so a frozen symbol's geometry is still built at most
 * once no matter how many times the raw and the transformed geometry are each read.
 */
function rawOf(symbol: TBaseSymbol): Geometry2d {
  if (!Object.isFrozen(symbol)) {
    return fromUtil(symbol)
  }
  const cached = rawCache.get(symbol)
  if (cached) {
    return cached
  }
  const geometry = freezeGeometry(fromUtil(symbol))
  rawCache.set(symbol, geometry)
  return geometry
}

/**
 * A symbol's geometry, raw or seen through its matrix.
 *
 * The matrix is applied here, inside `compute`, and not around `of` below: `of` is what puts the
 * result in the cache, so branching here is what makes the *transformed* geometry the cached value,
 * not the raw one. Caching the raw form and transforming on every read would put `applyMatrix` back
 * on the hot path the cache exists to avoid — two symbols never share a cache entry regardless, so
 * there is nothing to gain by sharing the untransformed computation between them.
 */
function compute(symbol: TBaseSymbol): Geometry2d {
  const raw = rawOf(symbol)
  // A symbol can reach here without a matrix: `mergeSymbolTransform` backfills one on the wire, but
  // a raw or malformed object — a kind no table owns, tolerated rather than thrown on — never went
  // through it. Treated as identity, which is what every untransformed symbol means anyway; reading
  // `undefined` here would throw where the code this replaced returned an answer.
  const transform = symbol.transform
  return !transform || isIdentityMatrix(transform) ? raw : raw.transform(transform)
}

function of(symbol: TBaseSymbol): Geometry2d {
  if (!Object.isFrozen(symbol)) {
    return compute(symbol)
  }
  const cached = cache.get(symbol)
  if (cached) {
    return cached
  }
  const geometry = freezeGeometry(compute(symbol))
  cache.set(symbol, geometry)
  return geometry
}

/**
 * @group SymbolUtils
 * @summary Reads a symbol's derived geometry — bounds, vertices, snap points, edges, length.
 *
 * Every accessor below calls the module-level `of` directly rather than `this.of` — so
 * `const { boundsOf } = SymbolGeometry` and `symbols.map(SymbolGeometry.boundsOf)` both work. A
 * `this`-bound accessor throws the moment it is detached from the object, which is exactly the
 * shape a read-site migration across the codebase produces.
 */
export const SymbolGeometry = {
  of,
  rawOf,

  boundsOf(symbol: TBaseSymbol): TOBB {
    return of(symbol).bounds
  },

  verticesOf(symbol: TBaseSymbol): TPoint[] {
    return of(symbol).vertices
  },

  /**
   * Snap points come from the util, not from the geometry.
   *
   * A `Geometry2d` describes a shape; where that shape offers to snap is a decision about the symbol,
   * not about its outline — a text snaps on its box, never on its glyphs. Every util already answered
   * this, with the same one line six times over, which is exactly what this used to recompute for
   * itself.
   */
  snapPointsOf(symbol: TBaseSymbol): TPoint[] {
    return symbolRegistry.getUtilFor(symbol).getSnapPoints(symbol)
  },

  edgesOf(symbol: TBaseSymbol): TSegment[] {
    return of(symbol).edges
  },

  lengthOf(symbol: TBaseSymbol): number {
    return of(symbol).length
  },
}
