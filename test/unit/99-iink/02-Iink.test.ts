import { Editor, getAvailableLanguageList } from '../../../src/iink'

describe('Iink.ts', () =>
{
  test('should export getAvailableLanguageList', async () =>
  {
    expect(getAvailableLanguageList).toBeDefined()
  })
  test('should export Editor', async () =>
  {
    expect(Editor).toBeDefined()
  })


})