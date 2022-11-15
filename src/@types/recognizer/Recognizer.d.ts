import { IModel, TExport } from "../model/Model"

export interface IRecognizer {
  init(height: number, width: number): void
  export(model: IModel, mimeTypes?: string[]): Promise<IModel | never>
  resize(model: IModel): Promise<IModel | never>
  import?(data: Blob, mimeType?: string): Promise<TExport | never>
}