import { DecoratorKind, IIDecorator, TStyle } from "../../../src/iink"

describe("IIDecorator.ts", () =>
{
  describe("Highlight", () =>
  {
    const style: TStyle = {
      color: "blue",
      width: 20
    }
    const decorator = new IIDecorator(DecoratorKind.Highlight, style)
    test("should create ", () =>
    {
      expect(decorator).toBeDefined()
      expect(decorator.style).toEqual(style)
    })
    test("should clone", () =>
    {
      const clone = decorator.clone()
      expect(clone).toEqual(decorator)
      expect(clone).not.toBe(decorator)
    })
  })

  describe("Strikethrough", () =>
  {
    const style: TStyle = {
      color: "blue",
      width: 20
    }
    const decorator = new IIDecorator(DecoratorKind.Strikethrough, style)
    test("should create ", () =>
    {
      expect(decorator).toBeDefined()
      expect(decorator.style).toEqual(style)
    })
    test("should clone", () =>
    {
      const clone = decorator.clone()
      expect(clone).toEqual(decorator)
      expect(clone).not.toBe(decorator)
    })
  })

  describe("Surround", () =>
  {
    const style: TStyle = {
      color: "blue",
      width: 20
    }
    const decorator = new IIDecorator(DecoratorKind.Surround, style)
    test("should create ", () =>
    {
      expect(decorator).toBeDefined()
      expect(decorator.style).toEqual(style)
    })
    test("should clone", () =>
    {
      const clone = decorator.clone()
      expect(clone).toEqual(decorator)
      expect(clone).not.toBe(decorator)
    })
  })

  describe("Underline", () =>
  {
    const style: TStyle = {
      color: "blue",
      width: 20
    }
    const decorator = new IIDecorator(DecoratorKind.Underline, style)
    test("should create ", () =>
    {
      expect(decorator).toBeDefined()
      expect(decorator.style).toEqual(style)
    })
    test("should clone", () =>
    {
      const clone = decorator.clone()
      expect(clone).toEqual(decorator)
      expect(clone).not.toBe(decorator)
    })
  })


})
