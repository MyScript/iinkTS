/* eslint-disable no-undef */
module.exports = {
  parserOptions: {
    parser: '@typescript-eslint/parser',
  },
  plugins: [
    '@typescript-eslint'
  ],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:playwright/jest-playwright',
  ],
  env: {
    browser: true,
    node: true,
    es6: true,
  },
  rules: {
    '@typescript-eslint/no-explicit-any': 1,
    '@typescript-eslint/no-var-requires': 1,
  },
}
