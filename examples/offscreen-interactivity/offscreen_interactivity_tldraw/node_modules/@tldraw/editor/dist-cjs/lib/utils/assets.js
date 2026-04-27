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
var assets_exports = {};
__export(assets_exports, {
  dataUrlToFile: () => dataUrlToFile,
  getDefaultCdnBaseUrl: () => getDefaultCdnBaseUrl
});
module.exports = __toCommonJS(assets_exports);
var import_utils = require("@tldraw/utils");
var import_version = require("../../version");
function dataUrlToFile(url, filename, mimeType) {
  return (0, import_utils.fetch)(url).then(function(res) {
    return res.arrayBuffer();
  }).then(function(buf) {
    return new File([buf], filename, { type: mimeType });
  });
}
const CDN_BASE_URL = "https://cdn.tldraw.com";
function getDefaultCdnBaseUrl() {
  return `${CDN_BASE_URL}/${import_version.version}`;
}
//# sourceMappingURL=assets.js.map
