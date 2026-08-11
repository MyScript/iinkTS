function stringEnum(...values) {
  const obj = {};
  for (const value of values) {
    obj[value] = value;
  }
  return obj;
}
export {
  stringEnum
};
//# sourceMappingURL=stringEnum.mjs.map
