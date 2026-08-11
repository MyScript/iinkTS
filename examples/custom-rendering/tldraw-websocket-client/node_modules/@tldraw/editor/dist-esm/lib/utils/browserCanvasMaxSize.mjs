let maxCanvasSizes = null;
function getBrowserCanvasMaxSize() {
  if (!maxCanvasSizes) {
    maxCanvasSizes = {
      maxWidth: getCanvasSize("width"),
      // test very wide but 1 pixel tall canvases
      maxHeight: getCanvasSize("height"),
      // test very tall but 1 pixel wide canvases
      maxArea: getCanvasSize("area")
      // test square canvases
    };
  }
  return maxCanvasSizes;
}
/*!
 * Extracted from https://github.com/jhildenbiddle/canvas-size
 * MIT License: https://github.com/jhildenbiddle/canvas-size/blob/master/LICENSE
 * Copyright (c) John Hildenbiddle
 */
const MAX_SAFE_CANVAS_DIMENSION = 8192;
const MAX_SAFE_CANVAS_AREA = 4096 * 4096;
const TEST_SIZES = {
  area: [
    // Chrome 70 (Mac, Win)
    // Chrome 68 (Android 4.4)
    // Edge 17 (Win)
    // Safari 7-12 (Mac)
    16384,
    // Chrome 68 (Android 7.1-9)
    14188,
    // Chrome 68 (Android 5)
    11402,
    // Firefox 63 (Mac, Win)
    11180,
    // Chrome 68 (Android 6)
    10836,
    // IE 9-11 (Win)
    8192,
    // IE Mobile (Windows Phone 8.x)
    // Safari (iOS 9 - 12)
    4096
  ],
  height: [
    // Safari 7-12 (Mac)
    // Safari (iOS 9-12)
    8388607,
    // Chrome 83 (Mac, Win)
    65535,
    // Chrome 70 (Mac, Win)
    // Chrome 68 (Android 4.4-9)
    // Firefox 63 (Mac, Win)
    32767,
    // Edge 17 (Win)
    // IE11 (Win)
    16384,
    // IE 9-10 (Win)
    8192,
    // IE Mobile (Windows Phone 8.x)
    4096
  ],
  width: [
    // Safari 7-12 (Mac)
    // Safari (iOS 9-12)
    4194303,
    // Chrome 83 (Mac, Win)
    65535,
    // Chrome 70 (Mac, Win)
    // Chrome 68 (Android 4.4-9)
    // Firefox 63 (Mac, Win)
    32767,
    // Edge 17 (Win)
    // IE11 (Win)
    16384,
    // IE 9-10 (Win)
    8192,
    // IE Mobile (Windows Phone 8.x)
    4096
  ]
};
function getCanvasSize(dimension) {
  const cropCvs = document.createElement("canvas");
  cropCvs.width = 1;
  cropCvs.height = 1;
  const cropCtx = cropCvs.getContext("2d");
  for (const size of TEST_SIZES[dimension]) {
    const w = dimension === "height" ? 1 : size;
    const h = dimension === "width" ? 1 : size;
    const testCvs = document.createElement("canvas");
    testCvs.width = w;
    testCvs.height = h;
    const testCtx = testCvs.getContext("2d");
    testCtx.fillRect(w - 1, h - 1, 1, 1);
    cropCtx.drawImage(testCvs, w - 1, h - 1, 1, 1, 0, 0, 1, 1);
    const isTestPassed = cropCtx.getImageData(0, 0, 1, 1).data[3] !== 0;
    testCvs.width = 0;
    testCvs.height = 0;
    if (isTestPassed) {
      cropCvs.width = 0;
      cropCvs.height = 0;
      if (dimension === "area") {
        return size * size;
      } else {
        return size;
      }
    }
  }
  cropCvs.width = 0;
  cropCvs.height = 0;
  throw Error("Failed to determine maximum canvas dimension");
}
function clampToBrowserMaxCanvasSize(width, height) {
  if (width <= MAX_SAFE_CANVAS_DIMENSION && height <= MAX_SAFE_CANVAS_DIMENSION && width * height <= MAX_SAFE_CANVAS_AREA) {
    return [width, height];
  }
  const { maxWidth, maxHeight, maxArea } = getBrowserCanvasMaxSize();
  const aspectRatio = width / height;
  if (width > maxWidth) {
    width = maxWidth;
    height = width / aspectRatio;
  }
  if (height > maxHeight) {
    height = maxHeight;
    width = height * aspectRatio;
  }
  if (width * height > maxArea) {
    const ratio = Math.sqrt(maxArea / (width * height));
    width *= ratio;
    height *= ratio;
  }
  return [width, height];
}
export {
  clampToBrowserMaxCanvasSize,
  getCanvasSize
};
//# sourceMappingURL=browserCanvasMaxSize.mjs.map
