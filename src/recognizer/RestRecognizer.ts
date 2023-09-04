
import { IRecognizer } from "../@types/recognizer/Recognizer"
import { TRestPostConfiguration, TRestPostData } from "../@types/recognizer/RestRecognizer"
import { TStrokeGroup, TStrokeGroupJSON } from "../@types/model/Stroke"
import { TConverstionState, TRecognitionConfiguration } from "../@types/configuration/RecognitionConfiguration"
import { TServerConfiguration } from "../@types/configuration/ServerConfiguration"
import { IModel, TExport, TJIIXExport } from "../@types/model/Model"
import { TPenStyle } from "../@types/style/PenStyle"

import { Error as ErrorConst } from "../Constants"
import StyleHelper from "../style/StyleHelper"
import { computeHmac } from "./CryptoHelper"
import { isVersionSuperiorOrEqual } from "../utils/versionHelper"
import { convertStrokeToJSON } from "../model/Stroke"

type ApiError = {
  code?: string
  message: string
}

export class RestRecognizer implements IRecognizer
{
  protected serverConfiguration: TServerConfiguration
  protected recognitionConfiguration: TRecognitionConfiguration

  constructor(serverConfig: TServerConfiguration, recognitionConfig: TRecognitionConfiguration)
  {
    this.serverConfiguration = serverConfig
    this.recognitionConfiguration = recognitionConfig
  }

  get url()
  {
    return `${ this.serverConfiguration.scheme }://${ this.serverConfiguration.host }/api/v4.0/iink/batch`
  }

  get postConfig(): TRestPostConfiguration
  {
    switch (this.recognitionConfiguration.type) {
      case "DIAGRAM":
        return {
          lang: this.recognitionConfiguration.lang,
          diagram: this.recognitionConfiguration.diagram,
          export: this.recognitionConfiguration.export
        }
      case "MATH":
        return {
          lang: this.recognitionConfiguration.lang,
          math: this.recognitionConfiguration.math,
          export: this.recognitionConfiguration.export
        }
      case "Raw Content":
        return {
          lang: this.recognitionConfiguration.lang,
          "raw-content": this.recognitionConfiguration["raw-content"],
          export: this.recognitionConfiguration.export
        }
      case "TEXT":
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

  private buildData(model: IModel): TRestPostData
  {
    const isPenStyleEqual = (ps1: TPenStyle, ps2: TPenStyle) =>
    {
      return ps1["-myscript-pen-fill-color"] === ps2["-myscript-pen-fill-color"] &&
        ps1["-myscript-pen-fill-style"] === ps2["-myscript-pen-fill-style"] &&
        ps1["-myscript-pen-width"] === ps2["-myscript-pen-width"] &&
        ps1.color === ps2.color &&
        ps1.width === ps2.width
    }

    const strokeGroupByPenStyle: TStrokeGroup[] = []
    model.rawStrokes.forEach((s) => {
      const groupIndex = strokeGroupByPenStyle.findIndex(sg => isPenStyleEqual(sg.penStyle, s.style))
      if (groupIndex > -1) {
        strokeGroupByPenStyle[groupIndex].strokes.push(s)
      } else {
        strokeGroupByPenStyle.push({
          penStyle: s.style,
          strokes: [s]
        })
      }
    })

    const strokeGroupsToSend: TStrokeGroupJSON[] = []
    strokeGroupByPenStyle.forEach((group: TStrokeGroup) =>
    {
      const newPenStyle = JSON.stringify(group.penStyle) === "{}" ? undefined : StyleHelper.penStyleToCSS(group.penStyle as TPenStyle)
      const newGroup = {
        penStyle: newPenStyle,
        strokes: group.strokes.map(convertStrokeToJSON)
      }
      strokeGroupsToSend.push(newGroup)
    })

    const contentType: string = this.recognitionConfiguration.type === "Raw Content" ?
      "Raw Content" :
      this.recognitionConfiguration.type.charAt(0).toUpperCase() + this.recognitionConfiguration.type.slice(1).toLowerCase()

    return {
      configuration: this.postConfig,
      xDPI: 96,
      yDPI: 96,
      contentType,
      // theme: StyleHelper.themeToCSS(),
      height: model.height,
      width: model.width,
      strokeGroups: strokeGroupsToSend
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async post(data: any, mimeType: string): Promise<any>
  {
    const headers = new Headers()
    headers.append("Accept", "application/json," + mimeType)
    headers.append("applicationKey", this.serverConfiguration.applicationKey)
    headers.append("hmac", computeHmac(JSON.stringify(data), this.serverConfiguration.applicationKey, this.serverConfiguration.hmacKey))
    headers.append("Content-Type", "application/json")

    if (isVersionSuperiorOrEqual(this.serverConfiguration.version, "2.0.4")) {
      headers.append("myscript-client-name", "iink-ts")
      headers.append("myscript-client-version", "1.0.0-buildVersion")
    }

    const reqInit: RequestInit = {
      method: "POST",
      headers,
      body: JSON.stringify(data)
    }
    const request = new Request(this.url, reqInit)
    const response: Response = await fetch(request)
    if (response.ok) {
      const contentType = response.headers.get("content-type")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let result: any
      switch (contentType) {
        case "application/vnd.openxmlformats-officedocument.presentationml.presentation":
        case "image/png":
        case "image/jpeg":
          result = await response.blob()
          break
        case "application/json":
          result = await response.json()
          break
        case "application/vnd.myscript.jiix":
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

  private async tryFetch(data: unknown, mimeType: string): Promise<TExport | never>
  {
    return this.post(data, mimeType)
      .then((res) =>
      {
        const exports: TExport = {}
        exports[mimeType] = res as TJIIXExport | string | Blob
        return exports
      })
      .catch((err) =>
      {
        let message = err.message || ErrorConst.UNKNOW
        if (!err.code) {
          message = ErrorConst.CANT_ESTABLISH
        } else if (err.code === "access.not.granted") {
          message = ErrorConst.WRONG_CREDENTIALS
        }
        const error = new Error(message)
        throw error
      })
  }

  private getMimeTypes(requestedMimeTypes?: string[]): string[]
  {
    let mimeTypes: string[] = requestedMimeTypes || []
    if (!mimeTypes.length) {
      switch (this.recognitionConfiguration.type) {
        case "DIAGRAM":
          mimeTypes = this.recognitionConfiguration.diagram.mimeTypes
          break
        case "MATH":
          mimeTypes = this.recognitionConfiguration.math.mimeTypes
          break
        case "Raw Content":
          mimeTypes = ["application/vnd.myscript.jiix"]
          break
        case "TEXT":
          mimeTypes = this.recognitionConfiguration.text.mimeTypes
          break
        default:
          throw new Error(`Recognition type "${ this.recognitionConfiguration.type }" is unknown.\n Possible types are:\n -DIAGRAM\n -MATH\n -Raw Content\n -TEXT`)
          break
      }
    }
    return mimeTypes
  }

  async convert(model: IModel, conversionState?: TConverstionState, requestedMimeTypes?: string[]): Promise<IModel | never>
  {
    const myModel = model.getClone()
    myModel.updatePositionSent()

    const mimeTypes = this.getMimeTypes(requestedMimeTypes)

    const dataToConcert = this.buildData(myModel)
    dataToConcert.conversionState = conversionState

    const promises = mimeTypes.map(mt => this.tryFetch(dataToConcert, mt))
    const converts: TExport[] = await Promise.all(promises)
    converts.forEach(c =>
    {
      myModel.mergeConvert(c)
    })

    myModel.updatePositionReceived()

    return myModel
  }

  async export(model: IModel, requestedMimeTypes?: string[]): Promise<IModel | never>
  {
    const myModel = model.getClone()
    myModel.updatePositionSent()

    if (myModel.rawStrokes.length === 0) {
      return Promise.resolve(myModel)
    }

    const mimeTypes = this.getMimeTypes(requestedMimeTypes)

    if (!mimeTypes.length) {
      return Promise.reject(new Error("Export failed, no mimeTypes define in recognition configuration"))
    }

    const mimeTypesRequiringExport: string[] = mimeTypes.filter(m => !myModel.exports || !myModel.exports[m])

    const data = this.buildData(model)

    const exports: TExport[] = await Promise.all(mimeTypesRequiringExport.map(mimeType => this.tryFetch(data, mimeType)))

    exports.forEach(e =>
    {
      myModel.mergeExport(e)
    })

    myModel.updatePositionReceived()

    return myModel
  }

  async resize(model: IModel): Promise<IModel | never>
  {
    return this.export(model)
  }

}
