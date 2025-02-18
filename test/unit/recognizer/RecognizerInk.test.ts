import fetchMock from "jest-fetch-mock"
import
{
  InkRecognizer,
  DefaultPenStyle,
  Model,
  TPointer,
  TRecognitionType,
  TInkRecognizerConfiguration,
  DefaultInkRecognizerConfiguration
} from "../../../src/iink"
import { ConfigurationMathInteractiveInkSSR, ConfigurationTextInkDeprecated, ConfigurationDiagramInkDeprecated, ConfigurationRawContentInkDeprecated } from "../__dataset__/configuration.dataset"

describe("InkRecognizer.ts", () =>
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

  test("should instanciate InkRecognizer", () =>
  {
    const rr = new InkRecognizer(DefaultInkRecognizerConfiguration)
    expect(rr).toBeDefined()
  })

  const testDatas: { type: TRecognitionType, config: TInkRecognizerConfiguration }[] = [
    {
      type: "TEXT",
      config: ConfigurationTextInkDeprecated as TInkRecognizerConfiguration
    },
    {
      type: "SHAPE",
      config: ConfigurationDiagramInkDeprecated as TInkRecognizerConfiguration
    },
    {
      type: "MATH",
      config: ConfigurationMathInteractiveInkSSR as TInkRecognizerConfiguration
    },
    {
      type: "Raw Content",
      config: ConfigurationRawContentInkDeprecated as TInkRecognizerConfiguration
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
        const newConf: TInkRecognizerConfiguration = structuredClone(config)
        newConf.recognition.type = type
        const rr = new InkRecognizer(newConf)
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