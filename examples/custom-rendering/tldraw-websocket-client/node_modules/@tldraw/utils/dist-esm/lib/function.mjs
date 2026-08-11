function omitFromStackTrace(fn) {
  const wrappedFn = (...args) => {
    try {
      return fn(...args);
    } catch (error) {
      if (error instanceof Error && Error.captureStackTrace) {
        Error.captureStackTrace(error, wrappedFn);
      }
      throw error;
    }
  };
  return wrappedFn;
}
const noop = () => {
};
export {
  noop,
  omitFromStackTrace
};
//# sourceMappingURL=function.mjs.map
