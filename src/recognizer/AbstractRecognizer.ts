
import { TRecognitionConfiguration } from '../@types/configuration/RecognitionConfiguration'
import { TServerConfiguration } from '../@types/configuration/ServerConfiguration'
import { IModel } from '../@types/model/Model'
import { IRecognizer } from '../@types/recognizer/Recognizer'
import { GlobalEvent } from '../event/GlobalEvent'

export abstract class AbstractRecognizer implements IRecognizer
{
  protected serverConfiguration: TServerConfiguration
  protected recognitionConfiguration: TRecognitionConfiguration

  constructor(serverConfig: TServerConfiguration, recognitionConfig: TRecognitionConfiguration)
  {
    this.serverConfiguration = serverConfig
    this.recognitionConfiguration = recognitionConfig
  }

  get globalEvent(): GlobalEvent
  {
    return GlobalEvent.getInstance()
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
  init(_height: number, _width: number): void { }

  abstract export(model: IModel, mimeTypes?: string[]): Promise<IModel | never>

  abstract resize(model: IModel): Promise<IModel | never>

}
