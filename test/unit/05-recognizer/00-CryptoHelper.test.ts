import { computeHmac } from '../../../src/recognizer/CryptoHelper'

describe('CryptoHelper.ts', () =>
{
  test('should computeHmac', () =>
  {
    const computedHmac = computeHmac('Message', 'AppKey', 'HMACKey')
    expect(computedHmac)
      .toBe('b4d62a1900a4010a140e31fc4a07b6445499e6c7488f3214962427b2d539056182d0990f4d042ace794704f03dc6fdc2f73e25dd6ea35d3e0fd537d1dd4c1223')
  })

})
