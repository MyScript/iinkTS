import { T } from "@tldraw/validate";
import { idValidator } from "../misc/id-validator.mjs";
const assetIdValidator = idValidator("asset");
function createAssetValidator(type, props) {
  return T.object({
    id: assetIdValidator,
    typeName: T.literal("asset"),
    type: T.literal(type),
    props,
    meta: T.jsonValue
  });
}
export {
  assetIdValidator,
  createAssetValidator
};
//# sourceMappingURL=TLBaseAsset.mjs.map
