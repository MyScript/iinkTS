
import { TConfiguration, TConfigurationClient } from '../@types/Configuration'
import { TEventConfiguration } from '../@types/configuration/EventConfiguration'
import { TGrabberConfiguration } from '../@types/configuration/GrabberConfiguration'
import { TRecognitionConfiguration } from '../@types/configuration/RecognitionConfiguration'
import { TRenderingConfiguration } from '../@types/configuration/RenderingConfiguration'
import { TServerConfiguration } from '../@types/configuration/ServerConfiguration'
import { TTriggerConfiguration } from '../@types/configuration/TriggerConfiguration'
import { DefaultConfiguration } from './DefaultConfiguration'

export class Configuration implements TConfiguration
{
  events: TEventConfiguration
  grabber: TGrabberConfiguration
  recognition: TRecognitionConfiguration
  rendering: TRenderingConfiguration
  server: TServerConfiguration
  triggers: TTriggerConfiguration

  constructor(configuration?: TConfigurationClient)
  {
    this.events = JSON.parse(JSON.stringify(DefaultConfiguration.events))
    this.grabber = JSON.parse(JSON.stringify(DefaultConfiguration.grabber))
    this.recognition = JSON.parse(JSON.stringify(DefaultConfiguration.recognition))
    this.rendering = JSON.parse(JSON.stringify(DefaultConfiguration.rendering))
    this.server = JSON.parse(JSON.stringify(DefaultConfiguration.server))
    this.triggers = JSON.parse(JSON.stringify(DefaultConfiguration.triggers))

    this.overrideDefaultConfiguration(configuration)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mergeDeep(target: any, ...sources: any[]): any
  {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const isObject = (item: any) =>
    {
      return (item && typeof item === 'object' && !Array.isArray(item))
    }
    if (!sources.length) return target
    const source = sources.shift()

    if (isObject(target) && isObject(source)) {
      for (const key in source) {
        if (isObject(source[key])) {
          if (!target[key]) {
            Object.assign(target, { [key]: {} })
          }
          this.mergeDeep(target[key], source[key])
        } else {
          Object.assign(target, { [key]: source[key] })
        }
      }
    }

    return this.mergeDeep(target, ...sources)
  }

  overrideDefaultConfiguration(configuration?: TConfigurationClient): void
  {
    if (configuration) {
      this.events = this.mergeDeep({}, DefaultConfiguration.events, configuration?.events)
      this.grabber = this.mergeDeep({}, DefaultConfiguration.grabber, configuration?.grabber)
      this.recognition = this.mergeDeep({}, DefaultConfiguration.recognition, configuration?.recognition)
      this.rendering = this.mergeDeep({}, DefaultConfiguration.rendering, configuration?.rendering)
      this.server = this.mergeDeep({}, DefaultConfiguration.server, configuration?.server)
      this.triggers = this.mergeDeep({}, DefaultConfiguration.triggers, configuration?.triggers)

      if (this.server?.useWindowLocation) {
        this.server.scheme = window.location.protocol.indexOf('s') > -1 ? 'https' : 'http'
        this.server.host = window.location.host
      }

      if (this.recognition.replaceMimeTypes) {
        this.recognition.text.mimeTypes = configuration?.recognition?.text?.mimeTypes || ['application/vnd.myscript.jiix']
        this.recognition.math.mimeTypes = configuration?.recognition?.math?.mimeTypes || ['application/vnd.myscript.jiix']
        this.recognition.diagram.mimeTypes = configuration?.recognition?.diagram?.mimeTypes || ['application/vnd.myscript.jiix']
        this.recognition.rawContent.mimeTypes = configuration?.recognition?.rawContent?.mimeTypes || ['application/vnd.myscript.jiix']
      }
    }

    if (
      this.server.protocol === 'REST' &&
      this.triggers.exportContent === 'POINTER_UP'
    ) {
      this.triggers.exportContent = 'QUIET_PERIOD'
      this.triggers.exportContentDelay = Math.max(this.triggers.exportContentDelay, 50)
    }

    if (
      this.server.protocol === 'WEBSOCKET' &&
      this.recognition.type === 'TEXT'
    ) {
      if (
        this.rendering.smartGuide.enable &&
        !this.recognition.text.mimeTypes.includes('application/vnd.myscript.jiix')
      ) {
        // mimeType required for smartGuide
        this.recognition.text.mimeTypes.push('application/vnd.myscript.jiix')
      }
    } else {
      // smartGuide enable only on websocket text
      this.rendering.smartGuide.enable = false
    }
  }
}
