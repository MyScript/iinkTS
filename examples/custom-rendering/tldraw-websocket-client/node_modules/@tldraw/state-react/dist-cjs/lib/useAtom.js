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
var useAtom_exports = {};
__export(useAtom_exports, {
  useAtom: () => useAtom
});
module.exports = __toCommonJS(useAtom_exports);
var import_state = require("@tldraw/state");
var import_react = require("react");
function useAtom(name, valueOrInitialiser, options) {
  return (0, import_react.useState)(() => {
    const initialValue = typeof valueOrInitialiser === "function" ? valueOrInitialiser() : valueOrInitialiser;
    return (0, import_state.atom)(`useAtom(${name})`, initialValue, options);
  })[0];
}
//# sourceMappingURL=useAtom.js.map
