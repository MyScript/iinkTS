import { DefaultEraserConfiguration } from "./EraserConfiguration";
import { TRawContentConfiguration } from "./RawContentConfiguration";

/**
 * @group Recognizer
 * @source
 */
export const DefaultRawContentV2Configuration: TRawContentConfiguration = {
  recognition: {
    types: [ "text", "math", "shape"]
  },
  classification: {
    types: [ "text", "math", "shape", "decoration", "drawing"]
  },
  eraser: DefaultEraserConfiguration,
}
