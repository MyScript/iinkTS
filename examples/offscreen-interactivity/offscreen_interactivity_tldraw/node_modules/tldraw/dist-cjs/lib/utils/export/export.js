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
var export_exports = {};
__export(export_exports, {
  exportToBlob: () => exportToBlob,
  exportToBlobPromise: () => exportToBlobPromise,
  exportToString: () => exportToString,
  getSvgAsImage: () => getSvgAsImage
});
module.exports = __toCommonJS(export_exports);
var import_editor = require("@tldraw/editor");
var import_getBrowserCanvasMaxSize = require("../../shapes/shared/getBrowserCanvasMaxSize");
async function getSvgAsImage(editor, svgString, options) {
  const { type, width, height, quality = 1, pixelRatio = 2 } = options;
  let [clampedWidth, clampedHeight] = await (0, import_getBrowserCanvasMaxSize.clampToBrowserMaxCanvasSize)(
    width * pixelRatio,
    height * pixelRatio
  );
  clampedWidth = Math.floor(clampedWidth);
  clampedHeight = Math.floor(clampedHeight);
  const effectiveScale = clampedWidth / width;
  const svgUrl = await import_editor.FileHelpers.blobToDataUrl(new Blob([svgString], { type: "image/svg+xml" }));
  const canvas = await new Promise((resolve) => {
    const image = (0, import_editor.Image)();
    image.crossOrigin = "anonymous";
    image.onload = async () => {
      if (import_editor.tlenv.isSafari) {
        await (0, import_editor.sleep)(250);
      }
      const canvas2 = document.createElement("canvas");
      const ctx = canvas2.getContext("2d");
      canvas2.width = clampedWidth;
      canvas2.height = clampedHeight;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(image, 0, 0, clampedWidth, clampedHeight);
      URL.revokeObjectURL(svgUrl);
      resolve(canvas2);
    };
    image.onerror = () => {
      resolve(null);
    };
    image.src = svgUrl;
  });
  if (!canvas) return null;
  const blob = await new Promise(
    (resolve) => canvas.toBlob(
      (blob2) => {
        if (!blob2 || import_editor.debugFlags.throwToBlob.get()) {
          resolve(null);
        }
        resolve(blob2);
      },
      "image/" + type,
      quality
    )
  );
  if (!blob) return null;
  if (type === "png") {
    const view = new DataView(await blob.arrayBuffer());
    return import_editor.PngHelpers.setPhysChunk(view, effectiveScale, {
      type: "image/" + type
    });
  } else {
    return blob;
  }
}
async function getSvgString(editor, ids, opts) {
  const svg = await editor.getSvgString(ids?.length ? ids : [...editor.getCurrentPageShapeIds()], {
    scale: opts.scale ?? 1,
    background: editor.getInstanceState().exportBackground,
    ...opts
  });
  if (!svg) {
    throw new Error("Could not construct SVG.");
  }
  return svg;
}
async function exportToString(editor, ids, format, opts = {}) {
  switch (format) {
    case "svg": {
      return (await getSvgString(editor, ids, opts))?.svg;
    }
    case "json": {
      const data = await editor.resolveAssetsInContent(editor.getContentFromCurrentPage(ids));
      return JSON.stringify(data);
    }
    default: {
      (0, import_editor.exhaustiveSwitchError)(format);
    }
  }
}
async function exportToBlob({
  editor,
  ids,
  format,
  opts = {}
}) {
  switch (format) {
    case "svg":
      return new Blob([await exportToString(editor, ids, "svg", opts)], { type: "text/plain" });
    case "json":
      return new Blob([await exportToString(editor, ids, "json", opts)], { type: "text/plain" });
    case "jpeg":
    case "png":
    case "webp": {
      const svgResult = await getSvgString(editor, ids, opts);
      if (!svgResult) throw new Error("Could not construct image.");
      const image = await getSvgAsImage(editor, svgResult.svg, {
        type: format,
        quality: opts.quality,
        pixelRatio: opts.pixelRatio,
        width: svgResult.width,
        height: svgResult.height
      });
      if (!image) {
        throw new Error("Could not construct image.");
      }
      return image;
    }
    default: {
      (0, import_editor.exhaustiveSwitchError)(format);
    }
  }
}
const mimeTypeByFormat = {
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  json: "text/plain",
  svg: "text/plain"
};
function exportToBlobPromise(editor, ids, format, opts = {}) {
  return {
    blobPromise: exportToBlob({ editor, ids, format, opts }),
    mimeType: mimeTypeByFormat[format]
  };
}
//# sourceMappingURL=export.js.map
