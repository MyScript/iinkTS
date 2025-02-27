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
var TldrawImage_exports = {};
__export(TldrawImage_exports, {
  TldrawImage: () => TldrawImage
});
module.exports = __toCommonJS(TldrawImage_exports);
var import_jsx_runtime = require("react/jsx-runtime");
var import_editor = require("@tldraw/editor");
var import_react = require("react");
var import_defaultBindingUtils = require("./defaultBindingUtils");
var import_defaultShapeUtils = require("./defaultShapeUtils");
var import_usePreloadAssets = require("./ui/hooks/usePreloadAssets");
var import_export = require("./utils/export/export");
var import_assetUrls2 = require("./utils/static-assets/assetUrls");
const TldrawImage = (0, import_react.memo)(function TldrawImage2(props) {
  const [url, setUrl] = (0, import_react.useState)(null);
  const [container, setContainer] = (0, import_react.useState)(null);
  const shapeUtils = (0, import_editor.useShallowArrayIdentity)(props.shapeUtils ?? []);
  const shapeUtilsWithDefaults = (0, import_react.useMemo)(() => [...import_defaultShapeUtils.defaultShapeUtils, ...shapeUtils], [shapeUtils]);
  const bindingUtils = (0, import_editor.useShallowArrayIdentity)(props.bindingUtils ?? []);
  const bindingUtilsWithDefaults = (0, import_react.useMemo)(
    () => [...import_defaultBindingUtils.defaultBindingUtils, ...bindingUtils],
    [bindingUtils]
  );
  const store = (0, import_editor.useTLStore)({ snapshot: props.snapshot, shapeUtils: shapeUtilsWithDefaults });
  const assets = (0, import_assetUrls2.useDefaultEditorAssetsWithOverrides)(props.assetUrls);
  const { done: preloadingComplete, error: preloadingError } = (0, import_usePreloadAssets.usePreloadAssets)(assets);
  const {
    pageId,
    bounds,
    scale,
    pixelRatio,
    background,
    padding,
    darkMode,
    preserveAspectRatio,
    format = "svg",
    licenseKey
  } = props;
  (0, import_react.useLayoutEffect)(() => {
    if (!container) return;
    if (!store) return;
    if (!preloadingComplete) return;
    let isCancelled = false;
    const tempElm = document.createElement("div");
    container.appendChild(tempElm);
    container.classList.add("tl-container", "tl-theme__light");
    const editor = new import_editor.Editor({
      store,
      shapeUtils: shapeUtilsWithDefaults,
      bindingUtils: bindingUtilsWithDefaults,
      tools: [],
      getContainer: () => tempElm,
      licenseKey
    });
    if (pageId) editor.setCurrentPage(pageId);
    const shapeIds = editor.getCurrentPageShapeIds();
    async function setSvg() {
      const svgResult = await editor.getSvgString([...shapeIds], {
        bounds,
        scale,
        background,
        padding,
        darkMode,
        preserveAspectRatio
      });
      if (svgResult && !isCancelled) {
        if (format === "svg") {
          if (!isCancelled) {
            const blob = new Blob([svgResult.svg], { type: "image/svg+xml" });
            const url2 = URL.createObjectURL(blob);
            setUrl(url2);
          }
        } else if (format === "png") {
          const blob = await (0, import_export.getSvgAsImage)(editor, svgResult.svg, {
            type: format,
            width: svgResult.width,
            height: svgResult.height,
            pixelRatio
          });
          if (blob && !isCancelled) {
            const url2 = URL.createObjectURL(blob);
            setUrl(url2);
          }
        }
      }
      editor.dispose();
    }
    setSvg();
    return () => {
      isCancelled = true;
    };
  }, [
    format,
    container,
    store,
    shapeUtilsWithDefaults,
    bindingUtilsWithDefaults,
    pageId,
    bounds,
    scale,
    background,
    padding,
    darkMode,
    preserveAspectRatio,
    preloadingComplete,
    preloadingError,
    licenseKey,
    pixelRatio
  ]);
  if (preloadingError) {
    return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_editor.ErrorScreen, { children: "Could not load assets." });
  }
  if (!preloadingComplete) {
    return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_editor.LoadingScreen, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_editor.DefaultSpinner, {}) });
  }
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { ref: setContainer, style: { position: "relative", width: "100%", height: "100%" }, children: url && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
    "img",
    {
      src: url,
      referrerPolicy: "strict-origin-when-cross-origin",
      style: { width: "100%", height: "100%" }
    }
  ) });
});
//# sourceMappingURL=TldrawImage.js.map
