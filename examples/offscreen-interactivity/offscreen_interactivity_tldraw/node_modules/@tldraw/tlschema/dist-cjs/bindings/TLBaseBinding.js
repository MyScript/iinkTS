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
var TLBaseBinding_exports = {};
__export(TLBaseBinding_exports, {
  bindingIdValidator: () => bindingIdValidator,
  createBindingValidator: () => createBindingValidator
});
module.exports = __toCommonJS(TLBaseBinding_exports);
var import_validate = require("@tldraw/validate");
var import_id_validator = require("../misc/id-validator");
var import_TLBaseShape = require("../shapes/TLBaseShape");
const bindingIdValidator = (0, import_id_validator.idValidator)("binding");
function createBindingValidator(type, props, meta) {
  return import_validate.T.object({
    id: bindingIdValidator,
    typeName: import_validate.T.literal("binding"),
    type: import_validate.T.literal(type),
    fromId: import_TLBaseShape.shapeIdValidator,
    toId: import_TLBaseShape.shapeIdValidator,
    props: props ? import_validate.T.object(props) : import_validate.T.jsonValue,
    meta: meta ? import_validate.T.object(meta) : import_validate.T.jsonValue
  });
}
//# sourceMappingURL=TLBaseBinding.js.map
