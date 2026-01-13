import { StyleProp } from "./StyleProp.mjs";
const DefaultFontStyle = StyleProp.defineEnum("tldraw:font", {
  defaultValue: "draw",
  values: ["draw", "sans", "serif", "mono"]
});
const DefaultFontFamilies = {
  draw: "'tldraw_draw', sans-serif",
  sans: "'tldraw_sans', sans-serif",
  serif: "'tldraw_serif', serif",
  mono: "'tldraw_mono', monospace"
};
export {
  DefaultFontFamilies,
  DefaultFontStyle
};
//# sourceMappingURL=TLFontStyle.mjs.map
