import globals from "globals"

export default {
  extends: [
    "../../eslint.config.mjs"
  ],
  languageOptions: {
    globals: {
      ...globals.browser,
      ...globals.node,
      ...globals.jest
    },
  },
}
