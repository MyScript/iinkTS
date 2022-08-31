import { IModel } from '../../../src/@types/model/Model'
import { TPoint } from '../../../src/@types/renderer/Point'
import { DefaultRecognitionConfiguration, DefaultServerConfiguration } from '../../../src/configuration/DefaultConfiguration'
import { DefaultPenStyle } from '../../../src/style/DefaultPenStyle'
import { RestRecognizer } from '../../../src/recognizer/rest/RestRecognizer'
import { Model } from '../../../src/model/Model'
import { TRecognitionConfiguration, TRecognitionType } from '../../../src/@types/configuration/RecognitionConfiguration'
describe('RestRecognizer.ts', () =>
{
  global.fetch = require('jest-fetch-mock')
  const height = 100, width = 100

  test('should instanciate RestRecognizer', () =>
  {
    const rr = new RestRecognizer(DefaultServerConfiguration, DefaultRecognitionConfiguration)
    expect(rr).toBeDefined()
  })

  const recognitionTypeList: TRecognitionType[] = ['TEXT', 'DIAGRAM', 'MATH', 'Raw Content']
  recognitionTypeList.forEach((recognitionType: TRecognitionType) => {
    test(`should export ${recognitionType}`, async () =>
    {
      const model: IModel = new Model(width, height)
      const p1: TPoint = { t: 1, p: 1, x: 1, y: 1 }
      const p2: TPoint = { t: 10, p: 1, x: 100, y: 1 }
      model.initCurrentStroke(p1, 1, 'pen', DefaultPenStyle)
      model.endCurrentStroke(p2, DefaultPenStyle)
      const recognitionConfig: TRecognitionConfiguration = {
        ...DefaultRecognitionConfiguration,
        type: recognitionType
      }
      const rr = new RestRecognizer(DefaultServerConfiguration, recognitionConfig)
      expect(await rr.export(model)).toStrictEqual(model)
    })
  })
})
