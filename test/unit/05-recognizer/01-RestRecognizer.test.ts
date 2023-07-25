import { IModel } from '../../../src/@types/model/Model'
import { TPointer } from '../../../src/@types/geometry'
import { DefaultRecognitionConfiguration, DefaultServerConfiguration } from '../../../src/configuration/DefaultConfiguration'
import { DefaultPenStyle } from '../../../src/style/DefaultPenStyle'
import { RestRecognizer } from '../../../src/recognizer/RestRecognizer'
import { Model } from '../../../src/model/Model'
import { TRecognitionConfiguration, TRecognitionType } from '../../../src/@types/configuration/RecognitionConfiguration'
import fetchMock from "jest-fetch-mock"

describe('RestRecognizer.ts', () =>
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

  test('should instanciate RestRecognizer', () =>
  {
    const rr = new RestRecognizer(DefaultServerConfiguration, DefaultRecognitionConfiguration)
    expect(rr).toBeDefined()
  })

  const recognitionTypeList: TRecognitionType[] = ['TEXT', 'DIAGRAM', 'MATH', 'Raw Content']
  recognitionTypeList.forEach((recognitionType: TRecognitionType) =>
  {
    test(`should export ${ recognitionType }`, async () =>
    {
      const model: IModel = new Model(width, height)
      const p1: TPointer = { t: 1, p: 1, x: 1, y: 1 }
      const p2: TPointer = { t: 10, p: 1, x: 100, y: 1 }
      model.initCurrentStroke(p1, 1, 'pen', DefaultPenStyle)
      model.endCurrentStroke(p2)
      const recognitionConfig: TRecognitionConfiguration = {
        ...DefaultRecognitionConfiguration,
        type: recognitionType
      }
      const rr = new RestRecognizer(DefaultServerConfiguration, recognitionConfig)
      const newModel = await rr.export(model)
      model.positions.lastReceivedPosition++
      model.positions.lastSentPosition++
      model.exports = {}

      let mimeType = ''
      switch (recognitionType) {
        case 'TEXT':
          mimeType = DefaultRecognitionConfiguration.text.mimeTypes[0]
          break
        case 'DIAGRAM':
          mimeType = DefaultRecognitionConfiguration.diagram.mimeTypes[0]
          break
        case 'MATH':
          mimeType = DefaultRecognitionConfiguration.math.mimeTypes[0]
          break
        case 'Raw Content':
          mimeType = 'application/vnd.myscript.jiix'
          break

        default:
          throw new Error("invalid recognition type")
      }
      expect(fetchMock).toHaveBeenCalledTimes(1)
      model.exports[mimeType] = ''
      expect(newModel).toEqual(model)
    })
  })

  recognitionTypeList.forEach((recognitionType: TRecognitionType) =>
  {
    test(`should convert ${ recognitionType }`, async () =>
    {
      const model: IModel = new Model(width, height)
      const p1: TPointer = { t: 1, p: 1, x: 1, y: 1 }
      const p2: TPointer = { t: 10, p: 1, x: 100, y: 1 }
      model.initCurrentStroke(p1, 1, 'pen', DefaultPenStyle)
      model.endCurrentStroke(p2)
      const recognitionConfig: TRecognitionConfiguration = {
        ...DefaultRecognitionConfiguration,
        type: recognitionType
      }
      const rr = new RestRecognizer(DefaultServerConfiguration, recognitionConfig)
      const newModel = await rr.convert(model, 'DIGITAL_EDIT')
      model.positions.lastReceivedPosition++
      model.positions.lastSentPosition++
      model.converts = {}

      let mimeType = ''
      switch (recognitionType) {
        case 'TEXT':
          mimeType = DefaultRecognitionConfiguration.text.mimeTypes[0]
          break
        case 'DIAGRAM':
          mimeType = DefaultRecognitionConfiguration.diagram.mimeTypes[0]
          break
        case 'MATH':
          mimeType = DefaultRecognitionConfiguration.math.mimeTypes[0]
          break
        case 'Raw Content':
          mimeType = 'application/vnd.myscript.jiix'
          break

        default:
          throw new Error("invalid recognition type")
      }

      expect(fetchMock).toHaveBeenCalledTimes(1)
      model.converts[mimeType] = ''
      expect(newModel).toEqual(model)
    })
  })

})
