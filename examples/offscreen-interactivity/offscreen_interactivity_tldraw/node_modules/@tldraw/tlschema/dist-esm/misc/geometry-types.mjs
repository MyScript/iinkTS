import { T } from "@tldraw/validate";
const vecModelValidator = T.object({
  x: T.number,
  y: T.number,
  z: T.number.optional()
});
const boxModelValidator = T.object({
  x: T.number,
  y: T.number,
  w: T.number,
  h: T.number
});
export {
  boxModelValidator,
  vecModelValidator
};
//# sourceMappingURL=geometry-types.mjs.map
