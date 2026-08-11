const safeParseUrl = (url, baseUrl) => {
  try {
    return new URL(url, baseUrl);
  } catch {
    return;
  }
};
export {
  safeParseUrl
};
//# sourceMappingURL=url.mjs.map
