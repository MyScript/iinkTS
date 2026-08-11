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
var useTransform_exports = {};
__export(useTransform_exports, {
  useTransform: () => useTransform
});
module.exports = __toCommonJS(useTransform_exports);
var import_react = require("react");
function useTransform(ref, x, y, scale, rotate, additionalOffset) {
  (0, import_react.useLayoutEffect)(() => {
    const elm = ref.current;
    if (!elm) return;
    if (x === void 0) return;
    let trans = `translate(${x}px, ${y}px)`;
    if (scale !== void 0) {
      trans += ` scale(${scale})`;
    }
    if (rotate !== void 0) {
      trans += ` rotate(${rotate}rad)`;
    }
    if (additionalOffset) {
      trans += ` translate(${additionalOffset.x}px, ${additionalOffset.y}px)`;
    }
    elm.style.transform = trans;
  });
}
//# sourceMappingURL=useTransform.js.map
