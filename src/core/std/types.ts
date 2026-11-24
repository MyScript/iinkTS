/**
 * @group Core/Std
 */
export type TPartialDeep<T> = T extends object
  ? {
      [P in keyof T]?: TPartialDeep<T[P]>
    }
  : T

/**
 * A value and everything reachable from it, read-only.
 *
 * This is the shape a committed record is handed out in: the store freezes records at commit, and
 * this type is how the compiler says so, at `yarn typecheck` rather than at runtime in a browser.
 * To change a committed record, ask the store for a {@link TDraft} instead.
 * @group Core/Std
 */
export type TReadonlyDeep<T> = T extends (infer TItem)[]
  ? readonly TReadonlyDeep<TItem>[]
  : T extends object
    ? { readonly [P in keyof T]: TReadonlyDeep<T[P]> }
    : T

declare const draftBrand: unique symbol

/**
 * A record that is yours to mutate, because the store has not committed it yet.
 *
 * The brand is what makes this worth having: a plain `T` is structurally identical to a mutable
 * record, so a structural alias would accept any committed record and enforce nothing. Only the
 * store hands out drafts, and a draft stops being one the moment it is committed.
 *
 * A draft is readable as a plain `T`, so a draft can be passed to anything that only reads.
 * @group Core/Std
 */
export type TDraft<T> = T & { readonly [draftBrand]: true }
