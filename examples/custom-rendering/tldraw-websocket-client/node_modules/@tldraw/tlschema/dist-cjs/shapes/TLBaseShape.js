"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var TLBaseShape_exports = {};
__export(TLBaseShape_exports, {
  createShapeValidator: () => createShapeValidator,
  parentIdValidator: () => parentIdValidator,
  shapeIdValidator: () => shapeIdValidator
});
module.exports = __toCommonJS(TLBaseShape_exports);
var import_validate = require("@tldraw/validate");
var import_TLOpacity = require("../misc/TLOpacity");
var import_id_validator = require("../misc/id-validator");
const parentIdValidator = import_validate.T.string.refine((id) => {
  if (!id.startsWith("page:") && !id.startsWith("shape:")) {
    throw new Error('Parent ID must start with "page:" or "shape:"');
  }
  return id;
});
const shapeIdValidator = (0, import_id_validator.idValidator)("shape");
function createShapeValidator(type, props, meta) {
  return import_validate.T.object({
    id: shapeIdValidator,
    typeName: import_validate.T.literal("shape"),
    x: import_validate.T.number,
    y: import_validate.T.number,
    rotation: import_validate.T.number,
    index: import_validate.T.indexKey,
    parentId: parentIdValidator,
    type: import_validate.T.literal(type),
    isLocked: import_validate.T.boolean,
    opacity: import_TLOpacity.opacityValidator,
    props: props ? import_validate.T.object(props) : import_validate.T.jsonValue,
    meta: meta ? import_validate.T.object(meta) : import_validate.T.jsonValue
  });
}
//# sourceMappingURL=TLBaseShape.js.map
