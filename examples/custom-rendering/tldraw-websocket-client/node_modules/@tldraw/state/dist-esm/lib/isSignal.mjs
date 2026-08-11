import { _Atom } from "./Atom.mjs";
import { _Computed } from "./Computed.mjs";
function isSignal(value) {
  return value instanceof _Atom || value instanceof _Computed;
}
export {
  isSignal
};
//# sourceMappingURL=isSignal.mjs.map
