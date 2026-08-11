import { T } from "@tldraw/validate";
import { opacityValidator } from "../misc/TLOpacity.mjs";
import { idValidator } from "../misc/id-validator.mjs";
const parentIdValidator = T.string.refine((id) => {
  if (!id.startsWith("page:") && !id.startsWith("shape:")) {
    throw new Error('Parent ID must start with "page:" or "shape:"');
  }
  return id;
});
const shapeIdValidator = idValidator("shape");
function createShapeValidator(type, props, meta) {
  return T.object({
    id: shapeIdValidator,
    typeName: T.literal("shape"),
    x: T.number,
    y: T.number,
    rotation: T.number,
    index: T.indexKey,
    parentId: parentIdValidator,
    type: T.literal(type),
    isLocked: T.boolean,
    opacity: opacityValidator,
    props: props ? T.object(props) : T.jsonValue,
    meta: meta ? T.object(meta) : T.jsonValue
  });
}
export {
  createShapeValidator,
  parentIdValidator,
  shapeIdValidator
};
//# sourceMappingURL=TLBaseShape.mjs.map
