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
var setUtils_exports = {};
__export(setUtils_exports, {
  diffSets: () => diffSets,
  intersectSets: () => intersectSets
});
module.exports = __toCommonJS(setUtils_exports);
function intersectSets(sets) {
  if (sets.length === 0) return /* @__PURE__ */ new Set();
  const first = sets[0];
  const rest = sets.slice(1);
  const result = /* @__PURE__ */ new Set();
  for (const val of first) {
    if (rest.every((set) => set.has(val))) {
      result.add(val);
    }
  }
  return result;
}
function diffSets(prev, next) {
  const result = {};
  for (const val of next) {
    if (!prev.has(val)) {
      result.added ??= /* @__PURE__ */ new Set();
      result.added.add(val);
    }
  }
  for (const val of prev) {
    if (!next.has(val)) {
      result.removed ??= /* @__PURE__ */ new Set();
      result.removed.add(val);
    }
  }
  return result.added || result.removed ? result : void 0;
}
//# sourceMappingURL=setUtils.js.map
