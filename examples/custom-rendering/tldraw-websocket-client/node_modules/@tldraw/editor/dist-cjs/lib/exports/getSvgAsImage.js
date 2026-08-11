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
var getSvgAsImage_exports = {};
__export(getSvgAsImage_exports, {
  getSvgAsImage: () => getSvgAsImage
});
module.exports = __toCommonJS(getSvgAsImage_exports);
var import_utils = require("@tldraw/utils");
var import_environment = require("../globals/environment");
var import_browserCanvasMaxSize = require("../utils/browserCanvasMaxSize");
var import_debug_flags = require("../utils/debug-flags");
async function getSvgAsImage(svgString, options) {
  const { type, width, height, quality = 1, pixelRatio = 2 } = options;
  let [clampedWidth, clampedHeight] = (0, import_browserCanvasMaxSize.clampToBrowserMaxCanvasSize)(
    width * pixelRatio,
    height * pixelRatio
  );
  clampedWidth = Math.floor(clampedWidth);
  clampedHeight = Math.floor(clampedHeight);
  const effectiveScale = clampedWidth / width;
  const svgUrl = await import_utils.FileHelpers.blobToDataUrl(new Blob([svgString], { type: "image/svg+xml" }));
  const canvas = await new Promise((resolve) => {
    const image = (0, import_utils.Image)();
    image.crossOrigin = "anonymous";
    image.onload = async () => {
      if (import_environment.tlenv.isSafari) {
        await (0, import_utils.sleep)(250);
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
        if (!blob2 || import_debug_flags.debugFlags.throwToBlob.get()) {
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
    return import_utils.PngHelpers.setPhysChunk(view, effectiveScale, {
      type: "image/" + type
    });
  } else {
    return blob;
  }
}
//# sourceMappingURL=getSvgAsImage.js.map
