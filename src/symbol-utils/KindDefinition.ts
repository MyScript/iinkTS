import type { Geometry2d, TPartialDeep, TPoint } from "@/core"
import type { TResizePoint } from "@/symbol"

/**
 * Everything a family util needs to know about one kind within its family.
 *
 * A family util (`ShapeUtil`, `EdgeUtil`) owns a type; the kinds inside it used to be resolved by a
 * `switch` per method, which let a new kind be added to `create` and forgotten in `overlaps`. One
 * table of these instead makes a kind a single entry, and a missing method a compile error.
 *
 * Exported because every file is reachable from its folder barrel, but this is how the built-in
 * families are written, not yet a contract integrators may implement against.
 * @group SymbolUtils
 * @experimental
 */
export type TKindDefinition<T> = {
  create(partial: TPartialDeep<T>): T
  /**
   * This kind's shape, which answers overlap, containment and distance for itself.
   *
   * Replaces the pair of geometry and overlap methods a kind used to supply: the second was always a
   * question about the first, and splitting them let a kind describe one shape and test another.
   */
  getGeometry(symbol: T): Geometry2d

  /**
   * Where this kind offers to snap, in its own untransformed frame — the family util carries them
   * through the symbol's matrix.
   *
   * Kind-specific because it is a decision about the symbol rather than about its outline: an edge
   * snaps on its own vertices, a shape on the corners and mid-sides of its box. Omitted means the
   * box, which is what every shape kind wants and no edge kind does.
   */
  getSnapPoints?(symbol: T): TPoint[]
  getSVGPath(symbol: T): string
  /**
   * Extra attributes for the rendered path. Only a kind that needs them supplies this — it is what
   * replaces an `if (symbol.kind === …)` sitting inside a family's shared `getSVGElement`.
   */
  extraPathAttributes?(symbol: T): Record<string, string>
  /**
   * Handles for vertex-level resizing. Optional in the same way: edge kinds offer them, shape kinds
   * do not, and a family util reports an empty list for a kind that leaves this out.
   */
  getResizePoints?(symbol: T): TResizePoint[]
  /**
   * Whether this kind must be resized with its ratio locked. A property of the kind rather than of
   * an instance, so it is a flag: only the circle sets it, because one radius cannot describe two
   * different scales.
   */
  keepsAspectRatio?: boolean
}

/**
 * Narrows a definition written against one concrete kind to the union its table is keyed on.
 *
 * The switches these tables replaced carried a cast per branch per method — twelve in `ShapeUtil`,
 * twelve in `EdgeUtil`. Writing each entry against its own type collapses all of them into the one
 * cast below, which is the only place a kind's type is asserted rather than checked.
 * @group SymbolUtils
 * @experimental
 */
export function defineKind<TFamily, TKind extends TFamily>(
  definition: TKindDefinition<TKind>
): TKindDefinition<TFamily> {
  return definition as TKindDefinition<TFamily>
}

/**
 * Looks a kind up in its family's table, throwing a message naming the family and the operation
 * when the kind is unknown.
 * @group SymbolUtils
 * @experimental
 */
export function resolveKind<T>(
  table: Partial<Record<string, TKindDefinition<T>>>,
  kind: string | undefined,
  family: string,
  operation: string
): TKindDefinition<T> {
  const definition = kind === undefined ? undefined : table[kind]
  if (!definition) {
    throw new Error(`Unable to ${operation} ${family}, kind: "${kind}" is unknown`)
  }
  return definition
}
