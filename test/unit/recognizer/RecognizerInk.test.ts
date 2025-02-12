import fetchMock from "jest-fetch-mock"
import
{
  RecognizerInk,
  DefaultPenStyle,
  Model,
  TPointer,
  TRecognitionType,
  TRecognizerInkConfiguration,
  DefaultRecognizerInkConfiguration
} from "../../../src/iink"
import { ConfigurationMathRest, ConfigurationTextRest, ConfigurationDiagramRest, ConfigurationRawContentRest } from "../__dataset__/configuration.dataset"

describe("RecognizerInk.ts", () =>
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

  test("should instanciate RecognizerInk", () =>
  {
    const rr = new RecognizerInk(DefaultRecognizerInkConfiguration)
    expect(rr).toBeDefined()
  })

  const testDatas: { type: TRecognitionType, config: TRecognizerInkConfiguration }[] = [
    {
      type: "TEXT",
      config: ConfigurationTextRest as TRecognizerInkConfiguration
    },
    {
      type: "SHAPE",
      config: ConfigurationDiagramRest as TRecognizerInkConfiguration
    },
    {
      type: "MATH",
      config: ConfigurationMathRest as TRecognizerInkConfiguration
    },
    {
      type: "Raw Content",
      config: ConfigurationRawContentRest as TRecognizerInkConfiguration
    },
  ]


  testDatas.forEach(({ type, config }) =>
  {
    test(`should send ${ type }`, async () =>
      {
        const model = new Model(width, height)
        const p1: TPointer = { t: 1, p: 1, x: 1, y: 1 }
        const p2: TPointer = { t: 10, p: 1, x: 100, y: 1 }
        model.initCurrentStroke(p1, "pen", DefaultPenStyle)
        model.endCurrentStroke(p2)
        const newConf: TRecognizerInkConfiguration = structuredClone(config)
        newConf.recognition.type = type
        const rr = new RecognizerInk(newConf)
        const newModel = await rr.send(model.symbols)

        let mimeTypes: string[]
        switch (type) {
          case "TEXT":
            mimeTypes = config.recognition.text.mimeTypes
            break
          case "SHAPE":
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
        expect(newModel).toBeDefined()
      })
  })

})