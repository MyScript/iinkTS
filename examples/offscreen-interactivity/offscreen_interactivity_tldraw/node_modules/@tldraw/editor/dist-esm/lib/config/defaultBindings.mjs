function checkBindings(customBindings) {
  const bindings = [];
  const addedCustomBindingTypes = /* @__PURE__ */ new Set();
  for (const customBinding of customBindings) {
    if (addedCustomBindingTypes.has(customBinding.type)) {
      throw new Error(`Binding type "${customBinding.type}" is defined more than once`);
    }
    bindings.push(customBinding);
    addedCustomBindingTypes.add(customBinding.type);
  }
  return bindings;
}
export {
  checkBindings
};
//# sourceMappingURL=defaultBindings.mjs.map
