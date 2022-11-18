import { IModel, TExport } from "../model/Model"

export interface IRecognizer {
  export(model: IModel, mimeTypes?: string[]): Promise<IModel | never>
  resize(model: IModel): Promise<IModel | never>
  import?(data: Blob, mimeType?: string): Promise<TExport | never>
}