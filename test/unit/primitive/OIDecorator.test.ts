import { buildOIStroke } from "../helpers"
import { DecoratorKind, OIDecorator, TStyle } from "../../../src/iink"

describe("OIDecorator.ts", () =>
{
  describe("Highlight", () =>
  {
    const style: TStyle = {
      color: "blue",
      width: 20
    }
    const sym = buildOIStroke()
    const decorator = new OIDecorator(DecoratorKind.Highlight, style, sym)
    test("should create ", () =>
    {
      expect(decorator).toBeDefined()
      expect(decorator.style).toEqual(style)
    })
    test("should clone", () =>
    {
      const clone = decorator.clone(sym)
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
    const sym = buildOIStroke()
    const decorator = new OIDecorator(DecoratorKind.Strikethrough, style, sym)
    test("should create ", () =>
    {
      expect(decorator).toBeDefined()
      expect(decorator.style).toEqual(style)
    })
    test("should clone", () =>
    {
      const clone = decorator.clone(sym)
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
    const sym = buildOIStroke()
    const decorator = new OIDecorator(DecoratorKind.Surround, style, sym)
    test("should create ", () =>
    {
      expect(decorator).toBeDefined()
      expect(decorator.style).toEqual(style)
    })
    test("should clone", () =>
    {
      const clone = decorator.clone(sym)
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
    const sym = buildOIStroke()
    const decorator = new OIDecorator(DecoratorKind.Underline, style, sym)
    test("should create ", () =>
    {
      expect(decorator).toBeDefined()
      expect(decorator.style).toEqual(style)
    })
    test("should clone", () =>
    {
      const clone = decorator.clone(sym)
      expect(clone).toEqual(decorator)
      expect(clone).not.toBe(decorator)
    })
  })


})
