const MAX_ZOOM_STEP = 10;
const IS_DARWIN = /Mac|iPod|iPhone|iPad/.test(
  // eslint-disable-next-line @typescript-eslint/no-deprecated
  typeof window === "undefined" ? "node" : window.navigator.platform
);
function normalizeWheel(event) {
  let { deltaY, deltaX } = event;
  let deltaZ = 0;
  if (event.ctrlKey || event.altKey || event.metaKey) {
    deltaZ = (Math.abs(deltaY) > MAX_ZOOM_STEP ? MAX_ZOOM_STEP * Math.sign(deltaY) : deltaY) / 100;
  } else {
    if (event.shiftKey && !IS_DARWIN) {
      deltaX = deltaY;
      deltaY = 0;
    }
  }
  return { x: -deltaX, y: -deltaY, z: -deltaZ };
}
export {
  normalizeWheel
};
//# sourceMappingURL=normalizeWheel.mjs.map
