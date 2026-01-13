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
var useRefState_exports = {};
__export(useRefState_exports, {
  useRefState: () => useRefState
});
module.exports = __toCommonJS(useRefState_exports);
var import_react = require("react");
function useRefState(initialValue) {
  const ref = (0, import_react.useRef)(initialValue);
  const [state, setState] = (0, import_react.useState)(initialValue);
  if (state !== ref.current) {
    setState(ref.current);
  }
  const update = (0, import_react.useCallback)((value) => {
    if (typeof value === "function") {
      ref.current = value(ref.current);
    } else {
      ref.current = value;
    }
    setState(ref.current);
  }, []);
  return [state, update];
}
//# sourceMappingURL=useRefState.js.map
