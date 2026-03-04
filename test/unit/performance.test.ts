import { createUUID } from "../../src/utils/uuid"
import { mergeDeep, isDeepEqual } from "../../src/utils/object"

describe("Performance Benchmarks", () => {
  describe("UUID Generation", () => {
    it("should generate 1000 UUIDs in reasonable time", () => {
      const startTime = performance.now()

      for (let i = 0; i < 1000; i++) {
        createUUID()
      }

      const endTime = performance.now()
      const duration = endTime - startTime
      expect(duration).toBeLessThan(50)
    })

    it("should generate unique UUIDs", () => {
      const uuids = new Set<string>()

      for (let i = 0; i < 1000; i++) {
        uuids.add(createUUID())
      }
      expect(uuids.size).toBe(1000)
    })
  })

  describe("Object Merge Performance", () => {
    const createDeepObject = (depth: number): Record<string, any> => {
      if (depth === 0) return { value: Math.random() }
      return { nested: createDeepObject(depth - 1) }
    }

    it("should merge shallow objects efficiently", () => {
      const target = { a: 1, b: 2 }
      const source1 = { c: 3 }
      const source2 = { d: 4 }

      const startTime = performance.now()

      for (let i = 0; i < 1000; i++) {
        mergeDeep({ ...target }, source1, source2)
      }

      const endTime = performance.now()
      const duration = endTime - startTime
      expect(duration).toBeLessThan(100)
    })

    it("should merge deeply nested objects efficiently", () => {
      const target = createDeepObject(5)
      const source = createDeepObject(5)

      const startTime = performance.now()

      for (let i = 0; i < 100; i++) {
        mergeDeep(JSON.parse(JSON.stringify(target)), source)
      }

      const endTime = performance.now()
      const duration = endTime - startTime
      expect(duration).toBeLessThan(200)
    })

    it("should merge with array concatenation", () => {
      const target = { items: [1, 2, 3], config: { name: "test" } }
      const source = { items: [4, 5, 6] }

      const startTime = performance.now()

      for (let i = 0; i < 1000; i++) {
        mergeDeep(JSON.parse(JSON.stringify(target)), source)
      }

      const endTime = performance.now()
      const duration = endTime - startTime
      expect(duration).toBeLessThan(150)
    })
  })

  describe("Deep Equality Check Performance", () => {
    const createDeepObject = (depth: number): Record<string, any> => {
      if (depth === 0) return { value: "test" }
      return { nested: createDeepObject(depth - 1) }
    }

    it("should check equality of shallow objects efficiently", () => {
      const obj1 = { a: 1, b: 2, c: 3 }
      const obj2 = { a: 1, b: 2, c: 3 }

      const startTime = performance.now()

      for (let i = 0; i < 10000; i++) {
        isDeepEqual(obj1, obj2)
      }

      const endTime = performance.now()
      const duration = endTime - startTime
      expect(duration).toBeLessThan(100)
    })

    it("should check equality of deeply nested objects", () => {
      const obj1 = createDeepObject(4)
      const obj2 = createDeepObject(4)

      const startTime = performance.now()

      for (let i = 0; i < 1000; i++) {
        isDeepEqual(obj1, obj2)
      }

      const endTime = performance.now()
      const duration = endTime - startTime
      expect(duration).toBeLessThan(200)
    })

    it("should detect inequality quickly", () => {
      const obj1 = { a: 1, b: 2, c: 3 }
      const obj2 = { a: 1, b: 2, c: 4 }

      const startTime = performance.now()

      for (let i = 0; i < 10000; i++) {
        isDeepEqual(obj1, obj2)
      }

      const endTime = performance.now()
      const duration = endTime - startTime
      expect(duration).toBeLessThan(100)
    })
  })
})
