import { jsx } from "react/jsx-runtime";
import { Image } from "@tldraw/editor";
import { createContext, useContext, useEffect } from "react";
const AssetUrlsContext = createContext(null);
function AssetUrlsProvider({
  assetUrls,
  children
}) {
  useEffect(() => {
    for (const src of Object.values(assetUrls.icons)) {
      if (!src) continue;
      const image = Image();
      image.crossOrigin = "anonymous";
      image.src = src;
      image.decode();
    }
    for (const src of Object.values(assetUrls.embedIcons)) {
      if (!src) continue;
      const image = Image();
      image.crossOrigin = "anonymous";
      image.src = src;
      image.decode();
    }
  }, [assetUrls]);
  return /* @__PURE__ */ jsx(AssetUrlsContext.Provider, { value: assetUrls, children });
}
function useAssetUrls() {
  const assetUrls = useContext(AssetUrlsContext);
  if (!assetUrls) {
    throw new Error("useAssetUrls must be used within an AssetUrlsProvider");
  }
  return assetUrls;
}
export {
  AssetUrlsProvider,
  useAssetUrls
};
//# sourceMappingURL=asset-urls.mjs.map
