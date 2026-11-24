import { mergeDeep, mergeExports, overrideDeep, redactServerSecrets, typedKeys, uniqueById } from "@/iink"

describe("merge", () => {
  const testDatas = [
    {
      source: {
        scheme: "https",
        host: "cloud.myscript.com",
        applicationKey: "XXXX-XXXX-XXXX",
        hmacKey: "YYYY-YYYY-YYYY",
        recognition: {
          text: {
            mimeTypes: ["application/vnd.myscript.jiix"],
          },
          math: {
            mimeTypes: ["application/vnd.myscript.jiix"],
            solver: {
              enable: false,
            },
          },
          diagram: {
            mimeTypes: ["application/vnd.myscript.jiix"],
          },
        },
      },
      target: {
        scheme: "http",
        host: "cloud.preprod.myscript.com",
        applicationKey: "AAAA-AAAA-AAAA-AAAA-AAAAAAAAAAAA",
        hmacKey: "BBBBBBBB-BBBB-BBBB-BBBB-BBBBBBBBBBBB",
        recognition: {
          math: {
            mimeTypes: ["application/x-latex"],
            solver: {
              enable: true,
            },
          },
          diagram: {
            mimeTypes: [
              "application/vnd.myscript.jiix",
              "application/vnd.openxmlformats-officedocument.presentationml.presentation",
              "image/svg+xml",
            ],
          },
        },
      },
      expected: {
        scheme: "http",
        host: "cloud.preprod.myscript.com",
        applicationKey: "AAAA-AAAA-AAAA-AAAA-AAAAAAAAAAAA",
        hmacKey: "BBBBBBBB-BBBB-BBBB-BBBB-BBBBBBBBBBBB",
        recognition: {
          text: {
            mimeTypes: ["application/vnd.myscript.jiix"],
          },
          math: {
            mimeTypes: ["application/vnd.myscript.jiix", "application/x-latex"],
            solver: {
              enable: true,
            },
          },
          diagram: {
            mimeTypes: [
              "application/vnd.myscript.jiix",
              "application/vnd.myscript.jiix",
              "application/vnd.openxmlformats-officedocument.presentationml.presentation",
              "image/svg+xml",
            ],
          },
        },
      },
    },
  ]
  testDatas.forEach((d) => {
    test(`shoud mergeDeep ${JSON.stringify(d.source)} with ${JSON.stringify(d.target)} to ${JSON.stringify(d.expected)}`, () => {
      expect(mergeDeep(d.source, d.target)).toEqual(d.expected)
    })
  })
})

describe("mergeDeep prototype pollution", () => {
  // A polluting key only reaches mergeDeep as an OWN enumerable property, which is what
  // JSON.parse produces — an object literal would set the real prototype instead.
  const parse = (json: string) => JSON.parse(json) as Record<string, unknown>

  afterEach(() => {
    delete (Object.prototype as unknown as Record<string, unknown>).polluted
    delete (Array.prototype as unknown as Record<string, unknown>).polluted
  })

  test("should not let __proto__ reach Object.prototype", () => {
    const source = parse('{"__proto__": {"polluted": "yes"}}')

    mergeDeep<Record<string, unknown>>({}, source)

    expect(({} as Record<string, unknown>).polluted).toBeUndefined()
    expect(Object.prototype).not.toHaveProperty("polluted")
  })

  test("should not let a nested __proto__ reach Object.prototype", () => {
    const source = parse('{"server": {"__proto__": {"polluted": "yes"}}}')

    mergeDeep<Record<string, unknown>>({}, source)

    expect(({} as Record<string, unknown>).polluted).toBeUndefined()
    expect(Object.prototype).not.toHaveProperty("polluted")
  })

  test("should not write through constructor.prototype", () => {
    const source = parse('{"constructor": {"prototype": {"polluted": "yes"}}}')

    mergeDeep<Record<string, unknown>>({}, source)

    expect(({} as Record<string, unknown>).polluted).toBeUndefined()
    expect(Object.prototype).not.toHaveProperty("polluted")
  })

  test("should drop the dangerous key rather than copying it onto the target", () => {
    const source = parse('{"__proto__": {"polluted": "yes"}, "kept": 1}')

    const result = mergeDeep<Record<string, unknown>>({}, source)

    expect(result.kept).toBe(1)
    expect(Object.getOwnPropertyNames(result)).toEqual(["kept"])
  })

  test("should still merge a legitimate key named like a normal property", () => {
    const result = mergeDeep<Record<string, unknown>>({}, { proto: { a: 1 }, prototypes: 2 })

    expect(result).toEqual({ proto: { a: 1 }, prototypes: 2 })
  })
})

describe("overrideDeep", () => {
  test("should merge nested objects in place", () => {
    const target = { a: { b: 1, c: 2 }, d: 3 }

    const result = overrideDeep(target, { a: { b: 10 } })

    expect(result).toBe(target)
    expect(target).toEqual({ a: { b: 10, c: 2 }, d: 3 })
  })

  test("should replace arrays instead of concatenating them", () => {
    const target = { types: ["text", "shape", "math"] }

    overrideDeep(target, { types: ["math"] })

    expect(target.types).toEqual(["math"])
  })

  test("should not share the source array with the target", () => {
    const source = { types: ["math"] }
    const target = { types: ["text"] }

    overrideDeep(target, source)
    source.types.push("text")

    expect(target.types).toEqual(["math"])
  })

  test("should set a key to undefined when the override says so", () => {
    const target: { options?: string } = { options: "numeric" }

    overrideDeep(target, { options: undefined })

    expect(target.options).toBeUndefined()
  })

  test("should not let __proto__ reach Object.prototype", () => {
    overrideDeep<Record<string, unknown>>({}, JSON.parse('{"__proto__": {"polluted": "yes"}}'))

    expect(Object.prototype).not.toHaveProperty("polluted")
  })
})

describe("redactServerSecrets", () => {
  test("should redact hmacKey and applicationKey", () => {
    const config = {
      server: {
        host: "cloud.myscript.com",
        applicationKey: "XXXX-XXXX-XXXX",
        hmacKey: "YYYY-YYYY-YYYY",
      },
    }
    expect(redactServerSecrets(config)).toEqual({
      server: {
        host: "cloud.myscript.com",
        applicationKey: "[REDACTED]",
        hmacKey: "[REDACTED]",
      },
    })
  })

  test("should redact a function hmacKey the same way as a string one", () => {
    const config = {
      server: {
        host: "cloud.myscript.com",
        applicationKey: "XXXX-XXXX-XXXX",
        hmacKey: () => Promise.resolve("computed"),
      },
    }
    expect(redactServerSecrets(config)).toEqual({
      server: {
        host: "cloud.myscript.com",
        applicationKey: "[REDACTED]",
        hmacKey: "[REDACTED]",
      },
    })
  })

  test("should not touch the original config object", () => {
    const config = { server: { hmacKey: "YYYY-YYYY-YYYY" } }
    redactServerSecrets(config)
    expect(config.server.hmacKey).toEqual("YYYY-YYYY-YYYY")
  })

  test("should leave non-object input untouched", () => {
    expect(redactServerSecrets(undefined)).toEqual(undefined)
    expect(redactServerSecrets({})).toEqual({})
  })
})

describe("uniqueById", () => {
  test("should drop later duplicates, keeping the first occurrence", () => {
    const items = [
      { id: "a", value: 1 },
      { id: "b", value: 2 },
      { id: "a", value: 3 },
      { id: "c", value: 4 },
      { id: "b", value: 5 },
    ]
    expect(uniqueById(items)).toEqual([
      { id: "a", value: 1 },
      { id: "b", value: 2 },
      { id: "c", value: 4 },
    ])
  })

  test("should return an equivalent array when there are no duplicates", () => {
    const items = [{ id: "a" }, { id: "b" }, { id: "c" }]
    expect(uniqueById(items)).toEqual(items)
  })

  test("should handle an empty array", () => {
    expect(uniqueById([])).toEqual([])
  })
})

describe("mergeExports", () => {
  type TExportLike = { "text/plain"?: string; "application/x-latex"?: string }

  test("should adopt the incoming payload as-is when there is nothing to merge into", () => {
    const incoming: TExportLike = { "text/plain": "hello" }
    expect(mergeExports<TExportLike>(undefined, incoming)).toBe(incoming)
  })

  test("should merge new keys into the current payload, mutating and returning it", () => {
    const current: TExportLike = { "text/plain": "hello" }
    const incoming: TExportLike = { "application/x-latex": "\\hello" }
    const result = mergeExports(current, incoming)
    expect(result).toBe(current)
    expect(result).toEqual({ "text/plain": "hello", "application/x-latex": "\\hello" })
  })

  test("should let the incoming payload overwrite overlapping keys", () => {
    const current: TExportLike = { "text/plain": "hello" }
    const incoming: TExportLike = { "text/plain": "world" }
    expect(mergeExports(current, incoming)).toEqual({ "text/plain": "world" })
  })
})

describe("typedKeys", () => {
  test("should list the object's own enumerable keys, in insertion order", () => {
    expect(typedKeys({ b: 1, a: 2 })).toEqual(["b", "a"])
  })
  test("should return an empty list for an empty object", () => {
    expect(typedKeys({})).toEqual([])
  })
})
