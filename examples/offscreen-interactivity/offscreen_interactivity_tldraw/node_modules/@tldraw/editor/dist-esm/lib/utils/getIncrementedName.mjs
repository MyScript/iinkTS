function getIncrementedName(name, others) {
  let result = name;
  const set = new Set(others);
  while (set.has(result)) {
    result = /^.*(\d+)$/.exec(result)?.[1] ? result.replace(/(\d+)(?=\D?)$/, (m) => {
      return (+m + 1).toString();
    }) : `${result} 1`;
  }
  return result;
}
export {
  getIncrementedName
};
//# sourceMappingURL=getIncrementedName.mjs.map
