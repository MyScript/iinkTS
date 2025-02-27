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
var useTLStore_exports = {};
__export(useTLStore_exports, {
  useTLSchemaFromUtils: () => useTLSchemaFromUtils,
  useTLStore: () => useTLStore
});
module.exports = __toCommonJS(useTLStore_exports);
var import_utils = require("@tldraw/utils");
var import_react = require("react");
var import_createTLStore = require("../config/createTLStore");
function useTLStore(opts) {
  const [current, setCurrent] = (0, import_react.useState)(() => ({ store: (0, import_createTLStore.createTLStore)(opts), opts }));
  if (!(0, import_utils.areObjectsShallowEqual)(current.opts, opts)) {
    const next = { store: (0, import_createTLStore.createTLStore)(opts), opts };
    setCurrent(next);
    return next.store;
  }
  return current.store;
}
function useTLSchemaFromUtils(opts) {
  const [current, setCurrent] = (0, import_react.useState)(() => ({ opts, schema: (0, import_createTLStore.createTLSchemaFromUtils)(opts) }));
  if (!(0, import_utils.areObjectsShallowEqual)(current.opts, opts)) {
    const next = (0, import_createTLStore.createTLSchemaFromUtils)(opts);
    setCurrent({ opts, schema: next });
    return next;
  }
  return current.schema;
}
//# sourceMappingURL=useTLStore.js.map
