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
var constants_exports = {};
__export(constants_exports, {
  PORTRAIT_BREAKPOINT: () => PORTRAIT_BREAKPOINT,
  PORTRAIT_BREAKPOINTS: () => PORTRAIT_BREAKPOINTS
});
module.exports = __toCommonJS(constants_exports);
const PORTRAIT_BREAKPOINTS = [0, 389, 436, 476, 580, 640, 840, 1023];
var PORTRAIT_BREAKPOINT = /* @__PURE__ */ ((PORTRAIT_BREAKPOINT2) => {
  PORTRAIT_BREAKPOINT2[PORTRAIT_BREAKPOINT2["ZERO"] = 0] = "ZERO";
  PORTRAIT_BREAKPOINT2[PORTRAIT_BREAKPOINT2["MOBILE_XXS"] = 1] = "MOBILE_XXS";
  PORTRAIT_BREAKPOINT2[PORTRAIT_BREAKPOINT2["MOBILE_XS"] = 2] = "MOBILE_XS";
  PORTRAIT_BREAKPOINT2[PORTRAIT_BREAKPOINT2["MOBILE_SM"] = 3] = "MOBILE_SM";
  PORTRAIT_BREAKPOINT2[PORTRAIT_BREAKPOINT2["MOBILE"] = 4] = "MOBILE";
  PORTRAIT_BREAKPOINT2[PORTRAIT_BREAKPOINT2["TABLET_SM"] = 5] = "TABLET_SM";
  PORTRAIT_BREAKPOINT2[PORTRAIT_BREAKPOINT2["TABLET"] = 6] = "TABLET";
  PORTRAIT_BREAKPOINT2[PORTRAIT_BREAKPOINT2["DESKTOP"] = 7] = "DESKTOP";
  return PORTRAIT_BREAKPOINT2;
})(PORTRAIT_BREAKPOINT || {});
//# sourceMappingURL=constants.js.map
