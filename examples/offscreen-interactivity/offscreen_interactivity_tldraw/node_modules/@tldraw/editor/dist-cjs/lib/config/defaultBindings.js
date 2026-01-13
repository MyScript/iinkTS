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
var defaultBindings_exports = {};
__export(defaultBindings_exports, {
  checkBindings: () => checkBindings
});
module.exports = __toCommonJS(defaultBindings_exports);
function checkBindings(customBindings) {
  const bindings = [];
  const addedCustomBindingTypes = /* @__PURE__ */ new Set();
  for (const customBinding of customBindings) {
    if (addedCustomBindingTypes.has(customBinding.type)) {
      throw new Error(`Binding type "${customBinding.type}" is defined more than once`);
    }
    bindings.push(customBinding);
    addedCustomBindingTypes.add(customBinding.type);
  }
  return bindings;
}
//# sourceMappingURL=defaultBindings.js.map
