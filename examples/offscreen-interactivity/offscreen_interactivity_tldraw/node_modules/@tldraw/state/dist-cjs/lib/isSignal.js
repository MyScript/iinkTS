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
var isSignal_exports = {};
__export(isSignal_exports, {
  isSignal: () => isSignal
});
module.exports = __toCommonJS(isSignal_exports);
var import_Atom = require("./Atom");
var import_Computed = require("./Computed");
function isSignal(value) {
  return value instanceof import_Atom._Atom || value instanceof import_Computed._Computed;
}
//# sourceMappingURL=isSignal.js.map
