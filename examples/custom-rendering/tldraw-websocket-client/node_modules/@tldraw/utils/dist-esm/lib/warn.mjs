const usedWarnings = /* @__PURE__ */ new Set();
function warnDeprecatedGetter(name) {
  warnOnce(
    `Using '${name}' is deprecated and will be removed in the near future. Please refactor to use 'get${name[0].toLocaleUpperCase()}${name.slice(
      1
    )}' instead.`
  );
}
function warnOnce(message) {
  if (usedWarnings.has(message)) return;
  usedWarnings.add(message);
  console.warn(`[tldraw] ${message}`);
}
export {
  warnDeprecatedGetter,
  warnOnce
};
//# sourceMappingURL=warn.mjs.map
