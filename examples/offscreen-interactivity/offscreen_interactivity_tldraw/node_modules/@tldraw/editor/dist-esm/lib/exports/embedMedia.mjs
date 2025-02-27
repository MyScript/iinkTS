import { MediaHelpers } from "@tldraw/utils";
import { getRenderedChildren } from "./domUtils.mjs";
import { resourceToDataUrl } from "./fetchCache.mjs";
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
    const dataUrl = await MediaHelpers.getVideoFrameAsDataUrl(video);
    return createImage(dataUrl, video);
  } catch (err) {
    console.error("Could not get video frame", err);
  }
  if (video.poster) {
    const dataUrl = await resourceToDataUrl(video.poster);
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
    const dataUrl = await resourceToDataUrl(src);
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
    Array.from(getRenderedChildren(node), (child) => embedMedia(child))
  );
}
export {
  embedMedia
};
//# sourceMappingURL=embedMedia.mjs.map
