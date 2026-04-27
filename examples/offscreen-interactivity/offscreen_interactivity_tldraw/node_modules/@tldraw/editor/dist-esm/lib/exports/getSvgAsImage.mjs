import { FileHelpers, Image, PngHelpers, sleep } from "@tldraw/utils";
import { tlenv } from "../globals/environment.mjs";
import { clampToBrowserMaxCanvasSize } from "../utils/browserCanvasMaxSize.mjs";
import { debugFlags } from "../utils/debug-flags.mjs";
async function getSvgAsImage(svgString, options) {
  const { type, width, height, quality = 1, pixelRatio = 2 } = options;
  let [clampedWidth, clampedHeight] = clampToBrowserMaxCanvasSize(
    width * pixelRatio,
    height * pixelRatio
  );
  clampedWidth = Math.floor(clampedWidth);
  clampedHeight = Math.floor(clampedHeight);
  const effectiveScale = clampedWidth / width;
  const svgUrl = await FileHelpers.blobToDataUrl(new Blob([svgString], { type: "image/svg+xml" }));
  const canvas = await new Promise((resolve) => {
    const image = Image();
    image.crossOrigin = "anonymous";
    image.onload = async () => {
      if (tlenv.isSafari) {
        await sleep(250);
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
        if (!blob2 || debugFlags.throwToBlob.get()) {
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
    return PngHelpers.setPhysChunk(view, effectiveScale, {
      type: "image/" + type
    });
  } else {
    return blob;
  }
}
export {
  getSvgAsImage
};
//# sourceMappingURL=getSvgAsImage.mjs.map
