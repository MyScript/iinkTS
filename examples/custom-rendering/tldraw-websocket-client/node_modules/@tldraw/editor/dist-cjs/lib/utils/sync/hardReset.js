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
var hardReset_exports = {};
__export(hardReset_exports, {
  hardReset: () => hardReset
});
module.exports = __toCommonJS(hardReset_exports);
var import_utils = require("@tldraw/utils");
var import_idb = require("idb");
var import_LocalIndexedDb = require("./LocalIndexedDb");
async function hardReset({ shouldReload = true } = {}) {
  (0, import_utils.clearSessionStorage)();
  for (const instance of import_LocalIndexedDb.LocalIndexedDb.connectedInstances) {
    await instance.close();
  }
  await Promise.all((0, import_LocalIndexedDb.getAllIndexDbNames)().map((db) => (0, import_idb.deleteDB)(db)));
  (0, import_utils.clearLocalStorage)();
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
//# sourceMappingURL=hardReset.js.map
