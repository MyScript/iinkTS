
import { TRecognitionConfiguration } from '../@types/configuration/RecognitionConfiguration'
import { TServerConfiguration } from '../@types/configuration/ServerConfiguration'
import { IRecognizer } from '../@types/recognizer/Recognizer'
import { IModel } from '../@types/model/Model'

export abstract class AbstractRecognizer implements IRecognizer
{
  protected serverConfiguration: TServerConfiguration
  protected recognitionConfiguration: TRecognitionConfiguration

  constructor(serverConfig: TServerConfiguration, recognitionConfig: TRecognitionConfiguration)
  {
    this.serverConfiguration = serverConfig
    this.recognitionConfiguration = recognitionConfig
  }
  abstract export(model: IModel, mimeTypes?: string[]): Promise<IModel | never>

  abstract resize(model: IModel): Promise<IModel | never>

}
