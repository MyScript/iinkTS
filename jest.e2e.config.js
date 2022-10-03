export default {
  preset: 'jest-playwright-preset',

  testEnvironmentOptions: {
    'jest-playwright': {
      browsers: process.env.BROWSER ? [process.env.BROWSER] : ['chromium', 'firefox', 'webkit'],

      channel: process.env.CHANEL, // "chrome", "chrome-beta", "chrome-dev", "chrome-canary", "msedge"

      devices: process.env.DEVICE ? [process.env.DEVICE] : null,

      contextOptions: {
        baseURL: process.env.BASE_URL || 'http://localhost:8000',
        ignoreHTTPSErrors: true,
      },

      exitOnPageError: false,

      launchOptions: {
        headless: process.env.HEADLESS === 'false' ? false : true,
      },
    },
  },

  setupFilesAfterEnv: ['expect-playwright', './test/e2e/jest.setup.js'],

  testMatch: ['**/e2e/**/*.test.js'],

  transform: {
    '^.+\\.(ts|tsx)?$': 'ts-jest'
  },

  verbose: true,
}
