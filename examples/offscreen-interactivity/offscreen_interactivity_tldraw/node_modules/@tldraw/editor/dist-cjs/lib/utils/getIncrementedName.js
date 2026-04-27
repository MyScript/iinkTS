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
var getIncrementedName_exports = {};
__export(getIncrementedName_exports, {
  getIncrementedName: () => getIncrementedName
});
module.exports = __toCommonJS(getIncrementedName_exports);
function getIncrementedName(name, others) {
  let result = name;
  const set = new Set(others);
  while (set.has(result)) {
    result = /^.*(\d+)$/.exec(result)?.[1] ? result.replace(/(\d+)(?=\D?)$/, (m) => {
      return (+m + 1).toString();
    }) : `${result} 1`;
  }
  return result;
}
//# sourceMappingURL=getIncrementedName.js.map
