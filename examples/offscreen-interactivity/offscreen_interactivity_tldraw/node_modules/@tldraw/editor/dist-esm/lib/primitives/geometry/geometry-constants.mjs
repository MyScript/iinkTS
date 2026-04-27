const SPACING = 20;
const MIN_COUNT = 8;
function getVerticesCountForArcLength(length, spacing = SPACING) {
  return Math.max(MIN_COUNT, Math.ceil(length / spacing));
}
export {
  getVerticesCountForArcLength
};
//# sourceMappingURL=geometry-constants.mjs.map
