function debounce(callback, wait) {
  let state = void 0;
  const fn = (...args) => {
    if (!state) {
      state = {};
      state.promise = new Promise((resolve, reject) => {
        state.resolve = resolve;
        state.reject = reject;
      });
    }
    clearTimeout(state.timeout);
    state.latestArgs = args;
    state.timeout = setTimeout(() => {
      const s = state;
      state = void 0;
      try {
        s.resolve(callback(...s.latestArgs));
      } catch (e) {
        s.reject(e);
      }
    }, wait);
    return state.promise;
  };
  fn.cancel = () => {
    if (!state) return;
    clearTimeout(state.timeout);
  };
  return fn;
}
export {
  debounce
};
//# sourceMappingURL=debounce.mjs.map
