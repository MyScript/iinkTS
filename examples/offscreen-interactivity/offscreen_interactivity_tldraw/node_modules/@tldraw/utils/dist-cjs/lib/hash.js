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
var hash_exports = {};
__export(hash_exports, {
  getHashForBuffer: () => getHashForBuffer,
  getHashForObject: () => getHashForObject,
  getHashForString: () => getHashForString,
  lns: () => lns
});
module.exports = __toCommonJS(hash_exports);
function getHashForString(string) {
  let hash = 0;
  for (let i = 0; i < string.length; i++) {
    hash = (hash << 5) - hash + string.charCodeAt(i);
    hash |= 0;
  }
  return hash + "";
}
function getHashForObject(obj) {
  return getHashForString(JSON.stringify(obj));
}
function getHashForBuffer(buffer) {
  const view = new DataView(buffer);
  let hash = 0;
  for (let i = 0; i < view.byteLength; i++) {
    hash = (hash << 5) - hash + view.getUint8(i);
    hash |= 0;
  }
  return hash + "";
}
function lns(str) {
  const result = str.split("");
  result.push(...result.splice(0, Math.round(result.length / 5)));
  result.push(...result.splice(0, Math.round(result.length / 4)));
  result.push(...result.splice(0, Math.round(result.length / 3)));
  result.push(...result.splice(0, Math.round(result.length / 2)));
  return result.reverse().map((n) => +n ? +n < 5 ? 5 + +n : +n > 5 ? +n - 5 : n : n).join("");
}
//# sourceMappingURL=hash.js.map
