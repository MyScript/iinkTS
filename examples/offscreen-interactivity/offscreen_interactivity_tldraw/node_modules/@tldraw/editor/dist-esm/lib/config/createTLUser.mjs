import { computed, isSignal } from "@tldraw/state";
import { useAtom } from "@tldraw/state-react";
import { useEffect, useMemo } from "react";
import { useShallowObjectIdentity } from "../hooks/useIdentity.mjs";
import { getUserPreferences, setUserPreferences } from "./TLUserPreferences.mjs";
const defaultLocalStorageUserPrefs = computed(
  "defaultLocalStorageUserPrefs",
  () => getUserPreferences()
);
function createTLUser(opts = {}) {
  return {
    userPreferences: opts.userPreferences ?? defaultLocalStorageUserPrefs,
    setUserPreferences: opts.setUserPreferences ?? setUserPreferences
  };
}
function useTldrawUser(opts) {
  const prefs = useShallowObjectIdentity(opts.userPreferences ?? defaultLocalStorageUserPrefs);
  const userAtom = useAtom("userAtom", prefs);
  useEffect(() => {
    userAtom.set(prefs);
  }, [prefs, userAtom]);
  return useMemo(
    () => createTLUser({
      userPreferences: computed("userPreferences", () => {
        const userStuff = userAtom.get();
        return isSignal(userStuff) ? userStuff.get() : userStuff;
      }),
      setUserPreferences: opts.setUserPreferences
    }),
    [userAtom, opts.setUserPreferences]
  );
}
export {
  createTLUser,
  useTldrawUser
};
//# sourceMappingURL=createTLUser.mjs.map
