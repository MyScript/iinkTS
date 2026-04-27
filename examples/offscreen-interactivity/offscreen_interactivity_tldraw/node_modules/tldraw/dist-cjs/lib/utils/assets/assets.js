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
var assets_exports = {};
__export(assets_exports, {
  containBoxSize: () => containBoxSize,
  downsizeImage: () => downsizeImage
});
module.exports = __toCommonJS(assets_exports);
var import_editor = require("@tldraw/editor");
function containBoxSize(originalSize, containBoxSize2) {
  const overByXScale = originalSize.w / containBoxSize2.w;
  const overByYScale = originalSize.h / containBoxSize2.h;
  if (overByXScale <= 1 && overByYScale <= 1) {
    return originalSize;
  } else if (overByXScale > overByYScale) {
    return {
      w: originalSize.w / overByXScale,
      h: originalSize.h / overByXScale
    };
  } else {
    return {
      w: originalSize.w / overByYScale,
      h: originalSize.h / overByYScale
    };
  }
}
async function downsizeImage(blob, width, height, opts = {}) {
  const { w, h, image } = await import_editor.MediaHelpers.usingObjectURL(
    blob,
    import_editor.MediaHelpers.getImageAndDimensions
  );
  const { type = blob.type, quality = 0.85 } = opts;
  const [desiredWidth, desiredHeight] = (0, import_editor.clampToBrowserMaxCanvasSize)(
    Math.min(width * 2, w),
    Math.min(height * 2, h)
  );
  const canvas = document.createElement("canvas");
  canvas.width = desiredWidth;
  canvas.height = desiredHeight;
  const ctx = (0, import_editor.assertExists)(
    canvas.getContext("2d", { willReadFrequently: true }),
    "Could not get canvas context"
  );
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(image, 0, 0, desiredWidth, desiredHeight);
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob2) => {
        if (blob2) {
          resolve(blob2);
        } else {
          reject(new Error("Could not resize image"));
        }
      },
      type,
      quality
    );
  });
}
//# sourceMappingURL=assets.js.map
