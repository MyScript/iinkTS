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
var TLBaseAsset_exports = {};
__export(TLBaseAsset_exports, {
  assetIdValidator: () => assetIdValidator,
  createAssetValidator: () => createAssetValidator
});
module.exports = __toCommonJS(TLBaseAsset_exports);
var import_validate = require("@tldraw/validate");
var import_id_validator = require("../misc/id-validator");
const assetIdValidator = (0, import_id_validator.idValidator)("asset");
function createAssetValidator(type, props) {
  return import_validate.T.object({
    id: assetIdValidator,
    typeName: import_validate.T.literal("asset"),
    type: import_validate.T.literal(type),
    props,
    meta: import_validate.T.jsonValue
  });
}
//# sourceMappingURL=TLBaseAsset.js.map
