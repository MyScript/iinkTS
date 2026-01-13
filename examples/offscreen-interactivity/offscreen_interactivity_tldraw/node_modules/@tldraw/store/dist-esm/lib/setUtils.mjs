function intersectSets(sets) {
  if (sets.length === 0) return /* @__PURE__ */ new Set();
  const first = sets[0];
  const rest = sets.slice(1);
  const result = /* @__PURE__ */ new Set();
  for (const val of first) {
    if (rest.every((set) => set.has(val))) {
      result.add(val);
    }
  }
  return result;
}
function diffSets(prev, next) {
  const result = {};
  for (const val of next) {
    if (!prev.has(val)) {
      result.added ??= /* @__PURE__ */ new Set();
      result.added.add(val);
    }
  }
  for (const val of prev) {
    if (!next.has(val)) {
      result.removed ??= /* @__PURE__ */ new Set();
      result.removed.add(val);
    }
  }
  return result.added || result.removed ? result : void 0;
}
export {
  diffSets,
  intersectSets
};
//# sourceMappingURL=setUtils.mjs.map
