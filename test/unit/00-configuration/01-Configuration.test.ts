import { DefaultConfiguration } from "../../../src/configuration/DefaultConfiguration"
import { Configuration } from "../../../src/configuration/Configuration"
import
{
  ConfigurationTextWebsocket,
  ConfigurationTextRest,
  ConfigurationDiagramRest,
  ConfigurationRawContentRest,
  AllOverrideConfiguration,
  ConfigurationReplaceMimeType,
  ConfigurationReplaceMimeTypeEmpty
} from "../_dataset/configuration.dataset"
import { TConfiguration, TConfigurationClient } from "../../../src/@types/Configuration"

const configurationDefault = new Configuration()

describe('Configuration.ts', () =>
{
  test('should be default configuration', () =>
  {
    expect(configurationDefault.events).toStrictEqual(DefaultConfiguration.events)
    expect(configurationDefault.grabber).toStrictEqual(DefaultConfiguration.grabber)
    expect(configurationDefault.recognition).toStrictEqual(DefaultConfiguration.recognition)
    expect(configurationDefault.rendering).toStrictEqual(DefaultConfiguration.rendering)
    expect(configurationDefault.server).toStrictEqual(DefaultConfiguration.server)
    expect(configurationDefault.triggers).toStrictEqual(DefaultConfiguration.triggers)
  })

  const configurationsClient: { name: string, config: TConfigurationClient }[] = [
    { name: 'ConfigurationTextWebsocket', config: ConfigurationTextWebsocket },
    { name: 'ConfigurationTextRest', config: ConfigurationTextRest },
    { name: 'ConfigurationDiagramRest', config: ConfigurationDiagramRest },
    { name: 'ConfigurationRawContentRest', config: ConfigurationRawContentRest }
  ]

  configurationsClient.forEach(cc =>
  {
    const configuration: TConfiguration = new Configuration(cc.config)
    describe(`should merge ${ cc.name } with DefaultConfiguration`, () =>
    {
      test('should have server.protocol', () =>
      {
        expect(configuration.server.protocol).toStrictEqual(cc.config?.server?.protocol)
      })
      test('should have server.scheme', () =>
      {
        expect(configuration.server.scheme).toStrictEqual(cc.config?.server?.scheme)
      })
      test('should have server.host', () =>
      {
        expect(configuration.server.host).toStrictEqual(cc.config?.server?.host)
      })
      test('should have server.applicationKey', () =>
      {
        expect(configuration.server.applicationKey).toStrictEqual(cc.config?.server?.applicationKey)
      })
      test('should have server.hmacKey', () =>
      {
        expect(configuration.server.hmacKey).toStrictEqual(cc.config?.server?.hmacKey)
      })
      test('should have default server.websocket', () =>
      {
        expect(configuration.server.websocket).toStrictEqual(configurationDefault.server.websocket)
      })
      test('should have recognition.type', () =>
      {
        expect(configuration.recognition.type).toStrictEqual(cc.config?.recognition?.type)
      })
      test('should have recognition.text.mimeTypes', () =>
      {
        expect(configuration.recognition.text.mimeTypes).toStrictEqual(cc.config?.recognition?.text?.mimeTypes)
      })
    })
  })

  describe('should override all values', () =>
  {
    const overrideConfig: TConfiguration = new Configuration(AllOverrideConfiguration)

    test('should override events', () =>
    {
      expect(overrideConfig.events).toStrictEqual(AllOverrideConfiguration.events)
    })

    test('should override grabber', () =>
    {
      expect(overrideConfig.grabber).toStrictEqual(AllOverrideConfiguration.grabber)
    })

    test('should override recognition', () =>
    {
      expect(overrideConfig.recognition).toStrictEqual(AllOverrideConfiguration.recognition)
    })

    test('should override rendering', () =>
    {
      expect(overrideConfig.rendering).toStrictEqual(AllOverrideConfiguration.rendering)
    })

    test('should override server', () =>
    {
      expect(overrideConfig.server).toStrictEqual(AllOverrideConfiguration.server)
    })

    test('should override triggers', () =>
    {
      expect(overrideConfig.triggers).toStrictEqual(AllOverrideConfiguration.triggers)
    })
  })

  describe('should replaceMimeTypes', () =>
  {
    test('should replace mimeType', () =>
    {
      const crm: TConfiguration = new Configuration(ConfigurationReplaceMimeType)
      expect(crm.recognition.diagram.mimeTypes).toStrictEqual(ConfigurationReplaceMimeType.recognition?.diagram?.mimeTypes)
      expect(crm.recognition.math.mimeTypes).toStrictEqual(ConfigurationReplaceMimeType.recognition?.math?.mimeTypes)
      expect(crm.recognition.rawContent.mimeTypes).toStrictEqual(ConfigurationReplaceMimeType.recognition?.rawContent?.mimeTypes)
      expect(crm.recognition.text.mimeTypes).toStrictEqual(ConfigurationReplaceMimeType.recognition?.text?.mimeTypes)
    })

    test('should set mimeType JIIX if replaceMimeTypes but mimeTypes empty', () =>
    {
      const crme: TConfiguration = new Configuration(ConfigurationReplaceMimeTypeEmpty)
      expect(crme.recognition.diagram.mimeTypes).toStrictEqual(['application/vnd.myscript.jiix'])
      expect(crme.recognition.math.mimeTypes).toStrictEqual(['application/vnd.myscript.jiix'])
      expect(crme.recognition.rawContent.mimeTypes).toStrictEqual(['application/vnd.myscript.jiix'])
      expect(crme.recognition.text.mimeTypes).toStrictEqual(['application/vnd.myscript.jiix'])
    })

  })

  describe('specifics rules', () =>
  {

    test('should add mimeType JIIX if rendering.smartGuide = true', () =>
    {
      const conf = { ...DefaultConfiguration }
      conf.server.protocol = "WEBSOCKET"
      conf.recognition.type = "TEXT"
      conf.rendering.smartGuide.enable = true
      expect(conf.recognition.text.mimeTypes).not.toContain('application/vnd.myscript.jiix')
      const c: TConfiguration = new Configuration(conf)
      expect(c.recognition.text.mimeTypes).toContain('application/vnd.myscript.jiix')
    })

    test('should set rendering.smartGuide = false if not REST', () =>
    {
      const conf = { ...DefaultConfiguration }
      conf.server.protocol = "REST"
      conf.rendering.smartGuide.enable = true
      const c: TConfiguration = new Configuration(conf)
      expect(c.rendering.smartGuide.enable).toStrictEqual(false)
    })

    test('should set rendering.smartGuide = false if not TEXT', () =>
    {
      const conf = { ...DefaultConfiguration }
      conf.recognition.type = "MATH"
      conf.rendering.smartGuide.enable = true
      const c: TConfiguration = new Configuration(conf)
      expect(c.rendering.smartGuide.enable).toStrictEqual(false)
    })

    test('should set server.schme & server.host if server.useWindowLocation = true', () =>
    {
      const conf = { ...DefaultConfiguration }
      conf.server.useWindowLocation = true

      Object.defineProperty(window, "location", {
        value: new URL('https://localhost:3000')
      } );

      const c: TConfiguration = new Configuration(conf)
      expect(c.server.scheme).toStrictEqual(window.location.protocol.replace(':', ''))
      expect(c.server.host).toStrictEqual(window.location.host)
    })

  })

})