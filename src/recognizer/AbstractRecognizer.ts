
import { TRecognitionConfiguration } from '../@types/configuration/RecognitionConfiguration'
import { TServerConfiguration } from '../@types/configuration/ServerConfiguration'
import { IModel } from '../@types/model/Model'

export abstract class AbstractRecognizer
{
  protected serverConfiguration: TServerConfiguration
  protected recognitionConfiguration: TRecognitionConfiguration

  constructor(serverConfig: TServerConfiguration, recognitionConfig: TRecognitionConfiguration)
  {
    this.serverConfiguration = serverConfig
    this.recognitionConfiguration = recognitionConfig
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
  init(_height: number, _width: number): void { }

  abstract export(model: IModel, mimeTypes?: string[]): Promise<IModel | never>

  abstract resize(model: IModel): Promise<IModel | never>

}
