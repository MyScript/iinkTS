import { buildOIStroke } from "../helpers"
import { OIDecoratorSurround, TStyle } from "../../../src/iink"

describe("OIDecoratorSurround.ts", () =>
{

  describe("constructor", () =>
  {
    test("should create ", () =>
    {
      const style: TStyle = {
        color: "blue",
        width: 20
      }
      const sym = buildOIStroke()
      const decorator = new OIDecoratorSurround(style, [sym])
      expect(decorator).toBeDefined()
      expect(decorator.creationTime).toBeLessThanOrEqual(Date.now())
      expect(decorator.creationTime).toEqual(decorator.modificationDate)
      expect(decorator.style).toEqual(expect.objectContaining(style))
    })
  })

  describe("clone", () =>
  {
    test("should return clone", () =>
    {
      const sym = buildOIStroke()
      const style: TStyle = {
        color: "blue",
        width: 20
      }
      const decorator = new OIDecoratorSurround(style, [sym])
      const clone = decorator.clone()
      expect(clone).toEqual(decorator)
      expect(clone).not.toBe(decorator)
    })
  })

})
