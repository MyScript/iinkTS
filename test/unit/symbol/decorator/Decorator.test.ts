import { DecoratorKind, DecoratorUtil, TStyle } from "@/iink"

describe("Decorator.ts", () => {
  describe("Highlight", () => {
    const style: TStyle = {
      color: "blue",
      width: 20,
    }
    const decorator = DecoratorUtil.createDecorator(DecoratorKind.Highlight, style)
    test("should create ", () => {
      expect(decorator).toBeDefined()
      expect(decorator.style.color).toEqual(style.color)
    })
    test("should clone with structuredClone", () => {
      const clone = structuredClone(decorator)
      expect(clone).toEqual(decorator)
      expect(clone).not.toBe(decorator)
    })
  })

  describe("Strikethrough", () => {
    const style: TStyle = {
      color: "blue",
      width: 20,
    }
    const decorator = DecoratorUtil.createDecorator(DecoratorKind.Strikethrough, style)
    test("should create ", () => {
      expect(decorator).toBeDefined()
      expect(decorator.style.color).toEqual(style.color)
    })
    test("should clone with structuredClone", () => {
      const clone = structuredClone(decorator)
      expect(clone).toEqual(decorator)
      expect(clone).not.toBe(decorator)
    })
  })

  describe("Surround", () => {
    const style: TStyle = {
      color: "blue",
      width: 20,
    }
    const decorator = DecoratorUtil.createDecorator(DecoratorKind.Surround, style)
    test("should create ", () => {
      expect(decorator).toBeDefined()
      expect(decorator.style.color).toEqual(style.color)
    })
    test("should clone with structuredClone", () => {
      const clone = structuredClone(decorator)
      expect(clone).toEqual(decorator)
      expect(clone).not.toBe(decorator)
    })
  })

  describe("Underline", () => {
    const style: TStyle = {
      color: "blue",
      width: 20,
    }
    const decorator = DecoratorUtil.createDecorator(DecoratorKind.Underline, style)
    test("should create ", () => {
      expect(decorator).toBeDefined()
      expect(decorator.style.color).toEqual(style.color)
    })
    test("should clone with structuredClone", () => {
      const clone = structuredClone(decorator)
      expect(clone).toEqual(decorator)
      expect(clone).not.toBe(decorator)
    })
  })
})
