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
var id_exports = {};
__export(id_exports, {
  mockUniqueId: () => mockUniqueId,
  restoreUniqueId: () => restoreUniqueId,
  uniqueId: () => uniqueId
});
module.exports = __toCommonJS(id_exports);
/*!
 * MIT License: https://github.com/ai/nanoid/blob/main/LICENSE
 * Modified code originally from <https://github.com/ai/nanoid>
 * Copyright 2017 Andrey Sitnik <andrey@sitnik.ru>
 *
 * `nanoid` is currently only distributed as an ES module. Some tools (jest, playwright) don't
 * properly support ESM-only code yet, and tldraw itself is distributed as both an ES module and a
 * CommonJS module. By including nanoid here, we can make sure it works well in every environment
 * where tldraw is used. We can also remove some unused features like custom alphabets.
 */
const crypto = globalThis.crypto;
const urlAlphabet = "useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict";
const POOL_SIZE_MULTIPLIER = 128;
let pool, poolOffset;
function fillPool(bytes) {
  if (!pool || pool.length < bytes) {
    pool = new Uint8Array(bytes * POOL_SIZE_MULTIPLIER);
    crypto.getRandomValues(pool);
    poolOffset = 0;
  } else if (poolOffset + bytes > pool.length) {
    crypto.getRandomValues(pool);
    poolOffset = 0;
  }
  poolOffset += bytes;
}
function nanoid(size = 21) {
  fillPool(size -= 0);
  let id = "";
  for (let i = poolOffset - size; i < poolOffset; i++) {
    id += urlAlphabet[pool[i] & 63];
  }
  return id;
}
let impl = nanoid;
function mockUniqueId(fn) {
  impl = fn;
}
function restoreUniqueId() {
  impl = nanoid;
}
function uniqueId(size) {
  return impl(size);
}
//# sourceMappingURL=id.js.map
