import
{
  OIBehaviors,
  TBehaviorOptions,
  DefaultConfiguration,
  OITextManager
} from "../../../src/iink"


describe("OITextManager.ts", () =>
{
  const behaviorsOptions: TBehaviorOptions = {
    configuration: JSON.parse(JSON.stringify(DefaultConfiguration))
  }
  behaviorsOptions.configuration.offscreen = true
  test("should create", () =>
  {
    const behaviors = new OIBehaviors(behaviorsOptions)
    const manager = new OITextManager(behaviors)
    expect(manager).toBeDefined()
  })

})
