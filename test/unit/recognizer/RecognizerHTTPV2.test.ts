import fetchMock from "jest-fetch-mock"
import
{
  RecognizerHTTPV2,
  DefaultPenStyle,
  Model,
  TPointer,
  TRecognitionV2Type,
  TRecognizerHTTPV2Configuration,
  DefaultRecognizerHTTPV2Configuration
} from "../../../src/iink"
import { RecognizerHTTPV1MathConfiguration, RecognizerHTTPV1TextConfiguration, RecognizerHTTPV1DiagramConfiguration, RecognizerHTTPV1RawContentConfiguration } from "../__dataset__/configuration.dataset"

describe("RecognizerHTTPV2.ts", () =>
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

  test("should instanciate RecognizerHTTPV2", () =>
  {
    const rr = new RecognizerHTTPV2(DefaultRecognizerHTTPV2Configuration)
    expect(rr).toBeDefined()
  })

  const testDatas: { type: TRecognitionV2Type, config: TRecognizerHTTPV2Configuration }[] = [
    {
      type: "TEXT",
      config: RecognizerHTTPV1TextConfiguration as unknown as TRecognizerHTTPV2Configuration
    },
    {
      type: "SHAPE",
      config: RecognizerHTTPV1DiagramConfiguration as unknown as TRecognizerHTTPV2Configuration
    },
    {
      type: "MATH",
      config: RecognizerHTTPV1MathConfiguration as unknown as TRecognizerHTTPV2Configuration
    },
    {
      type: "Raw Content",
      config: RecognizerHTTPV1RawContentConfiguration as unknown as TRecognizerHTTPV2Configuration
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
        const newConf: TRecognizerHTTPV2Configuration = structuredClone(config)
        newConf.recognition.type = type
        const rr = new RecognizerHTTPV2(newConf)
        const newModel = await rr.send(model.symbols)

        let mimeTypes: string[]
        switch (type) {
          case "TEXT":
            mimeTypes = config.recognition.text.mimeTypes
            break
          case "SHAPE":
            mimeTypes = ["application/vnd.myscript.jiix"]
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
