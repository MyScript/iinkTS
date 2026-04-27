import { MediaHelpers, assertExists, clampToBrowserMaxCanvasSize } from "@tldraw/editor";
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
  const { w, h, image } = await MediaHelpers.usingObjectURL(
    blob,
    MediaHelpers.getImageAndDimensions
  );
  const { type = blob.type, quality = 0.85 } = opts;
  const [desiredWidth, desiredHeight] = clampToBrowserMaxCanvasSize(
    Math.min(width * 2, w),
    Math.min(height * 2, h)
  );
  const canvas = document.createElement("canvas");
  canvas.width = desiredWidth;
  canvas.height = desiredHeight;
  const ctx = assertExists(
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
export {
  containBoxSize,
  downsizeImage
};
//# sourceMappingURL=assets.mjs.map
