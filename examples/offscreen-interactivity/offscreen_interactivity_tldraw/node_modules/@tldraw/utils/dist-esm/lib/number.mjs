function lerp(a, b, t) {
  return a + (b - a) * t;
}
function invLerp(a, b, t) {
  return (t - a) / (b - a);
}
function rng(seed = "") {
  let x = 0;
  let y = 0;
  let z = 0;
  let w = 0;
  function next() {
    const t = x ^ x << 11;
    x = y;
    y = z;
    z = w;
    w ^= (w >>> 19 ^ t ^ t >>> 8) >>> 0;
    return w / 4294967296 * 2;
  }
  for (let k = 0; k < seed.length + 64; k++) {
    x ^= seed.charCodeAt(k) | 0;
    next();
  }
  return next;
}
function modulate(value, rangeA, rangeB, clamp = false) {
  const [fromLow, fromHigh] = rangeA;
  const [v0, v1] = rangeB;
  const result = v0 + (value - fromLow) / (fromHigh - fromLow) * (v1 - v0);
  return clamp ? v0 < v1 ? Math.max(Math.min(result, v1), v0) : Math.max(Math.min(result, v0), v1) : result;
}
export {
  invLerp,
  lerp,
  modulate,
  rng
};
//# sourceMappingURL=number.mjs.map
