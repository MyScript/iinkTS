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
var licensing_exports = {};
__export(licensing_exports, {
  importPublicKey: () => importPublicKey,
  str2ab: () => str2ab
});
module.exports = __toCommonJS(licensing_exports);
function str2ab(str) {
  const buf = new ArrayBuffer(str.length);
  const bufView = new Uint8Array(buf);
  for (let i = 0, strLen = str.length; i < strLen; i++) {
    bufView[i] = str.charCodeAt(i);
  }
  return buf;
}
function importPublicKey(pemContents) {
  const binaryDerString = atob(pemContents);
  const binaryDer = str2ab(binaryDerString);
  return crypto.subtle.importKey(
    "spki",
    new Uint8Array(binaryDer),
    {
      name: "ECDSA",
      namedCurve: "P-256"
    },
    true,
    ["verify"]
  );
}
//# sourceMappingURL=licensing.js.map
