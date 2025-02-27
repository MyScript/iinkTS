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
var error_exports = {};
__export(error_exports, {
  annotateError: () => annotateError,
  getErrorAnnotations: () => getErrorAnnotations
});
module.exports = __toCommonJS(error_exports);
const annotationsByError = /* @__PURE__ */ new WeakMap();
function annotateError(error, annotations) {
  if (typeof error !== "object" || error === null) return;
  let currentAnnotations = annotationsByError.get(error);
  if (!currentAnnotations) {
    currentAnnotations = { tags: {}, extras: {} };
    annotationsByError.set(error, currentAnnotations);
  }
  if (annotations.tags) {
    currentAnnotations.tags = {
      ...currentAnnotations.tags,
      ...annotations.tags
    };
  }
  if (annotations.extras) {
    currentAnnotations.extras = {
      ...currentAnnotations.extras,
      ...annotations.extras
    };
  }
}
function getErrorAnnotations(error) {
  return annotationsByError.get(error) ?? { tags: {}, extras: {} };
}
//# sourceMappingURL=error.js.map
