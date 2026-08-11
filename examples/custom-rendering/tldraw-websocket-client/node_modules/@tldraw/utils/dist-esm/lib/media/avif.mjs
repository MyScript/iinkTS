const isAvifAnimated = (buffer) => {
  const view = new Uint8Array(buffer);
  return view[3] === 44;
};
export {
  isAvifAnimated
};
//# sourceMappingURL=avif.mjs.map
