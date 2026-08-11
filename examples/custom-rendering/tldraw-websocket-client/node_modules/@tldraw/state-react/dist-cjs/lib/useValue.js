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
var useValue_exports = {};
__export(useValue_exports, {
  useValue: () => useValue
});
module.exports = __toCommonJS(useValue_exports);
var import_state = require("@tldraw/state");
var import_react = require("react");
function useValue() {
  const args = arguments;
  const deps = args.length === 3 ? args[2] : [args[0]];
  const name = args.length === 3 ? args[0] : `useValue(${args[0].name})`;
  const { $val, subscribe, getSnapshot } = (0, import_react.useMemo)(() => {
    const $val2 = args.length === 1 ? args[0] : (0, import_state.computed)(name, args[1]);
    return {
      $val: $val2,
      subscribe: (notify) => {
        return (0, import_state.react)(`useValue(${name})`, () => {
          try {
            $val2.get();
          } catch {
          }
          notify();
        });
      },
      getSnapshot: () => $val2.lastChangedEpoch
    };
  }, deps);
  (0, import_react.useSyncExternalStore)(subscribe, getSnapshot, getSnapshot);
  return $val.__unsafe__getWithoutCapture();
}
//# sourceMappingURL=useValue.js.map
