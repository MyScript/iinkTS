import { mergeDeep } from '../../../src/iink'

describe('merge', () => {
  const testDatas = [
    {
      source: {
        scheme: 'https',
        host: 'cloud.myscript.com',
        applicationKey: 'XXXX-XXXX-XXXX',
        hmacKey: 'YYYY-YYYY-YYYY',
        recognition: {
          text: {
            mimeTypes: ["application/vnd.myscript.jiix"],
          },
          math: {
            mimeTypes: ["application/vnd.myscript.jiix"],
            solver: {
              enable: false
            }
          },
          diagram: {
            mimeTypes: ["application/vnd.myscript.jiix"]
          }
        }
      },
      target: {
        scheme: 'http',
        host: 'cloud.preprod.myscript.com',
        applicationKey: 'AAAA-AAAA-AAAA-AAAA-AAAAAAAAAAAA',
        hmacKey: 'BBBBBBBB-BBBB-BBBB-BBBB-BBBBBBBBBBBB',
        recognition: {
          math: {
            mimeTypes: ["application/x-latex"],
            solver: {
              enable: true
            }
          },
          diagram: {
            mimeTypes: ["application/vnd.myscript.jiix", "application/vnd.openxmlformats-officedocument.presentationml.presentation", "image/svg+xml"]
          }
        }
      },
      expected: {
        scheme: 'http',
        host: 'cloud.preprod.myscript.com',
        applicationKey: 'AAAA-AAAA-AAAA-AAAA-AAAAAAAAAAAA',
        hmacKey: 'BBBBBBBB-BBBB-BBBB-BBBB-BBBBBBBBBBBB',
        recognition: {
          text: {
            mimeTypes: ["application/vnd.myscript.jiix"],
          },
          math: {
            mimeTypes: ["application/vnd.myscript.jiix", "application/x-latex"],
            solver: {
              enable: true
            }
          },
          diagram: {
            mimeTypes: ["application/vnd.myscript.jiix", "application/vnd.myscript.jiix", "application/vnd.openxmlformats-officedocument.presentationml.presentation", "image/svg+xml"]
          }
        }
      }
    }
  ]
  testDatas.forEach((d) => {
    test(`shoud mergeDeep ${JSON.stringify(d.source)} with ${JSON.stringify(d.target)} to ${JSON.stringify(d.expected)}`, () => {
      expect(mergeDeep(d.source, d.target)).toEqual(d.expected)
    })
  })
})
