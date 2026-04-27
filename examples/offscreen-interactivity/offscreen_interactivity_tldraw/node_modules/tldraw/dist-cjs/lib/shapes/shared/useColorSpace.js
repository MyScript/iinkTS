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
var useColorSpace_exports = {};
__export(useColorSpace_exports, {
  useColorSpace: () => useColorSpace
});
module.exports = __toCommonJS(useColorSpace_exports);
var import_editor = require("@tldraw/editor");
var import_react = require("react");
function useColorSpace() {
  const [supportsP3, setSupportsP3] = (0, import_react.useState)(false);
  (0, import_react.useEffect)(() => {
    const supportsSyntax = CSS.supports("color", "color(display-p3 1 1 1)");
    const query = matchMedia("(color-gamut: p3)");
    setSupportsP3(supportsSyntax && query.matches);
    const onChange = () => setSupportsP3(supportsSyntax && query.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);
  const forceSrgb = (0, import_editor.useValue)(import_editor.debugFlags.forceSrgb);
  return forceSrgb || !supportsP3 ? "srgb" : "p3";
}
//# sourceMappingURL=useColorSpace.js.map
