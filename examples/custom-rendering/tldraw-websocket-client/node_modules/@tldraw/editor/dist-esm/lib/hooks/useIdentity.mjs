import { areArraysShallowEqual, areObjectsShallowEqual } from "@tldraw/utils";
import { useRef } from "react";
function useIdentity(value, isEqual) {
  const ref = useRef(value);
  if (isEqual(value, ref.current)) {
    return ref.current;
  }
  ref.current = value;
  return value;
}
const areNullableArraysShallowEqual = (a, b) => {
  a ??= null;
  b ??= null;
  if (a === b) {
    return true;
  }
  if (!a || !b) {
    return false;
  }
  return areArraysShallowEqual(a, b);
};
function useShallowArrayIdentity(arr) {
  return useIdentity(arr, areNullableArraysShallowEqual);
}
const areNullableObjectsShallowEqual = (a, b) => {
  a ??= null;
  b ??= null;
  if (a === b) {
    return true;
  }
  if (!a || !b) {
    return false;
  }
  return areObjectsShallowEqual(a, b);
};
function useShallowObjectIdentity(obj) {
  return useIdentity(obj, areNullableObjectsShallowEqual);
}
export {
  useShallowArrayIdentity,
  useShallowObjectIdentity
};
//# sourceMappingURL=useIdentity.mjs.map
