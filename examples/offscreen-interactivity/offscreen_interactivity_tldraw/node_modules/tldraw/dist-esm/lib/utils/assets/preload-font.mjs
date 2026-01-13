async function preloadFont(id, font) {
  const {
    url,
    style = "normal",
    weight = "500",
    display,
    featureSettings,
    stretch,
    unicodeRange,
    variant,
    format
  } = font;
  const descriptors = {
    style,
    weight,
    display,
    featureSettings,
    stretch,
    unicodeRange,
    // @ts-expect-error why is this here
    variant
  };
  const fontInstance = new FontFace(id, `url(${url})`, descriptors);
  await fontInstance.load();
  document.fonts.add(fontInstance);
  fontInstance.$$_url = url;
  fontInstance.$$_fontface = `
@font-face {
	font-family: ${fontInstance.family};
	font-stretch: ${fontInstance.stretch};
	font-weight: ${fontInstance.weight};
	font-style: ${fontInstance.style};
	src: url("${url}") format("${format}")
}`;
  return fontInstance;
}
export {
  preloadFont
};
//# sourceMappingURL=preload-font.mjs.map
