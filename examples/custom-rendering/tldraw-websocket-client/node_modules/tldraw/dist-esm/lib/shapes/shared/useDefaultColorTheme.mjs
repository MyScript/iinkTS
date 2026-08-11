import { getDefaultColorTheme, useIsDarkMode } from "@tldraw/editor";
function useDefaultColorTheme() {
  return getDefaultColorTheme({ isDarkMode: useIsDarkMode() });
}
export {
  useDefaultColorTheme
};
//# sourceMappingURL=useDefaultColorTheme.mjs.map
