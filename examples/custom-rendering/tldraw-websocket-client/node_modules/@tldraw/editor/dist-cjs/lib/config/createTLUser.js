"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var createTLUser_exports = {};
__export(createTLUser_exports, {
  createTLUser: () => createTLUser,
  useTldrawUser: () => useTldrawUser
});
module.exports = __toCommonJS(createTLUser_exports);
var import_state = require("@tldraw/state");
var import_state_react = require("@tldraw/state-react");
var import_react = require("react");
var import_useIdentity = require("../hooks/useIdentity");
var import_TLUserPreferences = require("./TLUserPreferences");
const defaultLocalStorageUserPrefs = (0, import_state.computed)(
  "defaultLocalStorageUserPrefs",
  () => (0, import_TLUserPreferences.getUserPreferences)()
);
function createTLUser(opts = {}) {
  return {
    userPreferences: opts.userPreferences ?? defaultLocalStorageUserPrefs,
    setUserPreferences: opts.setUserPreferences ?? import_TLUserPreferences.setUserPreferences
  };
}
function useTldrawUser(opts) {
  const prefs = (0, import_useIdentity.useShallowObjectIdentity)(opts.userPreferences ?? defaultLocalStorageUserPrefs);
  const userAtom = (0, import_state_react.useAtom)("userAtom", prefs);
  (0, import_react.useEffect)(() => {
    userAtom.set(prefs);
  }, [prefs, userAtom]);
  return (0, import_react.useMemo)(
    () => createTLUser({
      userPreferences: (0, import_state.computed)("userPreferences", () => {
        const userStuff = userAtom.get();
        return (0, import_state.isSignal)(userStuff) ? userStuff.get() : userStuff;
      }),
      setUserPreferences: opts.setUserPreferences
    }),
    [userAtom, opts.setUserPreferences]
  );
}
//# sourceMappingURL=createTLUser.js.map
