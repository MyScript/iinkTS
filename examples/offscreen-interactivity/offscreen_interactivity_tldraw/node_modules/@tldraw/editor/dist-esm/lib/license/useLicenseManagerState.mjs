import { useValue } from "@tldraw/state-react";
function useLicenseManagerState(licenseManager) {
  return useValue("watermarkState", () => licenseManager.state.get(), [licenseManager]);
}
export {
  useLicenseManagerState
};
//# sourceMappingURL=useLicenseManagerState.mjs.map
