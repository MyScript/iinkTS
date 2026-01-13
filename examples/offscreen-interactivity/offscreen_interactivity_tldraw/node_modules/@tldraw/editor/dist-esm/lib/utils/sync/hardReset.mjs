import { clearLocalStorage, clearSessionStorage } from "@tldraw/utils";
import { deleteDB } from "idb";
import { LocalIndexedDb, getAllIndexDbNames } from "./LocalIndexedDb.mjs";
async function hardReset({ shouldReload = true } = {}) {
  clearSessionStorage();
  for (const instance of LocalIndexedDb.connectedInstances) {
    await instance.close();
  }
  await Promise.all(getAllIndexDbNames().map((db) => deleteDB(db)));
  clearLocalStorage();
  if (shouldReload) {
    window.location.reload();
  }
}
if (typeof window !== "undefined") {
  if (process.env.NODE_ENV === "development") {
    ;
    window.hardReset = hardReset;
  }
  ;
  window.__tldraw__hardReset = hardReset;
}
export {
  hardReset
};
//# sourceMappingURL=hardReset.mjs.map
