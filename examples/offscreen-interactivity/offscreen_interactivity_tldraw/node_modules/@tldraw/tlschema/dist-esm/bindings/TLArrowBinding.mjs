import { T } from "@tldraw/validate";
import { vecModelValidator } from "../misc/geometry-types.mjs";
import {
  createBindingPropsMigrationIds,
  createBindingPropsMigrationSequence
} from "../records/TLBinding.mjs";
import { arrowShapeVersions } from "../shapes/TLArrowShape.mjs";
const ElbowArrowSnap = T.literalEnum("center", "edge-point", "edge", "none");
const arrowBindingProps = {
  terminal: T.literalEnum("start", "end"),
  normalizedAnchor: vecModelValidator,
  isExact: T.boolean,
  isPrecise: T.boolean,
  snap: ElbowArrowSnap
};
const arrowBindingVersions = createBindingPropsMigrationIds("arrow", {
  AddSnap: 1
});
const arrowBindingMigrations = createBindingPropsMigrationSequence({
  sequence: [
    { dependsOn: [arrowShapeVersions.ExtractBindings] },
    {
      id: arrowBindingVersions.AddSnap,
      up: (props) => {
        props.snap = "none";
      },
      down: (props) => {
        delete props.snap;
      }
    }
  ]
});
export {
  ElbowArrowSnap,
  arrowBindingMigrations,
  arrowBindingProps,
  arrowBindingVersions
};
//# sourceMappingURL=TLArrowBinding.mjs.map
