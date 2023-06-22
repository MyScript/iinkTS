import { TWebSocketSVGPatchEvent } from '../../../src/@types/recognizer/WSRecognizer'
import { WSEvent } from '../../../src/event/WSEvent'

describe('WSEvent.ts', () =>
{

  test('should instanciate', () =>
  {
    const wsEvent = new WSEvent()
    expect(wsEvent).toBeDefined()
  })

  test('should emit & listen SVG_PATCH', () =>
  {
    const wsEvent = new WSEvent()
    const testFunction = jest.fn()
    wsEvent.addSVGPatchListener(testFunction)
    const svgPatch: TWebSocketSVGPatchEvent = {
      type: 'svgPatch',
      layer: 'MODEL',
      updates: []
    }
    wsEvent.emitSVGPatch(svgPatch)
    expect(testFunction).toBeCalledTimes(1)
    expect(testFunction).toBeCalledWith(svgPatch)
  })
})
