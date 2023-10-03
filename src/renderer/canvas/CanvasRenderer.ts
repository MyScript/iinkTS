import { TStroke } from "../../@types/model/Stroke"
import { TRenderingConfiguration } from "../../@types/configuration/RenderingConfiguration"
import { IModel } from "../../@types/model/Model"
import { TSymbol } from "../../@types/renderer/Symbol"

import { drawShapeSymbol, ShapeSymbols } from "./CanvasRendererShapeSymbol"
import { drawStroke } from "./CanvasRendererStrokeSymbol"
import { drawTextSymbol, TextSymbols } from "./CanvasRendererTextSymbol"
import { CanvasStroker } from "./CanvasStroker"
import { Logger, LoggerManager } from "../../logger"
import { LOGGER_CLASS } from "../../Constants"

export class CanvasRenderer
{
  config: TRenderingConfiguration
  stroker: CanvasStroker
  context!: {
    parent: HTMLElement
    renderingCanvas: HTMLCanvasElement
    renderingCanvasContext: CanvasRenderingContext2D
    capturingCanvas: HTMLCanvasElement
    capturingCanvasContext: CanvasRenderingContext2D
  }
  #logger: Logger

  constructor(config: TRenderingConfiguration)
  {
    this.#logger = LoggerManager.getLogger(LOGGER_CLASS.CANVAS_RENDERER)
    this.#logger.info("constructor", { config })
    this.config = config
    this.stroker = new CanvasStroker()
  }

  private createCanvas(type: string): HTMLCanvasElement
  {
    this.#logger.debug("createCanvas", { type })
    const canvas: HTMLCanvasElement = document.createElement("canvas")
    canvas.id = type
    canvas.classList.add(type)
    canvas.classList.add("ms-canvas")
    this.#logger.debug("createCanvas", { canvas })
    return canvas
  }

  private resizeContent(): void
  {
    const pixelRatio: number = window.devicePixelRatio
    const elements: HTMLCanvasElement[] = [this.context.renderingCanvas, this.context.capturingCanvas]
    elements.forEach((canvas) =>
    {
      const domElement = canvas.parentNode as HTMLElement
      const width = Math.max(this.config.minWidth, domElement.clientWidth)
      const height = Math.max(this.config.minHeight, domElement.clientHeight)
      canvas.width = width * pixelRatio
      canvas.height = height * pixelRatio
      canvas.getContext("2d")?.scale(pixelRatio, pixelRatio)
      canvas.style.width = `${ width }px`
      canvas.style.height = `${ height }px`
    })
  }

  private drawSymbol(context2D: CanvasRenderingContext2D, symbol: TSymbol)
  {
    const type = symbol.elementType || symbol.type
    if (type === "stroke") {
      drawStroke(context2D, symbol as TStroke, this.stroker)
    } else if (Object.keys(TextSymbols).includes(type)) {
      drawTextSymbol(context2D, symbol)
    } else if (Object.keys(ShapeSymbols).includes(type)) {
      drawShapeSymbol(context2D, symbol)
    }
  }

  init(element: HTMLElement): void
  {
    this.#logger.info("init", { element })
    const renderingCanvas: HTMLCanvasElement = this.createCanvas("ms-rendering-canvas")
    element.appendChild(renderingCanvas)

    const capturingCanvas: HTMLCanvasElement = this.createCanvas("ms-capture-canvas")
    element.appendChild(capturingCanvas)

    this.context = {
      parent: element,
      renderingCanvas,
      renderingCanvasContext: renderingCanvas.getContext("2d") as CanvasRenderingContext2D,
      capturingCanvas,
      capturingCanvasContext: capturingCanvas.getContext("2d") as CanvasRenderingContext2D
    }

    this.resizeContent()
  }

  drawModel(model: IModel): void
  {
    this.#logger.info("drawModel", { model })
    this.context.renderingCanvasContext?.clearRect(0, 0, this.context.renderingCanvas.width, this.context.renderingCanvas.height)
    model.rawStrokes.forEach(symbol => this.drawSymbol(this.context.renderingCanvasContext, symbol))
    this.context.capturingCanvasContext.clearRect(0, 0, this.context.capturingCanvas.width, this.context.capturingCanvas.height)
  }

  drawPendingStroke(stroke: TStroke | undefined): void
  {
    this.#logger.info("drawPendingStroke", { stroke })
    this.context.capturingCanvasContext.clearRect(0, 0, this.context.capturingCanvas.width, this.context.capturingCanvas.height)
    if (stroke && stroke?.pointerType !== "eraser") {
      this.stroker.drawStroke(this.context.capturingCanvasContext, stroke)
    }
  }

  resize(model: IModel): void
  {
    this.#logger.info("resize", { model })
    this.resizeContent()
    this.drawModel(model)
  }

  destroy(): void
  {
    this.#logger.info("destroy", { })
    if (this.context.parent) {
      this.context.parent.innerHTML = ""
    }
  }
}
