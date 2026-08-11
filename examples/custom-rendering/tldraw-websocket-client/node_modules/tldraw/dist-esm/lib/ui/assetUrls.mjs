import { LANGUAGES, getDefaultCdnBaseUrl } from "@tldraw/editor";
import { useMemo } from "react";
import { DEFAULT_EMBED_DEFINITIONS } from "../defaultEmbedDefinitions.mjs";
import { defaultEditorAssetUrls } from "../utils/static-assets/assetUrls.mjs";
import { iconTypes } from "./icon-types.mjs";
let defaultUiAssetUrls = {
  ...defaultEditorAssetUrls,
  icons: Object.fromEntries(
    iconTypes.map((name) => [name, `${getDefaultCdnBaseUrl()}/icons/icon/0_merged.svg#${name}`])
  ),
  translations: Object.fromEntries(
    LANGUAGES.map((lang) => [
      lang.locale,
      `${getDefaultCdnBaseUrl()}/translations/${lang.locale}.json`
    ])
  ),
  embedIcons: Object.fromEntries(
    DEFAULT_EMBED_DEFINITIONS.map((def) => [
      def.type,
      `${getDefaultCdnBaseUrl()}/embed-icons/${def.type}.png`
    ])
  )
};
function setDefaultUiAssetUrls(urls) {
  defaultUiAssetUrls = urls;
}
function useDefaultUiAssetUrlsWithOverrides(overrides) {
  return useMemo(() => {
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
export {
  defaultUiAssetUrls,
  setDefaultUiAssetUrls,
  useDefaultUiAssetUrlsWithOverrides
};
//# sourceMappingURL=assetUrls.mjs.map
