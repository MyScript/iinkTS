import { TStroke, IStroker } from "../../@types/stroker/Stroker"
import { TRenderingConfiguration } from "../../@types/configuration/RenderingConfiguration"
import { IModel } from "../../@types/model/Model"
import { IRenderer, TRendererContext } from "../../@types/renderer/Renderer"
import { TSymbol } from "../../@types/renderer/Symbol"

import { drawShapeSymbol, ShapeSymbols } from "./symbols/ShapeSymbolCanvasRenderer"
import { drawStroke } from "./symbols/StrokeSymbolCanvasRenderer"
import { drawTextSymbol, TextSymbols } from "./symbols/TextSymbolCanvasRenderer"

export class CanvasRenderer implements IRenderer
{
  config: TRenderingConfiguration
  context!: TRendererContext

  constructor(config: TRenderingConfiguration) {
    this.config = config
  }

  private createCanvas(element: HTMLElement, type: string): HTMLCanvasElement
  {
    const canvas: HTMLCanvasElement = document.createElement('canvas')
    canvas.classList.add(type)
    canvas.classList.add('ms-canvas')
    element.appendChild(canvas)
    return canvas
  }

  private resizeContent(): void
  {
    const elements: HTMLCanvasElement[] = [this.context.renderingCanvas, this.context.capturingCanvas]
    elements.forEach((canvas) =>
    {
      const domElement = canvas.parentNode as HTMLElement
      const width = Math.max(this.context?.minWidth, domElement.clientWidth)
      const height = Math.max(this.context?.minHeight, domElement.clientHeight)
      canvas.width = width * window.devicePixelRatio
      canvas.height = height * window.devicePixelRatio
      canvas.style.width = `${ width }px`
      canvas.style.height = `${ height }px`
      canvas.getContext('2d')?.scale(1, 1)
    })
  }

  private drawSymbol(context2D: CanvasRenderingContext2D, symbol: TSymbol, stroker: IStroker)
  {
    const type = symbol.elementType || symbol.type
    if (type === 'stroke') {
      drawStroke(context2D, symbol as TStroke, stroker)
    } else if (Object.keys(TextSymbols).includes(type)) {
      drawTextSymbol(context2D, symbol)
    } else if (Object.keys(ShapeSymbols).includes(type)) {
      drawShapeSymbol(context2D, symbol)
    }
  }

  init(element: HTMLElement): void
  {
    const renderingCanvas: HTMLCanvasElement = this.createCanvas(element, 'ms-rendering-canvas')
    const capturingCanvas: HTMLCanvasElement = this.createCanvas(element, 'ms-capture-canvas')

    this.context = {
      minHeight: this.config.minHeight || 0,
      minWidth: this.config.minWidth || 0,
      renderingCanvas,
      renderingCanvasContext: renderingCanvas.getContext('2d') as CanvasRenderingContext2D,
      capturingCanvas,
      capturingCanvasContext: capturingCanvas.getContext('2d') as CanvasRenderingContext2D
    }

    this.resizeContent()
  }

  drawModel(model: IModel, stroker: IStroker): void
  {
    this.context.renderingCanvasContext?.clearRect(0, 0, this.context.renderingCanvas.width, this.context.renderingCanvas.height)
    const symbols = [...model.defaultSymbols]
    if (model.recognizedSymbols) {
      symbols.push(...model.recognizedSymbols)
      symbols.push(...model.extractPendingStrokes())
    } else {
      symbols.push(...model.rawStrokes)
    }
    symbols.forEach(symbol => this.drawSymbol(this.context.renderingCanvasContext, symbol, stroker))
    this.context.capturingCanvasContext.clearRect(0, 0, this.context.capturingCanvas.width, this.context.capturingCanvas.height)
  }

  drawCurrentStroke(model: IModel, stroker: IStroker): void
  {
    // Render the current stroke
    const stroke: TStroke | undefined = model.currentStroke
    this.context.capturingCanvasContext.clearRect(0, 0, this.context.capturingCanvas.width, this.context.capturingCanvas.height)
    if (stroker && stroke && stroke?.pointerType !== 'eraser') {
      stroker.drawStroke(this.context.capturingCanvasContext, stroke)
    }
  }

  resize(model: IModel, stroker: IStroker): void
  {
    this.resizeContent()
    this.drawModel(model, stroker)
  }

  destroy(element: HTMLElement)
  {
    element.removeChild(this.context.renderingCanvas)
    element.removeChild(this.context.capturingCanvas)
    // this.context = undefined
  }
}