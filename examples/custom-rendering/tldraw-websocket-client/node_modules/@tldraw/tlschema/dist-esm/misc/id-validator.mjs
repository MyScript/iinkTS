import { T } from "@tldraw/validate";
function idValidator(prefix) {
  return T.string.refine((id) => {
    if (!id.startsWith(`${prefix}:`)) {
      throw new Error(`${prefix} ID must start with "${prefix}:"`);
    }
    return id;
  });
}
export {
  idValidator
};
//# sourceMappingURL=id-validator.mjs.map
