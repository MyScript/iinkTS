import type { TDraft, TReadonlyDeep } from "@/iink"

/**
 * These are type-level tests: the assertions are the `expectType` calls, checked by `yarn typecheck`.
 * The runtime `expect` below only keeps Jest from reporting an empty suite.
 */

/** Compiles only when `A` and `B` are the same type, invariantly. */
type TIsExact<A, B> = (<G>() => G extends A ? 1 : 2) extends <G>() => G extends B ? 1 : 2 ? true : false

function expectType<TExpected>(): <TActual>(...args: TIsExact<TExpected, TActual> extends true ? [] : [never]) => void {
  return () => undefined
}

/** Mimics what the store does internally: only it can mint a draft. */
const asDraft = <T>(value: T): TDraft<T> => value as TDraft<T>

type TSample = {
  id: string
  point: { x: number; y: number }
  tags: string[]
}

describe("TReadonlyDeep", () => {
  test("should make every nested property readonly", () => {
    type TFrozen = TReadonlyDeep<TSample>
    expectType<{
      readonly id: string
      readonly point: { readonly x: number; readonly y: number }
      readonly tags: readonly string[]
    }>()<TFrozen>()

    const frozen: TFrozen = { id: "a", point: { x: 1, y: 2 }, tags: ["t"] }
    // @ts-expect-error a readonly-deep record cannot be written to
    frozen.point.x = 3
    // @ts-expect-error nor can its arrays be pushed to
    frozen.tags.push("u")
    expect(frozen.id).toBe("a")
  })

  test("should leave primitives alone", () => {
    expectType<string>()<TReadonlyDeep<string>>()
    expectType<number>()<TReadonlyDeep<number>>()
  })
})

describe("TDraft", () => {
  test("should stay writable", () => {
    const draft = asDraft<TSample>({ id: "a", point: { x: 1, y: 2 }, tags: ["t"] })
    draft.point.x = 3
    draft.tags.push("u")
    expect(draft.point.x).toBe(3)
  })

  test("should not accept a committed record, so the brand cannot be forged structurally", () => {
    const committed: TReadonlyDeep<TSample> = { id: "a", point: { x: 1, y: 2 }, tags: [] }
    // @ts-expect-error a committed record is not a draft — this is the whole point of the brand
    const draft: TDraft<TSample> = committed
    expect(draft).toBeDefined()
  })

  test("should not accept a plain mutable object either", () => {
    const plain: TSample = { id: "a", point: { x: 1, y: 2 }, tags: [] }
    // @ts-expect-error only the store hands out drafts
    const draft: TDraft<TSample> = plain
    expect(draft).toBeDefined()
  })

  test("should be readable as the plain type", () => {
    const draft = asDraft<TSample>({ id: "a", point: { x: 1, y: 2 }, tags: [] })
    const read: TSample = draft
    expect(read.id).toBe("a")
  })
})
