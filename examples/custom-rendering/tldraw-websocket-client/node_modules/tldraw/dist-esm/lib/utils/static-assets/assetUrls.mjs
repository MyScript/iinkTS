import { getDefaultCdnBaseUrl } from "@tldraw/editor";
import { useMemo } from "react";
let defaultEditorAssetUrls = {
  fonts: {
    tldraw_mono: `${getDefaultCdnBaseUrl()}/fonts/IBMPlexMono-Medium.woff2`,
    tldraw_mono_italic: `${getDefaultCdnBaseUrl()}/fonts/IBMPlexMono-MediumItalic.woff2`,
    tldraw_mono_bold: `${getDefaultCdnBaseUrl()}/fonts/IBMPlexMono-Bold.woff2`,
    tldraw_mono_italic_bold: `${getDefaultCdnBaseUrl()}/fonts/IBMPlexMono-BoldItalic.woff2`,
    tldraw_serif: `${getDefaultCdnBaseUrl()}/fonts/IBMPlexSerif-Medium.woff2`,
    tldraw_serif_italic: `${getDefaultCdnBaseUrl()}/fonts/IBMPlexSerif-MediumItalic.woff2`,
    tldraw_serif_bold: `${getDefaultCdnBaseUrl()}/fonts/IBMPlexSerif-Bold.woff2`,
    tldraw_serif_italic_bold: `${getDefaultCdnBaseUrl()}/fonts/IBMPlexSerif-BoldItalic.woff2`,
    tldraw_sans: `${getDefaultCdnBaseUrl()}/fonts/IBMPlexSans-Medium.woff2`,
    tldraw_sans_italic: `${getDefaultCdnBaseUrl()}/fonts/IBMPlexSans-MediumItalic.woff2`,
    tldraw_sans_bold: `${getDefaultCdnBaseUrl()}/fonts/IBMPlexSans-Bold.woff2`,
    tldraw_sans_italic_bold: `${getDefaultCdnBaseUrl()}/fonts/IBMPlexSans-BoldItalic.woff2`,
    tldraw_draw: `${getDefaultCdnBaseUrl()}/fonts/Shantell_Sans-Informal_Regular.woff2`,
    tldraw_draw_italic: `${getDefaultCdnBaseUrl()}/fonts/Shantell_Sans-Informal_Regular_Italic.woff2`,
    tldraw_draw_bold: `${getDefaultCdnBaseUrl()}/fonts/Shantell_Sans-Informal_Bold.woff2`,
    tldraw_draw_italic_bold: `${getDefaultCdnBaseUrl()}/fonts/Shantell_Sans-Informal_Bold_Italic.woff2`
  }
};
function setDefaultEditorAssetUrls(assetUrls) {
  defaultEditorAssetUrls = assetUrls;
}
function useDefaultEditorAssetsWithOverrides(overrides) {
  return useMemo(() => {
    if (!overrides) return defaultEditorAssetUrls;
    return {
      fonts: { ...defaultEditorAssetUrls.fonts, ...overrides?.fonts }
    };
  }, [overrides]);
}
export {
  defaultEditorAssetUrls,
  setDefaultEditorAssetUrls,
  useDefaultEditorAssetsWithOverrides
};
//# sourceMappingURL=assetUrls.mjs.map
