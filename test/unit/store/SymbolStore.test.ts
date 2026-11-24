import { MatrixTransform, SymbolStore, type TBaseSymbol } from "@/iink"

type TRecord = TBaseSymbol & { label?: string }

const build = (id: string, label = id): TRecord => ({
  id,
  creationTime: 0,
  modificationDate: 0,
  type: "test",
  style: {},
  label,
  transform: MatrixTransform.identity(),
})

const ids = (store: SymbolStore<TRecord>) => store.list().map((s) => s.id)

describe("SymbolStore", () => {
  describe("add", () => {
    test("should hold what was added", () => {
      const store = new SymbolStore<TRecord>()
      store.add(build("a"))
      expect(store.get("a")?.label).toEqual("a")
      expect(store.size).toEqual(1)
    })

    test("should throw on a duplicate id rather than silently replacing", () => {
      const store = new SymbolStore<TRecord>()
      store.add(build("a"))
      expect(() => store.add(build("a"))).toThrow("Symbol id already exist: a")
    })

    test("should bump the version", () => {
      const store = new SymbolStore<TRecord>()
      const before = store.version
      store.add(build("a"))
      expect(store.version).toBeGreaterThan(before)
    })
  })

  describe("update", () => {
    test("should replace the record under the same id", () => {
      const store = new SymbolStore<TRecord>()
      store.add(build("a", "before"))
      store.update(build("a", "after"))
      expect(store.get("a")?.label).toEqual("after")
    })

    test("should ignore an unknown id", () => {
      const store = new SymbolStore<TRecord>()
      store.update(build("ghost"))
      expect(store.size).toEqual(0)
    })

    test("should not bump the version when markDirty is false", () => {
      const store = new SymbolStore<TRecord>()
      store.add(build("a"))
      const before = store.version
      store.update(build("a", "quiet"), false)
      expect(store.version).toEqual(before)
      expect(store.get("a")?.label).toEqual("quiet")
    })
  })

  describe("remove", () => {
    test("should drop the record and bump the version", () => {
      const store = new SymbolStore<TRecord>()
      store.add(build("a"))
      const before = store.version
      store.remove("a")
      expect(store.get("a")).toBeUndefined()
      expect(store.version).toBeGreaterThan(before)
    })

    test("should not bump the version for an unknown id", () => {
      const store = new SymbolStore<TRecord>()
      const before = store.version
      store.remove("ghost")
      expect(store.version).toEqual(before)
    })
  })

  describe("replace", () => {
    test("should swap one record for several, in place", () => {
      const store = new SymbolStore<TRecord>()
      store.add(build("a"))
      store.add(build("b"))
      store.add(build("c"))
      store.replace("b", [build("b1"), build("b2")])
      expect(store.list().map((s) => s.id)).toEqual(["a", "c", "b1", "b2"])
    })

    test("should do nothing for an unknown id", () => {
      const store = new SymbolStore<TRecord>()
      store.add(build("a"))
      const before = store.version
      store.replace("ghost", [build("x")])
      expect(store.list().map((s) => s.id)).toEqual(["a"])
      expect(store.version).toEqual(before)
    })
  })

  describe("list", () => {
    test("should keep insertion order", () => {
      const store = new SymbolStore<TRecord>()
      ;["a", "b", "c"].forEach((id) => store.add(build(id)))
      expect(store.list().map((s) => s.id)).toEqual(["a", "b", "c"])
    })

    test("should hand out the stored records themselves, not copies", () => {
      const store = new SymbolStore<TRecord>()
      const record = build("a")
      store.add(record)
      expect(store.list()[0]).toBe(record)
      expect(store.get("a")).toBe(record)
    })
  })

  describe("changeOrder", () => {
    const seed = () => {
      const store = new SymbolStore<TRecord>()
      ;["a", "b", "c", "d"].forEach((id) => store.add(build(id)))
      return store
    }

    test("should move to first", () => {
      const store = seed()
      store.changeOrder("c", "first")
      expect(ids(store)).toEqual(["c", "a", "b", "d"])
    })

    test("should move to last", () => {
      const store = seed()
      store.changeOrder("b", "last")
      expect(ids(store)).toEqual(["a", "c", "d", "b"])
    })

    test("should move forward by one", () => {
      const store = seed()
      store.changeOrder("b", "forward")
      expect(ids(store)).toEqual(["a", "c", "b", "d"])
    })

    test("should move backward by one", () => {
      const store = seed()
      store.changeOrder("c", "backward")
      expect(ids(store)).toEqual(["a", "c", "b", "d"])
    })

    test("should be a no-op at the edges", () => {
      const store = seed()
      store.changeOrder("a", "backward")
      store.changeOrder("d", "forward")
      expect(ids(store)).toEqual(["a", "b", "c", "d"])
    })

    test("should ignore an unknown id without bumping the version", () => {
      const store = seed()
      const before = store.version
      store.changeOrder("ghost", "first")
      expect(ids(store)).toEqual(["a", "b", "c", "d"])
      expect(store.version).toEqual(before)
    })

    test("should bump the version when the order actually changed", () => {
      const store = seed()
      const before = store.version
      store.changeOrder("c", "first")
      expect(store.version).toBeGreaterThan(before)
    })
  })

  describe("clear", () => {
    test("should empty the store and bump the version", () => {
      const store = new SymbolStore<TRecord>()
      store.add(build("a"))
      const before = store.version
      store.clear()
      expect(store.size).toEqual(0)
      expect(store.version).toBeGreaterThan(before)
    })
  })
})

describe("SymbolStore drafts", () => {
  test("should hand out a mutable copy, not the stored record", () => {
    const store = new SymbolStore<TRecord>()
    const record = build("a", "committed")
    store.add(record)

    const draft = store.draft("a")!
    expect(draft).not.toBe(record)
    draft.label = "drafted"
    expect(store.get("a")?.label).toEqual("committed")
  })

  test("should return undefined for an unknown id", () => {
    const store = new SymbolStore<TRecord>()
    expect(store.draft("ghost")).toBeUndefined()
  })

  test("should store the draft on commit and bump the version", () => {
    const store = new SymbolStore<TRecord>()
    store.add(build("a", "committed"))
    const before = store.version

    const draft = store.draft("a")!
    draft.label = "drafted"
    store.commit(draft)

    expect(store.get("a")?.label).toEqual("drafted")
    expect(store.version).toBeGreaterThan(before)
  })

  test("should not bump the version when committing quietly", () => {
    const store = new SymbolStore<TRecord>()
    store.add(build("a"))
    const before = store.version
    const draft = store.draft("a")!
    draft.label = "quiet"
    store.commit(draft, false)
    expect(store.get("a")?.label).toEqual("quiet")
    expect(store.version).toEqual(before)
  })

  test("should keep the record's position in the stacking order on commit", () => {
    const store = new SymbolStore<TRecord>()
    ;["a", "b", "c"].forEach((id) => store.add(build(id)))
    const draft = store.draft("b")!
    draft.label = "drafted"
    store.commit(draft)
    expect(ids(store)).toEqual(["a", "b", "c"])
  })
})

describe("SymbolStore.listBy", () => {
  type TTargeted = TBaseSymbol & { targetIds?: string[] }

  const targeted = (id: string, targetIds?: string[]): TTargeted => ({
    id,
    creationTime: 0,
    modificationDate: 0,
    type: targetIds ? "decorator" : "stroke",
    style: {},
    targetIds,
    transform: MatrixTransform.identity(),
  })

  const byTargetIds = (s: TTargeted) => s.targetIds ?? []
  const byTypeName = (s: TTargeted) => [s.type]
  const index = (store: SymbolStore<TTargeted>) => store.listBy(byTargetIds)

  test("should map each key to the records claiming it", () => {
    const store = new SymbolStore<TTargeted>()
    store.add(targeted("stroke1"))
    store.add(targeted("deco1", ["stroke1"]))
    store.add(targeted("deco2", ["stroke1", "stroke2"]))

    const byTarget = index(store)
    expect(byTarget.get("stroke1")?.map((s) => s.id)).toEqual(["deco1", "deco2"])
    expect(byTarget.get("stroke2")?.map((s) => s.id)).toEqual(["deco2"])
    expect(byTarget.get("stroke3")).toBeUndefined()
  })

  test("should be recomputed once the document changed", () => {
    const store = new SymbolStore<TTargeted>()
    store.add(targeted("deco1", ["stroke1"]))
    expect(index(store).get("stroke1")?.length).toEqual(1)

    store.add(targeted("deco2", ["stroke1"]))
    expect(index(store).get("stroke1")?.length).toEqual(2)
  })

  test("should serve the same map while the version has not moved", () => {
    const store = new SymbolStore<TTargeted>()
    store.add(targeted("deco1", ["stroke1"]))
    expect(index(store)).toBe(index(store))
  })

  test("should key each selector separately", () => {
    const store = new SymbolStore<TTargeted>()
    store.add(targeted("deco1", ["stroke1"]))
    const byTarget = store.listBy(byTargetIds)
    const byType = store.listBy(byTypeName)
    expect(byTarget).not.toBe(byType)
    expect(byType.get("decorator")?.map((s) => s.id)).toEqual(["deco1"])
  })
})
