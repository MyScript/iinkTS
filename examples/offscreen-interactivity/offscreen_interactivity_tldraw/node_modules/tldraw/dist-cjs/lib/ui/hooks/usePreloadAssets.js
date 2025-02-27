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
var usePreloadAssets_exports = {};
__export(usePreloadAssets_exports, {
  usePreloadAssets: () => usePreloadAssets
});
module.exports = __toCommonJS(usePreloadAssets_exports);
var import_react = require("react");
var import_preload_font = require("../../utils/assets/preload-font");
var PreloadStatus = /* @__PURE__ */ ((PreloadStatus2) => {
  PreloadStatus2[PreloadStatus2["SUCCESS"] = 0] = "SUCCESS";
  PreloadStatus2[PreloadStatus2["FAILED"] = 1] = "FAILED";
  PreloadStatus2[PreloadStatus2["WAITING"] = 2] = "WAITING";
  return PreloadStatus2;
})(PreloadStatus || {});
const usePreloadFont = (id, font) => {
  const [state, setState] = (0, import_react.useState)(2 /* WAITING */);
  (0, import_react.useEffect)(() => {
    let cancelled = false;
    setState(2 /* WAITING */);
    (0, import_preload_font.preloadFont)(id, font).then(() => {
      if (cancelled) return;
      setState(0 /* SUCCESS */);
    }).catch((err) => {
      if (cancelled) return;
      console.error(err);
      setState(1 /* FAILED */);
    });
    return () => {
      cancelled = true;
    };
  }, [id, font]);
  return state;
};
function getTypefaces(assetUrls) {
  return {
    draw: {
      url: assetUrls.fonts.draw,
      format: assetUrls.fonts.draw.split(".").pop()
    },
    serif: {
      url: assetUrls.fonts.serif,
      format: assetUrls.fonts.serif.split(".").pop()
    },
    sansSerif: {
      url: assetUrls.fonts.sansSerif,
      format: assetUrls.fonts.sansSerif.split(".").pop()
    },
    monospace: {
      url: assetUrls.fonts.monospace,
      format: assetUrls.fonts.monospace.split(".").pop()
    }
  };
}
function usePreloadAssets(assetUrls) {
  const typefaces = (0, import_react.useMemo)(() => getTypefaces(assetUrls), [assetUrls]);
  const results = [
    usePreloadFont("tldraw_draw", typefaces.draw),
    usePreloadFont("tldraw_serif", typefaces.serif),
    usePreloadFont("tldraw_sans", typefaces.sansSerif),
    usePreloadFont("tldraw_mono", typefaces.monospace)
  ];
  return {
    // If any of the results have errored, then preloading has failed
    error: results.some((result) => result === 1 /* FAILED */),
    // If any of the results are waiting, then we're not done yet
    done: !results.some((result) => result === 2 /* WAITING */)
  };
}
//# sourceMappingURL=usePreloadAssets.js.map
