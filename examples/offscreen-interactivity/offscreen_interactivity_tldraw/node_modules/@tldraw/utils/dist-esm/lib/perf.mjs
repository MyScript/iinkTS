const PERFORMANCE_COLORS = {
  Good: "#40C057",
  Mid: "#FFC078",
  Poor: "#E03131"
};
const PERFORMANCE_PREFIX_COLOR = PERFORMANCE_COLORS.Good;
function measureCbDuration(name, cb) {
  const start = performance.now();
  const result = cb();
  console.debug(
    `%cPerf%c ${name} took ${performance.now() - start}ms`,
    `color: white; background: ${PERFORMANCE_PREFIX_COLOR};padding: 2px;border-radius: 3px;`,
    "font-weight: normal"
  );
  return result;
}
function measureDuration(_target, propertyKey, descriptor) {
  const originalMethod = descriptor.value;
  descriptor.value = function(...args) {
    const start = performance.now();
    const result = originalMethod.apply(this, args);
    console.debug(
      `%cPerf%c ${propertyKey} took: ${performance.now() - start}ms`,
      `color: white; background: ${PERFORMANCE_PREFIX_COLOR};padding: 2px;border-radius: 3px;`,
      "font-weight: normal"
    );
    return result;
  };
  return descriptor;
}
const averages = /* @__PURE__ */ new Map();
function measureAverageDuration(_target, propertyKey, descriptor) {
  const originalMethod = descriptor.value;
  descriptor.value = function(...args) {
    const start = performance.now();
    const result = originalMethod.apply(this, args);
    const end = performance.now();
    const length = end - start;
    if (length !== 0) {
      const value = averages.get(descriptor.value);
      const total = value.total + length;
      const count = value.count + 1;
      averages.set(descriptor.value, { total, count });
      console.debug(
        `%cPerf%c ${propertyKey} took ${(end - start).toFixed(2)}ms | average ${(total / count).toFixed(2)}ms`,
        `color: white; background: ${PERFORMANCE_PREFIX_COLOR};padding: 2px;border-radius: 3px;`,
        "font-weight: normal"
      );
    }
    return result;
  };
  averages.set(descriptor.value, { total: 0, count: 0 });
  return descriptor;
}
export {
  PERFORMANCE_COLORS,
  PERFORMANCE_PREFIX_COLOR,
  measureAverageDuration,
  measureCbDuration,
  measureDuration
};
//# sourceMappingURL=perf.mjs.map
