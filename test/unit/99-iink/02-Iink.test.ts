import {
  Editor,
  getAvailableLanguageList,
  getAvailableFontList,
  DefaultConfiguration,
  DefaultEventsConfiguration,
  DefaultGrabberConfiguration,
  DefaultRecognitionConfiguration,
  DefaultRenderingConfiguration,
  DefaultServerConfiguration,
  DefaultTriggerConfiguration,
  DefaultUndoRedoConfiguration,
  RestBehaviors,
  WSBehaviors,
  DefaultPenStyle,
  DefaultTheme,
} from '../../../src/iink'

describe('Iink.ts', () =>
{
  test('should export getAvailableLanguageList', async () =>
  {
    expect(getAvailableLanguageList).toBeDefined()
  })
  test('should export getAvailableFontList', async () =>
  {
    expect(getAvailableFontList).toBeDefined()
  })
  test('should export Editor', async () =>
  {
    expect(Editor).toBeDefined()
  })
  test('should export DefaultConfiguration', async () =>
  {
    expect(DefaultConfiguration).toBeDefined()
  })
  test('should export DefaultEventsConfiguration', async () =>
  {
    expect(DefaultEventsConfiguration).toBeDefined()
  })
  test('should export DefaultGrabberConfiguration', async () =>
  {
    expect(DefaultGrabberConfiguration).toBeDefined()
  })
  test('should export DefaultRecognitionConfiguration', async () =>
  {
    expect(DefaultRecognitionConfiguration).toBeDefined()
  })
  test('should export DefaultRenderingConfiguration', async () =>
  {
    expect(DefaultRenderingConfiguration).toBeDefined()
  })
  test('should export DefaultServerConfiguration', async () =>
  {
    expect(DefaultServerConfiguration).toBeDefined()
  })
  test('should export DefaultTriggerConfiguration', async () =>
  {
    expect(DefaultTriggerConfiguration).toBeDefined()
  })
  test('should export DefaultUndoRedoConfiguration', async () =>
  {
    expect(DefaultUndoRedoConfiguration).toBeDefined()
  })
  test('should export RestBehaviors', async () =>
  {
    expect(RestBehaviors).toBeDefined()
  })
  test('should export WSBehaviors', async () =>
  {
    expect(WSBehaviors).toBeDefined()
  })
  test('should export DefaultPenStyle', async () =>
  {
    expect(DefaultPenStyle).toBeDefined()
  })
  test('should export DefaultTheme', async () =>
  {
    expect(DefaultTheme).toBeDefined()
  })


})
