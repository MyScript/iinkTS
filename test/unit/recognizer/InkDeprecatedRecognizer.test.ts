import fetchMock from "jest-fetch-mock"
import
{
  InkDeprecatedRecognizer,
  DefaultPenStyle,
  Model,
  TPointer,
  TRecognitionType,
  TInkDeprecatedRecognizerConfiguration,
  DefaultInkDeprecatedRecognizerConfiguration
} from "../../../src/iink"
import { ConfigurationDiagramInkDeprecated, ConfigurationMathInkDeprecated, ConfigurationRawContentInkDeprecated, ConfigurationTextInkDeprecated } from "../__dataset__/configuration.dataset"

describe("InkDeprecated.ts", () =>
{
  const height = 100, width = 100

  beforeAll(() =>
  {
    fetchMock.enableMocks()
  })
  afterEach(() =>
  {
    fetchMock.resetMocks()
  })

  test("should instanciate InkDeprecated", () =>
  {
    const rr = new InkDeprecatedRecognizer(DefaultInkDeprecatedRecognizerConfiguration)
    expect(rr).toBeDefined()
  })

  const testDatas: { type: TRecognitionType, config: TInkDeprecatedRecognizerConfiguration }[] = [
    {
      type: "TEXT",
      config: ConfigurationTextInkDeprecated as TInkDeprecatedRecognizerConfiguration
    },
    {
      type: "DIAGRAM",
      config: ConfigurationDiagramInkDeprecated as TInkDeprecatedRecognizerConfiguration
    },
    {
      type: "MATH",
      config: ConfigurationMathInkDeprecated as TInkDeprecatedRecognizerConfiguration
    },
    {
      type: "Raw Content",
      config: ConfigurationRawContentInkDeprecated as TInkDeprecatedRecognizerConfiguration
    },
  ]

  testDatas.forEach(({ type, config }) =>
  {
    test(`should export ${ type }`, async () =>
    {
      const model = new Model(width, height)
      const p1: TPointer = { t: 1, p: 1, x: 1, y: 1 }
      const p2: TPointer = { t: 10, p: 1, x: 100, y: 1 }
      model.initCurrentStroke(p1, "pen", DefaultPenStyle)
      model.endCurrentStroke(p2)
      const newConf: TInkDeprecatedRecognizerConfiguration = structuredClone(config)
      newConf.recognition.type = type

      const rr = new InkDeprecatedRecognizer(newConf)
      const newModel = await rr.export(model)

      let mimeTypes = []
      switch (type) {
        case "TEXT":
          mimeTypes = config.recognition.text!.mimeTypes
          break
        case "DIAGRAM":
          mimeTypes = config.recognition.diagram!.mimeTypes
          break
        case "MATH":
          mimeTypes = config.recognition.math!.mimeTypes
          break
        case "Raw Content":
          mimeTypes = ["application/vnd.myscript.jiix"]
          break

        default:
          throw new Error("invalid recognition type")
      }
      expect(fetchMock).toHaveBeenCalledTimes(mimeTypes.length)
      expect(model.exports).toBeUndefined()
      mimeTypes.forEach(m =>
      {
        expect(newModel.exports![m]).toBeDefined()
      })
    })
  })

  testDatas.forEach(({ type, config }) =>
  {
    test(`should convert ${ type }`, async () =>
    {
      const model = new Model(width, height)
      const p1: TPointer = { t: 1, p: 1, x: 1, y: 1 }
      const p2: TPointer = { t: 10, p: 1, x: 100, y: 1 }
      model.initCurrentStroke(p1, "pen", DefaultPenStyle)
      model.endCurrentStroke(p2)
      const newConf: TInkDeprecatedRecognizerConfiguration = structuredClone(config)
      newConf.recognition.type = type
      const rr = new InkDeprecatedRecognizer(newConf)
      const newModel = await rr.convert(model, "DIGITAL_EDIT")

      let mimeTypes: string[]
      switch (type) {
        case "TEXT":
          mimeTypes = config.recognition.text!.mimeTypes
          break
        case "DIAGRAM":
          mimeTypes = config.recognition.diagram!.mimeTypes
          break
        case "MATH":
          mimeTypes = config.recognition.math!.mimeTypes
          break
        case "Raw Content":
          mimeTypes = ["application/vnd.myscript.jiix"]
          break
        default:
          throw new Error("Invalid recognition type")
      }

      expect(fetchMock).toHaveBeenCalledTimes(mimeTypes.length)
      expect(model.converts).toBeUndefined()
      mimeTypes.forEach(m =>
      {
        expect(newModel.converts![m]).toBeDefined()
      })
    })
  })

})
