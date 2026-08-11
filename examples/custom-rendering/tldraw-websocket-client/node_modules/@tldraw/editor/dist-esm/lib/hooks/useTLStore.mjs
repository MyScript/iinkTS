import { areObjectsShallowEqual } from "@tldraw/utils";
import { useState } from "react";
import {
  createTLSchemaFromUtils,
  createTLStore
} from "../config/createTLStore.mjs";
function useTLStore(opts) {
  const [current, setCurrent] = useState(() => ({ store: createTLStore(opts), opts }));
  if (!areObjectsShallowEqual(current.opts, opts)) {
    const next = { store: createTLStore(opts), opts };
    setCurrent(next);
    return next.store;
  }
  return current.store;
}
function useTLSchemaFromUtils(opts) {
  const [current, setCurrent] = useState(() => ({ opts, schema: createTLSchemaFromUtils(opts) }));
  if (!areObjectsShallowEqual(current.opts, opts)) {
    const next = createTLSchemaFromUtils(opts);
    setCurrent({ opts, schema: next });
    return next;
  }
  return current.schema;
}
export {
  useTLSchemaFromUtils,
  useTLStore
};
//# sourceMappingURL=useTLStore.mjs.map
