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
var useComputed_exports = {};
__export(useComputed_exports, {
  useComputed: () => useComputed
});
module.exports = __toCommonJS(useComputed_exports);
var import_state = require("@tldraw/state");
var import_react = require("react");
function useComputed() {
  const name = arguments[0];
  const compute = arguments[1];
  const opts = arguments.length === 3 ? void 0 : arguments[2];
  const deps = arguments.length === 3 ? arguments[2] : arguments[3];
  return (0, import_react.useMemo)(() => (0, import_state.computed)(`useComputed(${name})`, compute, opts), deps);
}
//# sourceMappingURL=useComputed.js.map
