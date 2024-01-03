import { MatrixTransform, OIDecoratorStrikethrough, TStyle } from "../../../src/iink"
import { buildOIStroke } from "../helpers"

describe("OIDecoratorStrikethrough.ts", () =>
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
      const decorator = new OIDecoratorStrikethrough(style, [sym])
      expect(decorator).toBeDefined()
      expect(decorator.creationTime).toBeLessThanOrEqual(Date.now())
      expect(decorator.creationTime).toEqual(decorator.modificationDate)
      expect(decorator.style).toEqual(expect.objectContaining(style))
      expect(decorator.transform).toEqual(MatrixTransform.identity())
    })
  })

  describe("getClone", () =>
  {
    test("should return clone", () =>
    {

      const sym = buildOIStroke()
      const style: TStyle = {
        color: "blue",
        width: 20
      }
      const decorator = new OIDecoratorStrikethrough(style, [sym])
      const clone = decorator.getClone()
      expect(clone).toEqual(decorator)
      expect(clone).not.toBe(decorator)
    })
  })

})
