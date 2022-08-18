import { TConfiguration, TConfigurationClient } from "./@types/Configuration"
import { TEditorOptions } from "./@types/Editor"
import { Configuration } from "./configuration/Configuration"

export class Editor
{
  private wrapperHTML: HTMLElement

  private _configuration: Configuration

  constructor(wrapperHTML: HTMLElement, options?: TEditorOptions)
  {
    this.wrapperHTML = wrapperHTML as HTMLElement
    this.wrapperHTML.classList.add(options?.globalClassCss || 'ms-editor')

    this._configuration = new Configuration(options?.configuration)
  }

  get configuration(): TConfiguration
  {
    return this._configuration
  }
  set configuration(config: TConfigurationClient)
  {
    if (this._configuration) {
      // TODO maybe need some removeListener are close connection
      this._configuration.overrideDefaultConfiguration(config)
    } else {
      this._configuration = new Configuration(config)
    }
  }


}
