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
var asset_urls_exports = {};
__export(asset_urls_exports, {
  AssetUrlsProvider: () => AssetUrlsProvider,
  useAssetUrls: () => useAssetUrls
});
module.exports = __toCommonJS(asset_urls_exports);
var import_jsx_runtime = require("react/jsx-runtime");
var import_editor = require("@tldraw/editor");
var import_react = require("react");
const AssetUrlsContext = (0, import_react.createContext)(null);
function AssetUrlsProvider({
  assetUrls,
  children
}) {
  (0, import_react.useEffect)(() => {
    for (const src of Object.values(assetUrls.icons)) {
      if (!src) continue;
      const image = (0, import_editor.Image)();
      image.crossOrigin = "anonymous";
      image.src = src;
      image.decode();
    }
    for (const src of Object.values(assetUrls.embedIcons)) {
      if (!src) continue;
      const image = (0, import_editor.Image)();
      image.crossOrigin = "anonymous";
      image.src = src;
      image.decode();
    }
  }, [assetUrls]);
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AssetUrlsContext.Provider, { value: assetUrls, children });
}
function useAssetUrls() {
  const assetUrls = (0, import_react.useContext)(AssetUrlsContext);
  if (!assetUrls) {
    throw new Error("useAssetUrls must be used within an AssetUrlsProvider");
  }
  return assetUrls;
}
//# sourceMappingURL=asset-urls.js.map
