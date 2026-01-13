function getStrokeRadius(size, thinning, pressure, easing = (t) => t) {
  return size * easing(0.5 - thinning * (0.5 - pressure));
}
export {
  getStrokeRadius
};
//# sourceMappingURL=getStrokeRadius.mjs.map
