import fetchMock from "jest-fetch-mock"
import
{
  RecognizerHTTPV1,
  DefaultPenStyle,
  Model,
  TPointer,
  TRecognitionType,
  TRecognizerHTTPV1Configuration,
  DefaultRecognizerHTTPV1Configuration
} from "../../../src/iink"
import { RecognizerHTTPV1DiagramConfiguration, RecognizerHTTPV1MathConfiguration, RecognizerHTTPV1RawContentConfiguration, RecognizerHTTPV1TextConfiguration } from "../__dataset__/configuration.dataset"

describe("RecognizerHTTPV1.ts", () =>
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

  test("should instanciate RecognizerHTTPV1", () =>
  {
    const rr = new RecognizerHTTPV1(DefaultRecognizerHTTPV1Configuration)
    expect(rr).toBeDefined()
  })

  const testDatas: { type: TRecognitionType, config: TRecognizerHTTPV1Configuration }[] = [
    {
      type: "TEXT",
      config: RecognizerHTTPV1TextConfiguration as TRecognizerHTTPV1Configuration
    },
    {
      type: "DIAGRAM",
      config: RecognizerHTTPV1DiagramConfiguration as TRecognizerHTTPV1Configuration
    },
    {
      type: "MATH",
      config: RecognizerHTTPV1MathConfiguration as TRecognizerHTTPV1Configuration
    },
    {
      type: "Raw Content",
      config: RecognizerHTTPV1RawContentConfiguration as TRecognizerHTTPV1Configuration
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
      const newConf: TRecognizerHTTPV1Configuration = structuredClone(config)
      newConf.recognition.type = type

      const rr = new RecognizerHTTPV1(newConf)
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
      const newConf: TRecognizerHTTPV1Configuration = structuredClone(config)
      newConf.recognition.type = type
      const rr = new RecognizerHTTPV1(newConf)
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
