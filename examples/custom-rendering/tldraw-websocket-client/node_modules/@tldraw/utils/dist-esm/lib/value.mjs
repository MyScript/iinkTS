function isDefined(value) {
  return value !== void 0;
}
function isNonNull(value) {
  return value !== null;
}
function isNonNullish(value) {
  return value !== null && value !== void 0;
}
function getStructuredClone() {
  if (typeof globalThis !== "undefined" && globalThis.structuredClone) {
    return [globalThis.structuredClone, true];
  }
  if (typeof global !== "undefined" && global.structuredClone) {
    return [global.structuredClone, true];
  }
  if (typeof window !== "undefined" && window.structuredClone) {
    return [window.structuredClone, true];
  }
  return [(i) => i ? JSON.parse(JSON.stringify(i)) : i, false];
}
const _structuredClone = getStructuredClone();
const structuredClone = _structuredClone[0];
const isNativeStructuredClone = _structuredClone[1];
const STRUCTURED_CLONE_OBJECT_PROTOTYPE = Object.getPrototypeOf(structuredClone({}));
export {
  STRUCTURED_CLONE_OBJECT_PROTOTYPE,
  isDefined,
  isNativeStructuredClone,
  isNonNull,
  isNonNullish,
  structuredClone
};
//# sourceMappingURL=value.mjs.map
