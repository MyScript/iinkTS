import { Editor } from "../../../src/Editor"
import { DefaultConfiguration } from "../../../src/configuration/DefaultConfiguration"
import { AllOverrideConfiguration } from "../_dataset/configuration.dataset"


describe('Editor.ts', () =>
{
  const wrapperHTML: HTMLElement = document.createElement('div')

  test('should create Editor with default configuration', () =>
  {
    const editor = new Editor(wrapperHTML)

    expect(editor.configuration.events).toStrictEqual(DefaultConfiguration.events)
    expect(editor.configuration.grabber).toStrictEqual(DefaultConfiguration.grabber)
    expect(editor.configuration.recognition).toStrictEqual(DefaultConfiguration.recognition)
    expect(editor.configuration.rendering).toStrictEqual(DefaultConfiguration.rendering)
    expect(editor.configuration.server).toStrictEqual(DefaultConfiguration.server)
    expect(editor.configuration.triggers).toStrictEqual(DefaultConfiguration.triggers)
  })

  test('should override default configuration', () =>
  {
    const editor = new Editor(wrapperHTML)

    expect(editor.configuration.events).toStrictEqual(DefaultConfiguration.events)
    expect(editor.configuration.grabber).toStrictEqual(DefaultConfiguration.grabber)
    expect(editor.configuration.recognition).toStrictEqual(DefaultConfiguration.recognition)
    expect(editor.configuration.rendering).toStrictEqual(DefaultConfiguration.rendering)
    expect(editor.configuration.server).toStrictEqual(DefaultConfiguration.server)
    expect(editor.configuration.triggers).toStrictEqual(DefaultConfiguration.triggers)

    editor.configuration = AllOverrideConfiguration

    expect(editor.configuration.events).toStrictEqual(AllOverrideConfiguration.events)
    expect(editor.configuration.grabber).toStrictEqual(AllOverrideConfiguration.grabber)
    expect(editor.configuration.recognition).toStrictEqual(AllOverrideConfiguration.recognition)
    expect(editor.configuration.rendering).toStrictEqual(AllOverrideConfiguration.rendering)
    expect(editor.configuration.server).toStrictEqual(AllOverrideConfiguration.server)
    expect(editor.configuration.triggers).toStrictEqual(AllOverrideConfiguration.triggers)
  })

})