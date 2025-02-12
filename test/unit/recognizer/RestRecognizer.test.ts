import fetchMock from "jest-fetch-mock"
import
{
  RestRecognizer,
  DefaultPenStyle,
  Model,
  TPointer,
  TRecognitionType,
  TRestRecognizerConfiguration,
  DefaultRestRecognizerConfiguration
} from "../../../src/iink"
import { ConfigurationDiagramRest, ConfigurationMathRest, ConfigurationRawContentRest, ConfigurationTextRest } from "../__dataset__/configuration.dataset"

describe("RestRecognizer.ts", () =>
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

  test("should instanciate RestRecognizer", () =>
  {
    const rr = new RestRecognizer(DefaultRestRecognizerConfiguration)
    expect(rr).toBeDefined()
  })

  const testDatas: { type: TRecognitionType, config: TRestRecognizerConfiguration }[] = [
    {
      type: "TEXT",
      config: ConfigurationTextRest as TRestRecognizerConfiguration
    },
    {
      type: "DIAGRAM",
      config: ConfigurationDiagramRest as TRestRecognizerConfiguration
    },
    {
      type: "MATH",
      config: ConfigurationMathRest as TRestRecognizerConfiguration
    },
    {
      type: "Raw Content",
      config: ConfigurationRawContentRest as TRestRecognizerConfiguration
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
      const newConf: TRestRecognizerConfiguration = structuredClone(config)
      newConf.recognition.type = type

      const rr = new RestRecognizer(newConf)
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
      const newConf: TRestRecognizerConfiguration = structuredClone(config)
      newConf.recognition.type = type
      const rr = new RestRecognizer(newConf)
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
