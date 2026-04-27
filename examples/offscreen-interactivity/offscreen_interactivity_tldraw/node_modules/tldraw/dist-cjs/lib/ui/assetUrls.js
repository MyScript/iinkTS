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
var assetUrls_exports = {};
__export(assetUrls_exports, {
  defaultUiAssetUrls: () => defaultUiAssetUrls,
  setDefaultUiAssetUrls: () => setDefaultUiAssetUrls,
  useDefaultUiAssetUrlsWithOverrides: () => useDefaultUiAssetUrlsWithOverrides
});
module.exports = __toCommonJS(assetUrls_exports);
var import_editor = require("@tldraw/editor");
var import_react = require("react");
var import_defaultEmbedDefinitions = require("../defaultEmbedDefinitions");
var import_assetUrls = require("../utils/static-assets/assetUrls");
var import_icon_types = require("./icon-types");
let defaultUiAssetUrls = {
  ...import_assetUrls.defaultEditorAssetUrls,
  icons: Object.fromEntries(
    import_icon_types.iconTypes.map((name) => [name, `${(0, import_editor.getDefaultCdnBaseUrl)()}/icons/icon/0_merged.svg#${name}`])
  ),
  translations: Object.fromEntries(
    import_editor.LANGUAGES.map((lang) => [
      lang.locale,
      `${(0, import_editor.getDefaultCdnBaseUrl)()}/translations/${lang.locale}.json`
    ])
  ),
  embedIcons: Object.fromEntries(
    import_defaultEmbedDefinitions.DEFAULT_EMBED_DEFINITIONS.map((def) => [
      def.type,
      `${(0, import_editor.getDefaultCdnBaseUrl)()}/embed-icons/${def.type}.png`
    ])
  )
};
function setDefaultUiAssetUrls(urls) {
  defaultUiAssetUrls = urls;
}
function useDefaultUiAssetUrlsWithOverrides(overrides) {
  return (0, import_react.useMemo)(() => {
    if (!overrides) return defaultUiAssetUrls;
    return {
      fonts: Object.assign({ ...defaultUiAssetUrls.fonts }, { ...overrides?.fonts }),
      icons: Object.assign({ ...defaultUiAssetUrls.icons }, { ...overrides?.icons }),
      embedIcons: Object.assign({ ...defaultUiAssetUrls.embedIcons }, { ...overrides?.embedIcons }),
      translations: Object.assign(
        { ...defaultUiAssetUrls.translations },
        { ...overrides?.translations }
      )
    };
  }, [overrides]);
}
//# sourceMappingURL=assetUrls.js.map
