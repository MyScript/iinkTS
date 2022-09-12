import { TStroke, TStrokeGroup, TStrokeGroupJSON } from "../../@types/stroker/Stroker"
import { TRecognitionConfiguration } from "../../@types/configuration/RecognitionConfiguration"
import { TServerConfiguration } from "../../@types/configuration/ServerConfiguration"
import { IModel, TExport, TJIIXExport } from "../../@types/model/Model"
import { TPenStyle } from "../../@types/style/PenStyle"

import Constants from '../../Constants'
import StyleHelper from "../../style/StyleHelper"
import { computeHmac } from "../CryptoHelper"
import { AbstractRecognizer } from "../AbstractRecognizer"

export type ApiError = {
  code?: string
  message: string
}

export class RestRecognizer extends AbstractRecognizer
{
  constructor(serverConfig: TServerConfiguration, recognitionConfig: TRecognitionConfiguration)
  {
    super(serverConfig, recognitionConfig)
  }

  get url()
  {
    return `${ this.serverConfiguration.scheme }://${ this.serverConfiguration.host }/api/v4.0/iink/batch`
  }

  get postConfig()
  {
    switch (this.recognitionConfiguration.type) {
      case 'DIAGRAM':
        return {
          lang: this.recognitionConfiguration.lang,
          diagram: this.recognitionConfiguration.diagram,
          export: this.recognitionConfiguration.export
        }
      case 'MATH':
        return {
          lang: this.recognitionConfiguration.lang,
          math: this.recognitionConfiguration.math,
          export: this.recognitionConfiguration.export
        }
      case 'Raw Content':
        return {
          lang: this.recognitionConfiguration.lang,
          'raw-content': this.recognitionConfiguration.rawContent,
          export: this.recognitionConfiguration.export
        }
      case 'TEXT':
        return {
          lang: this.recognitionConfiguration.lang,
          text: this.recognitionConfiguration.text,
          export: this.recognitionConfiguration.export
        }
      default:
        throw new Error(`get postConfig error Recognition type unkow "${ this.recognitionConfiguration.type }"`)
        break
    }
  }

  private buildData(model: IModel)
  {
    const newStrokes: TStrokeGroupJSON[] = []
    model.strokeGroups.forEach((group: TStrokeGroup) =>
    {
      const newPenStyle = JSON.stringify(group.penStyle) === '{}' ? undefined : StyleHelper.penStyleToCSS(group.penStyle as TPenStyle)
      const newGroup = {
        penStyle: newPenStyle,
        strokes: group.strokes.map((s: TStroke) => {
          return {
            x: s.x,
            y: s.y,
            t: s.t,
            p: s.p,
            pointerType: s.pointerType
          }
        })
      }
      newStrokes.push(newGroup)
    })

    const contentType: string = this.recognitionConfiguration.type === 'Raw Content' ?
      'Raw Content' :
      this.recognitionConfiguration.type.charAt(0).toUpperCase() + this.recognitionConfiguration.type.slice(1).toLowerCase()

    return {
      configuration: this.postConfig,
      xDPI: 96,
      yDPI: 96,
      contentType,
      // conversionState: 'DIGITAL_EDIT', 'HANDWRITING'
      // theme: StyleHelper.themeToCSS(),
      height: model.height,
      width: model.width,
      strokeGroups: newStrokes
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async post(data: any, mimeType: string): Promise<any>
  {
    const headers = new Headers()
    headers.append('Accept', 'application/json,' + mimeType)
    headers.append('applicationKey', this.serverConfiguration.applicationKey)
    headers.append('hmac', computeHmac(JSON.stringify(data), this.serverConfiguration.applicationKey, this.serverConfiguration.hmacKey))
    headers.append('Content-Type', 'application/json')
    const reqInit: RequestInit = {
      method: 'POST',
      headers,
      body: JSON.stringify(data)
    }
    const request = new Request(this.url, reqInit)
    const response: Response = await fetch(request)
    if (response.ok) {
      const contentType = response.headers.get('content-type')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let result: any
      switch (contentType) {
        case 'application/vnd.openxmlformats-officedocument.presentationml.presentation':
        case 'image/png':
        case 'image/jpeg':
          result = await response.blob()
          break
        case 'application/json':
          result = await response.json()
          break
        case 'application/vnd.myscript.jiix':
          result = await response.clone().json().catch(async () => await response.text())
          break
        default:
          result = await response.text()
          break
      }
      return result
    } else {
      const err = await response.json() as ApiError
      throw err
    }
  }

  private async callPostMessage(model: IModel, mimeType: string): Promise<IModel | never>
  {
    const data = this.buildData(model)
    model.updatePositionSent()
    return this.post(data, mimeType)
      .then((res) =>
      {
        this.handleSuccess(model, res, mimeType)
        return model
      })
      .catch((err) =>
      {
        this.handleError(err)
        return err
      })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private handleSuccess(model: IModel, res: any, mimeType: string): void
  {
    model.updatePositionReceived()
    model.rawResults.exports = res as TJIIXExport | string | Blob

    const exports: TExport = {}
    exports[mimeType] = res as TJIIXExport | string | Blob

    if (model.exports) {
      Object.assign(model.exports, exports)
    } else {
      model.exports = exports
    }
  }

  private handleError(err: ApiError): void
  {
    let message = err.message
    if (!err.code) {
      message = Constants.Error.CANT_ESTABLISH
    }
    const error = new Error(message)
    error.name = err.code || ''
    this.eventHelper.emitError(error)
    throw error
  }

  async export(model: IModel, requestedMimeTypes?: string[]): Promise<IModel | never>
  {
    if (model.isEmpty) {
      return Promise.resolve(model)
    }
    model.idle = false
    let mimeTypes: string[] = requestedMimeTypes || []
    if (!mimeTypes.length) {
      switch (this.recognitionConfiguration.type) {
        case 'DIAGRAM':
          mimeTypes = this.recognitionConfiguration.diagram.mimeTypes
          break
        case 'MATH':
          mimeTypes = this.recognitionConfiguration.math.mimeTypes
          break
        case 'Raw Content':
          mimeTypes = this.recognitionConfiguration.rawContent.mimeTypes
          break
        case 'TEXT':
          mimeTypes = this.recognitionConfiguration.text.mimeTypes
          break
        default:
          throw new Error(`Recognition type "${ this.recognitionConfiguration.type }" is unknown.\n Possible types are:\n -DIAGRAM\n -MATH\n -Raw Content\n -TEXT`)
          break
      }
    }

    if (!mimeTypes.length) {
      return Promise.reject(new Error('Export failed, no mimeTypes define in recognition configuration'))
    }

    const mimeTypesRequiringExport: string[] = mimeTypes.filter(m => !model.exports || !model.exports[m])

    await Promise.all(mimeTypesRequiringExport.map(mimeType => this.callPostMessage(model, mimeType)))

    model.idle = true
    this.eventHelper.emitIdle(model)
    return model
  }

  async resize(model: IModel): Promise<IModel | never> {
    return this.export(model)
  }

}
