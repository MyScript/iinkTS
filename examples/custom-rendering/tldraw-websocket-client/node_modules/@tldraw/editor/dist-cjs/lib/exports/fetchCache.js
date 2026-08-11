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
var fetchCache_exports = {};
__export(fetchCache_exports, {
  fetchCache: () => fetchCache,
  resourceToDataUrl: () => resourceToDataUrl
});
module.exports = __toCommonJS(fetchCache_exports);
var import_utils = require("@tldraw/utils");
function fetchCache(cb, init) {
  const cache = /* @__PURE__ */ new Map();
  return async function fetchCached(url) {
    const existing = cache.get(url);
    if (existing) return existing;
    const promise = (async () => {
      try {
        const response = await (0, import_utils.fetch)(url, init);
        (0, import_utils.assert)(response.ok);
        return await cb(response);
      } catch (err) {
        console.error(err);
        return null;
      }
    })();
    cache.set(url, promise);
    return promise;
  };
}
const resourceToDataUrl = fetchCache(async (response) => {
  return await import_utils.FileHelpers.blobToDataUrl(await response.blob());
});
//# sourceMappingURL=fetchCache.js.map
