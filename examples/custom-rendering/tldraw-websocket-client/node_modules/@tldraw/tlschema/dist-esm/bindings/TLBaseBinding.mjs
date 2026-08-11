import { T } from "@tldraw/validate";
import { idValidator } from "../misc/id-validator.mjs";
import { shapeIdValidator } from "../shapes/TLBaseShape.mjs";
const bindingIdValidator = idValidator("binding");
function createBindingValidator(type, props, meta) {
  return T.object({
    id: bindingIdValidator,
    typeName: T.literal("binding"),
    type: T.literal(type),
    fromId: shapeIdValidator,
    toId: shapeIdValidator,
    props: props ? T.object(props) : T.jsonValue,
    meta: meta ? T.object(meta) : T.jsonValue
  });
}
export {
  bindingIdValidator,
  createBindingValidator
};
//# sourceMappingURL=TLBaseBinding.mjs.map
