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
var apng_exports = {};
__export(apng_exports, {
  isApngAnimated: () => isApngAnimated
});
module.exports = __toCommonJS(apng_exports);
/*!
 * MIT License: https://github.com/vHeemstra/is-apng/blob/main/license
 * Copyright (c) Philip van Heemstra
 */
function isApngAnimated(buffer) {
  const view = new Uint8Array(buffer);
  if (!view || !(typeof Buffer !== "undefined" && Buffer.isBuffer(view) || view instanceof Uint8Array) || view.length < 16) {
    return false;
  }
  const isPNG = view[0] === 137 && view[1] === 80 && view[2] === 78 && view[3] === 71 && view[4] === 13 && view[5] === 10 && view[6] === 26 && view[7] === 10;
  if (!isPNG) {
    return false;
  }
  function indexOfSubstring(haystack, needle, fromIndex, upToIndex, chunksize = 1024) {
    if (!needle) {
      return -1;
    }
    needle = new RegExp(needle, "g");
    const needle_length = needle.source.length;
    const decoder = new TextDecoder();
    const full_haystack_length = haystack.length;
    if (typeof upToIndex === "undefined") {
      upToIndex = full_haystack_length;
    }
    if (fromIndex >= full_haystack_length || upToIndex <= 0 || fromIndex >= upToIndex) {
      return -1;
    }
    haystack = haystack.subarray(fromIndex, upToIndex);
    let position = -1;
    let current_index = 0;
    let full_length = 0;
    let needle_buffer = "";
    outer: while (current_index < haystack.length) {
      const next_index = current_index + chunksize;
      const chunk = haystack.subarray(current_index, next_index);
      const decoded = decoder.decode(chunk, { stream: true });
      const text = needle_buffer + decoded;
      let match;
      let last_index = -1;
      while ((match = needle.exec(text)) !== null) {
        last_index = match.index - needle_buffer.length;
        position = full_length + last_index;
        break outer;
      }
      current_index = next_index;
      full_length += decoded.length;
      const needle_index = last_index > -1 ? last_index + needle_length : decoded.length - needle_length;
      needle_buffer = decoded.slice(needle_index);
    }
    if (position >= 0) {
      position += fromIndex >= 0 ? fromIndex : full_haystack_length + fromIndex;
    }
    return position;
  }
  const idatIdx = indexOfSubstring(view, "IDAT", 12);
  if (idatIdx >= 12) {
    const actlIdx = indexOfSubstring(view, "acTL", 8, idatIdx);
    return actlIdx >= 8;
  }
  return false;
}
//# sourceMappingURL=apng.js.map
