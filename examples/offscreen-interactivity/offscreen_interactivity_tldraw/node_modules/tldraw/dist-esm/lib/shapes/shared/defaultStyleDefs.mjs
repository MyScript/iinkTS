import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import {
  DefaultColorThemePalette,
  DefaultFontStyle,
  debugFlags,
  last,
  suffixSafeId,
  tlenv,
  useEditor,
  useSharedSafeId,
  useUniqueSafeId,
  useValue
} from "@tldraw/editor";
import { useCallback, useEffect, useRef, useState } from "react";
import { useDefaultColorTheme } from "./useDefaultColorTheme.mjs";
function getFillDefForExport(fill) {
  return {
    key: `${DefaultFontStyle.id}:${fill}`,
    async getElement() {
      if (fill !== "pattern") return null;
      return /* @__PURE__ */ jsx(HashPatternForExport, {});
    }
  };
}
function HashPatternForExport() {
  const getHashPatternZoomName = useGetHashPatternZoomName();
  const maskId = useUniqueSafeId();
  const theme = useDefaultColorTheme();
  const t = 8 / 12;
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsxs("mask", { id: maskId, children: [
      /* @__PURE__ */ jsx("rect", { x: "0", y: "0", width: "8", height: "8", fill: "white" }),
      /* @__PURE__ */ jsxs("g", { strokeLinecap: "round", stroke: "black", children: [
        /* @__PURE__ */ jsx("line", { x1: t * 1, y1: t * 3, x2: t * 3, y2: t * 1 }),
        /* @__PURE__ */ jsx("line", { x1: t * 5, y1: t * 7, x2: t * 7, y2: t * 5 }),
        /* @__PURE__ */ jsx("line", { x1: t * 9, y1: t * 11, x2: t * 11, y2: t * 9 })
      ] })
    ] }),
    /* @__PURE__ */ jsx(
      "pattern",
      {
        id: getHashPatternZoomName(1, theme.id),
        width: "8",
        height: "8",
        patternUnits: "userSpaceOnUse",
        children: /* @__PURE__ */ jsx("rect", { x: "0", y: "0", width: "8", height: "8", fill: theme.solid, mask: `url(#${maskId})` })
      }
    )
  ] });
}
function getFillDefForCanvas() {
  return {
    key: `${DefaultFontStyle.id}:pattern`,
    component: PatternFillDefForCanvas
  };
}
const TILE_PATTERN_SIZE = 8;
const generateImage = (dpr, currentZoom, darkMode) => {
  return new Promise((resolve, reject) => {
    const size = TILE_PATTERN_SIZE * currentZoom * dpr;
    const canvasEl = document.createElement("canvas");
    canvasEl.width = size;
    canvasEl.height = size;
    const ctx = canvasEl.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = darkMode ? DefaultColorThemePalette.darkMode.solid : DefaultColorThemePalette.lightMode.solid;
    ctx.fillRect(0, 0, size, size);
    ctx.globalCompositeOperation = "destination-out";
    ctx.lineCap = "round";
    ctx.lineWidth = 1.25 * currentZoom * dpr;
    const t = 8 / 12;
    const s = (v) => v * currentZoom * dpr;
    ctx.beginPath();
    ctx.moveTo(s(t * 1), s(t * 3));
    ctx.lineTo(s(t * 3), s(t * 1));
    ctx.moveTo(s(t * 5), s(t * 7));
    ctx.lineTo(s(t * 7), s(t * 5));
    ctx.moveTo(s(t * 9), s(t * 11));
    ctx.lineTo(s(t * 11), s(t * 9));
    ctx.stroke();
    canvasEl.toBlob((blob) => {
      if (!blob || debugFlags.throwToBlob.get()) {
        reject();
      } else {
        resolve(blob);
      }
    });
  });
};
const canvasBlob = (size, fn) => {
  const canvas = document.createElement("canvas");
  canvas.width = size[0];
  canvas.height = size[1];
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";
  fn(ctx);
  return canvas.toDataURL();
};
let defaultPixels = null;
function getDefaultPixels() {
  if (!defaultPixels) {
    defaultPixels = {
      white: canvasBlob([1, 1], (ctx) => {
        ctx.fillStyle = "#f8f9fa";
        ctx.fillRect(0, 0, 1, 1);
      }),
      black: canvasBlob([1, 1], (ctx) => {
        ctx.fillStyle = "#212529";
        ctx.fillRect(0, 0, 1, 1);
      })
    };
  }
  return defaultPixels;
}
function getPatternLodForZoomLevel(zoom) {
  return Math.ceil(Math.log2(Math.max(1, zoom)));
}
function useGetHashPatternZoomName() {
  const id = useSharedSafeId("hash_pattern");
  return useCallback(
    (zoom, theme) => {
      const lod = getPatternLodForZoomLevel(zoom);
      return suffixSafeId(id, `${theme}_${lod}`);
    },
    [id]
  );
}
function getPatternLodsToGenerate(maxZoom) {
  const levels = [];
  const minLod = 0;
  const maxLod = getPatternLodForZoomLevel(maxZoom);
  for (let i = minLod; i <= maxLod; i++) {
    levels.push(Math.pow(2, i));
  }
  return levels;
}
function getDefaultPatterns(maxZoom) {
  const defaultPixels2 = getDefaultPixels();
  return getPatternLodsToGenerate(maxZoom).flatMap((zoom) => [
    { zoom, url: defaultPixels2.white, theme: "light" },
    { zoom, url: defaultPixels2.black, theme: "dark" }
  ]);
}
function usePattern() {
  const editor = useEditor();
  const dpr = useValue("devicePixelRatio", () => editor.getInstanceState().devicePixelRatio, [
    editor
  ]);
  const maxZoom = useValue("maxZoom", () => Math.ceil(last(editor.getCameraOptions().zoomSteps)), [
    editor
  ]);
  const [isReady, setIsReady] = useState(false);
  const [backgroundUrls, setBackgroundUrls] = useState(
    () => getDefaultPatterns(maxZoom)
  );
  const getHashPatternZoomName = useGetHashPatternZoomName();
  useEffect(() => {
    if (process.env.NODE_ENV === "test") {
      setIsReady(true);
      return;
    }
    const promise = Promise.all(
      getPatternLodsToGenerate(maxZoom).flatMap((zoom) => [
        generateImage(dpr, zoom, false).then((blob) => ({
          zoom,
          theme: "light",
          url: URL.createObjectURL(blob)
        })),
        generateImage(dpr, zoom, true).then((blob) => ({
          zoom,
          theme: "dark",
          url: URL.createObjectURL(blob)
        }))
      ])
    );
    let isCancelled = false;
    promise.then((urls) => {
      if (isCancelled) return;
      setBackgroundUrls(urls);
      setIsReady(true);
    });
    return () => {
      isCancelled = true;
      setIsReady(false);
      promise.then((patterns) => {
        for (const { url } of patterns) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [dpr, maxZoom]);
  const defs = /* @__PURE__ */ jsx(Fragment, { children: backgroundUrls.map((item) => {
    const id = getHashPatternZoomName(item.zoom, item.theme);
    return /* @__PURE__ */ jsx(
      "pattern",
      {
        id,
        width: TILE_PATTERN_SIZE,
        height: TILE_PATTERN_SIZE,
        patternUnits: "userSpaceOnUse",
        children: /* @__PURE__ */ jsx("image", { href: item.url, width: TILE_PATTERN_SIZE, height: TILE_PATTERN_SIZE })
      },
      id
    );
  }) });
  return { defs, isReady };
}
function PatternFillDefForCanvas() {
  const editor = useEditor();
  const containerRef = useRef(null);
  const { defs, isReady } = usePattern();
  useEffect(() => {
    if (isReady && tlenv.isSafari) {
      const htmlLayer = findHtmlLayerParent(containerRef.current);
      if (htmlLayer) {
        editor.timers.requestAnimationFrame(() => {
          htmlLayer.style.display = "none";
          editor.timers.requestAnimationFrame(() => {
            htmlLayer.style.display = "";
          });
        });
      }
    }
  }, [editor, isReady]);
  return /* @__PURE__ */ jsx("g", { ref: containerRef, "data-testid": isReady ? "ready-pattern-fill-defs" : void 0, children: defs });
}
function findHtmlLayerParent(element) {
  if (element.classList.contains("tl-html-layer")) return element;
  if (element.parentElement) return findHtmlLayerParent(element.parentElement);
  return null;
}
export {
  getFillDefForCanvas,
  getFillDefForExport,
  useGetHashPatternZoomName
};
//# sourceMappingURL=defaultStyleDefs.mjs.map
