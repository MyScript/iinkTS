import typescriptEslint from "@typescript-eslint/eslint-plugin"
import tsParser from "@typescript-eslint/parser"
import globals from "globals"

import barrelImports from "../../config/eslint-plugin-barrel-imports.mjs"

export default [
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.jest
      },
    },
  },
  // Only this rule for now: the root config's unit-test block never applied here (this file is
  // the nearest config) and turning it on surfaces ~550 unrelated problems.
  {
    files: ["**/*.ts"],
    languageOptions: { parser: tsParser },
    // Loaded, not enabled: the existing `eslint-disable @typescript-eslint/...` comments must resolve
    linterOptions: { reportUnusedDisableDirectives: "off" },
    plugins: { "@typescript-eslint": typescriptEslint, iink: barrelImports },
    rules: { "iink/barrel-imports": ["error", { mode: "test" }] },
  },
]
