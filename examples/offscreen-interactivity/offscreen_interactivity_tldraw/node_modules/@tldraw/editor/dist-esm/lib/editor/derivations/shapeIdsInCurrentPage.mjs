import { computed, isUninitialized, RESET_VALUE, withDiff } from "@tldraw/state";
import { IncrementalSetConstructor } from "@tldraw/store";
import {
  isPageId,
  isShape,
  isShapeId
} from "@tldraw/tlschema";
const isShapeInPage = (store, pageId, shape) => {
  while (!isPageId(shape.parentId)) {
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
  return computed("_shapeIdsInCurrentPage", (prevValue, lastComputedEpoch) => {
    if (isUninitialized(prevValue)) {
      return fromScratch();
    }
    const currentPageId = getCurrentPageId();
    if (currentPageId !== lastPageId) {
      return fromScratch();
    }
    const diff = store.history.getDiffSince(lastComputedEpoch);
    if (diff === RESET_VALUE) {
      return fromScratch();
    }
    const builder = new IncrementalSetConstructor(
      prevValue
    );
    for (const changes of diff) {
      for (const record of Object.values(changes.added)) {
        if (isShape(record) && isShapeInPage(store, currentPageId, record)) {
          builder.add(record.id);
        }
      }
      for (const [_from, to] of Object.values(changes.updated)) {
        if (isShape(to)) {
          if (isShapeInPage(store, currentPageId, to)) {
            builder.add(to.id);
          } else {
            builder.remove(to.id);
          }
        }
      }
      for (const id of Object.keys(changes.removed)) {
        if (isShapeId(id)) {
          builder.remove(id);
        }
      }
    }
    const result = builder.get();
    if (!result) {
      return prevValue;
    }
    return withDiff(result.value, result.diff);
  });
};
export {
  deriveShapeIdsInCurrentPage
};
//# sourceMappingURL=shapeIdsInCurrentPage.mjs.map
