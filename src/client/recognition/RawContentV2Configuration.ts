import { DefaultEraserConfiguration } from "./EraserConfiguration"
import type { TRawContentConfiguration } from "./RawContentConfiguration"

/**
 * @group Client
 * @source
 */
export const DefaultRawContentV2Configuration: TRawContentConfiguration = {
  recognition: {
    types: ["text", "math", "shape"],
  },
  classification: {
    types: ["text", "math", "shape", "decoration", "drawing"],
  },
  eraser: DefaultEraserConfiguration,
}
