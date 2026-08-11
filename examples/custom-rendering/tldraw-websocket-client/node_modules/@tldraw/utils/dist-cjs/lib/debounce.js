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
var debounce_exports = {};
__export(debounce_exports, {
  debounce: () => debounce
});
module.exports = __toCommonJS(debounce_exports);
function debounce(callback, wait) {
  let state = void 0;
  const fn = (...args) => {
    if (!state) {
      state = {};
      state.promise = new Promise((resolve, reject) => {
        state.resolve = resolve;
        state.reject = reject;
      });
    }
    clearTimeout(state.timeout);
    state.latestArgs = args;
    state.timeout = setTimeout(() => {
      const s = state;
      state = void 0;
      try {
        s.resolve(callback(...s.latestArgs));
      } catch (e) {
        s.reject(e);
      }
    }, wait);
    return state.promise;
  };
  fn.cancel = () => {
    if (!state) return;
    clearTimeout(state.timeout);
  };
  return fn;
}
//# sourceMappingURL=debounce.js.map
