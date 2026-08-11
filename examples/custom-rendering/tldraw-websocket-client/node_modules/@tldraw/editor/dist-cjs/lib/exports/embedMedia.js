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
var embedMedia_exports = {};
__export(embedMedia_exports, {
  embedMedia: () => embedMedia
});
module.exports = __toCommonJS(embedMedia_exports);
var import_utils = require("@tldraw/utils");
var import_domUtils = require("./domUtils");
var import_fetchCache = require("./fetchCache");
function copyAttrs(source, target) {
  const attrs = Array.from(source.attributes);
  attrs.forEach((attr) => {
    target.setAttribute(attr.name, attr.value);
  });
}
function replace(original, replacement) {
  original.replaceWith(replacement);
  return replacement;
}
async function createImage(dataUrl, cloneAttributesFrom) {
  const image = document.createElement("img");
  if (cloneAttributesFrom) {
    copyAttrs(cloneAttributesFrom, image);
  }
  image.setAttribute("src", dataUrl ?? "data:");
  image.setAttribute("decoding", "sync");
  image.setAttribute("loading", "eager");
  try {
    await image.decode();
  } catch {
  }
  return image;
}
async function getCanvasReplacement(canvas) {
  try {
    const dataURL = canvas.toDataURL();
    return await createImage(dataURL, canvas);
  } catch {
    return await createImage(null, canvas);
  }
}
async function getVideoReplacement(video) {
  try {
    const dataUrl = await import_utils.MediaHelpers.getVideoFrameAsDataUrl(video);
    return createImage(dataUrl, video);
  } catch (err) {
    console.error("Could not get video frame", err);
  }
  if (video.poster) {
    const dataUrl = await (0, import_fetchCache.resourceToDataUrl)(video.poster);
    return createImage(dataUrl, video);
  }
  return createImage(null, video);
}
async function embedMedia(node) {
  if (node instanceof HTMLCanvasElement) {
    return replace(node, await getCanvasReplacement(node));
  } else if (node instanceof HTMLVideoElement) {
    return replace(node, await getVideoReplacement(node));
  } else if (node instanceof HTMLImageElement) {
    const src = node.currentSrc || node.src;
    const dataUrl = await (0, import_fetchCache.resourceToDataUrl)(src);
    node.setAttribute("src", dataUrl ?? "data:");
    node.setAttribute("decoding", "sync");
    node.setAttribute("loading", "eager");
    try {
      await node.decode();
    } catch {
    }
    return node;
  } else if (node instanceof HTMLInputElement) {
    node.setAttribute("value", node.value);
  } else if (node instanceof HTMLTextAreaElement) {
    node.textContent = node.value;
  }
  await Promise.all(
    Array.from((0, import_domUtils.getRenderedChildren)(node), (child) => embedMedia(child))
  );
}
//# sourceMappingURL=embedMedia.js.map
