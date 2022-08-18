module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: [
    '@typescript-eslint',
  ],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  env: {
    "browser": true,
    "es6": true
  },
  rules: {
    "@typescript-eslint/no-explicit-any": 1
  }
};