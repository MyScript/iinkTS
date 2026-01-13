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
var geometry_types_exports = {};
__export(geometry_types_exports, {
  boxModelValidator: () => boxModelValidator,
  vecModelValidator: () => vecModelValidator
});
module.exports = __toCommonJS(geometry_types_exports);
var import_validate = require("@tldraw/validate");
const vecModelValidator = import_validate.T.object({
  x: import_validate.T.number,
  y: import_validate.T.number,
  z: import_validate.T.number.optional()
});
const boxModelValidator = import_validate.T.object({
  x: import_validate.T.number,
  y: import_validate.T.number,
  w: import_validate.T.number,
  h: import_validate.T.number
});
//# sourceMappingURL=geometry-types.js.map
