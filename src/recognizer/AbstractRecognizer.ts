
import { TRecognitionConfiguration } from '../@types/configuration/RecognitionConfiguration'
import { TServerConfiguration } from '../@types/configuration/ServerConfiguration'
import { IModel } from '../@types/model/Model'
import { IRecognizer } from '../@types/recognizer/Recognizer'
import { EventHelper } from '../event/EventHelper'

export abstract class AbstractRecognizer implements IRecognizer
{
  protected serverConfiguration: TServerConfiguration
  protected recognitionConfiguration: TRecognitionConfiguration
  protected eventHelper: EventHelper

  constructor(serverConfig: TServerConfiguration, recognitionConfig: TRecognitionConfiguration)
  {
    this.serverConfiguration = serverConfig
    this.recognitionConfiguration = recognitionConfig
    this.eventHelper = EventHelper.getInstance()
  }

  abstract export(model: IModel, mimeTypes?: string[]): Promise<IModel | never>

  abstract resize(model: IModel): Promise<IModel | never>

}
