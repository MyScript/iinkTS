import { Stroke } from '../../../src/model/Stroke'
import { CanvasQuadraticStroker } from '../../../src/renderer/canvas/CanvasQuadraticStroker'
import { DefaultPenStyle } from '../../../src/style/DefaultPenStyle'

describe('CanvasQuadraticStroker.ts', () =>
{
  const canvas: HTMLCanvasElement = document.createElement('canvas')

  const context = {
    canvas,
    canvasContext: canvas.getContext('2d') as CanvasRenderingContext2D
  }

  test('should instanciate CanvasQuadraticStroker', () =>
  {
    const stroker = new CanvasQuadraticStroker()
    expect(stroker).toBeDefined()
  })

  test('should drawStroke', () =>
  {
    const stroker = new CanvasQuadraticStroker()
    const stroke = new Stroke(DefaultPenStyle, 1)
    for (let i = 0; i < 5; i++) {
      stroke.x.push(i)
      stroke.y.push(i)
    }
    stroker.drawStroke(context.canvasContext, stroke)
  })


})
