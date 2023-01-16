import { TDiagramConfiguration } from "../configuration/recognition/DiagramConfiguration"
import { TMathConfiguration } from "../configuration/recognition/MathConfiguration"
import { TRawContentConfiguration } from "../configuration/recognition/RawContentConfiguration"
import { TTextConfiguration } from "../configuration/recognition/TextConfiguration"
import { TConverstionState } from "../configuration/RecognitionConfiguration"
import { TStrokeGroupJSON } from "../model/Stroke"

export type TRestPostConfiguration = {
  lang: string,
  diagram?: TDiagramConfiguration,
  math?: TMathConfiguration,
  "raw-content"?: TRawContentConfiguration,
  text?: TTextConfiguration,
  export: TExportConfiguration
}

export type TRestPostData = {
  configuration: TRestPostConfiguration,
  xDPI: number,
  yDPI: nmber,
  contentType: string,
  conversionState?: TConverstionState
  height: number,
  width: nmber,
  strokeGroups: TStrokeGroupJSON[]
}