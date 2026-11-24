import path from "path"

type TJestTransformResult = {
  code: string
}

export default {
  process(_sourceText: string, sourcePath: string, _options: unknown): TJestTransformResult {
    return {
      code: `module.exports = ${JSON.stringify(path.basename(sourcePath))};`,
    }
  },
}
