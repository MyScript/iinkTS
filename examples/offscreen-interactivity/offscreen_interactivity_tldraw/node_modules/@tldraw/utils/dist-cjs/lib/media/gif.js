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
var gif_exports = {};
__export(gif_exports, {
  isGIF: () => isGIF,
  isGifAnimated: () => isGifAnimated
});
module.exports = __toCommonJS(gif_exports);
/*!
 * MIT License
 * Modified code originally from <https://github.com/qzb/is-animated>
 * Copyright (c) 2016 Józef Sokołowski <j.k.sokolowski@gmail.com>
 */
function getDataBlocksLength(buffer, offset) {
  let length = 0;
  while (buffer[offset + length]) {
    length += buffer[offset + length] + 1;
  }
  return length + 1;
}
function isGIF(buffer) {
  const enc = new TextDecoder("ascii");
  const header = enc.decode(buffer.slice(0, 3));
  return header === "GIF";
}
function isGifAnimated(buffer) {
  const view = new Uint8Array(buffer);
  let hasColorTable, colorTableSize;
  let offset = 0;
  let imagesCount = 0;
  if (!isGIF(buffer)) {
    return false;
  }
  hasColorTable = view[10] & 128;
  colorTableSize = view[10] & 7;
  offset += 6;
  offset += 7;
  offset += hasColorTable ? 3 * Math.pow(2, colorTableSize + 1) : 0;
  while (imagesCount < 2 && offset < view.length) {
    switch (view[offset]) {
      // Image descriptor block. According to specification there could be any
      // number of these blocks (even zero). When there is more than one image
      // descriptor browsers will display animation (they shouldn't when there
      // is no delays defined, but they do it anyway).
      case 44:
        imagesCount += 1;
        hasColorTable = view[offset + 9] & 128;
        colorTableSize = view[offset + 9] & 7;
        offset += 10;
        offset += hasColorTable ? 3 * Math.pow(2, colorTableSize + 1) : 0;
        offset += getDataBlocksLength(view, offset + 1) + 1;
        break;
      // Skip all extension blocks. In theory this "plain text extension" blocks
      // could be frames of animation, but no browser renders them.
      case 33:
        offset += 2;
        offset += getDataBlocksLength(view, offset);
        break;
      // Stop processing on trailer block,
      // all data after this point will is ignored by decoders
      case 59:
        offset = view.length;
        break;
      // Oops! This GIF seems to be invalid
      default:
        offset = view.length;
        break;
    }
  }
  return imagesCount > 1;
}
//# sourceMappingURL=gif.js.map
