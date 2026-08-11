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
var shapeIdsInCurrentPage_exports = {};
__export(shapeIdsInCurrentPage_exports, {
  deriveShapeIdsInCurrentPage: () => deriveShapeIdsInCurrentPage
});
module.exports = __toCommonJS(shapeIdsInCurrentPage_exports);
var import_state = require("@tldraw/state");
var import_store = require("@tldraw/store");
var import_tlschema = require("@tldraw/tlschema");
const isShapeInPage = (store, pageId, shape) => {
  while (!(0, import_tlschema.isPageId)(shape.parentId)) {
    const parent = store.get(shape.parentId);
    if (!parent) return false;
    shape = parent;
  }
  return shape.parentId === pageId;
};
const deriveShapeIdsInCurrentPage = (store, getCurrentPageId) => {
  const shapesIndex = store.query.ids("shape");
  let lastPageId = null;
  function fromScratch() {
    const currentPageId = getCurrentPageId();
    lastPageId = currentPageId;
    return new Set(
      [...shapesIndex.get()].filter((id) => isShapeInPage(store, currentPageId, store.get(id)))
    );
  }
  return (0, import_state.computed)("_shapeIdsInCurrentPage", (prevValue, lastComputedEpoch) => {
    if ((0, import_state.isUninitialized)(prevValue)) {
      return fromScratch();
    }
    const currentPageId = getCurrentPageId();
    if (currentPageId !== lastPageId) {
      return fromScratch();
    }
    const diff = store.history.getDiffSince(lastComputedEpoch);
    if (diff === import_state.RESET_VALUE) {
      return fromScratch();
    }
    const builder = new import_store.IncrementalSetConstructor(
      prevValue
    );
    for (const changes of diff) {
      for (const record of Object.values(changes.added)) {
        if ((0, import_tlschema.isShape)(record) && isShapeInPage(store, currentPageId, record)) {
          builder.add(record.id);
        }
      }
      for (const [_from, to] of Object.values(changes.updated)) {
        if ((0, import_tlschema.isShape)(to)) {
          if (isShapeInPage(store, currentPageId, to)) {
            builder.add(to.id);
          } else {
            builder.remove(to.id);
          }
        }
      }
      for (const id of Object.keys(changes.removed)) {
        if ((0, import_tlschema.isShapeId)(id)) {
          builder.remove(id);
        }
      }
    }
    const result = builder.get();
    if (!result) {
      return prevValue;
    }
    return (0, import_state.withDiff)(result.value, result.diff);
  });
};
//# sourceMappingURL=shapeIdsInCurrentPage.js.map
