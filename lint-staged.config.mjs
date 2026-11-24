// Lints and formats (Prettier runs through ESLint) only the staged files.
// Run by .husky/pre-commit; the Jenkinsfile still runs the full `yarn lint`.
export default {
  "{src,perf,test/unit}/**/*.ts": "eslint --fix",
  "test/examples/**/*.ts": "eslint --config=./test/examples/eslint.config.mjs --fix",
};
