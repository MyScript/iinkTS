import { getIndices, objectMapFromEntries, sortByIndex } from "@tldraw/utils";
import { T } from "@tldraw/validate";
import { createShapePropsMigrationIds, createShapePropsMigrationSequence } from "../records/TLShape.mjs";
import { StyleProp } from "../styles/StyleProp.mjs";
import { DefaultColorStyle } from "../styles/TLColorStyle.mjs";
import { DefaultDashStyle } from "../styles/TLDashStyle.mjs";
import { DefaultSizeStyle } from "../styles/TLSizeStyle.mjs";
const LineShapeSplineStyle = StyleProp.defineEnum("tldraw:spline", {
  defaultValue: "line",
  values: ["cubic", "line"]
});
const lineShapePointValidator = T.object({
  id: T.string,
  index: T.indexKey,
  x: T.number,
  y: T.number
});
const lineShapeProps = {
  color: DefaultColorStyle,
  dash: DefaultDashStyle,
  size: DefaultSizeStyle,
  spline: LineShapeSplineStyle,
  points: T.dict(T.string, lineShapePointValidator),
  scale: T.nonZeroNumber
};
const lineShapeVersions = createShapePropsMigrationIds("line", {
  AddSnapHandles: 1,
  RemoveExtraHandleProps: 2,
  HandlesToPoints: 3,
  PointIndexIds: 4,
  AddScale: 5
});
const lineShapeMigrations = createShapePropsMigrationSequence({
  sequence: [
    {
      id: lineShapeVersions.AddSnapHandles,
      up: (props) => {
        for (const handle of Object.values(props.handles)) {
          ;
          handle.canSnap = true;
        }
      },
      down: "retired"
    },
    {
      id: lineShapeVersions.RemoveExtraHandleProps,
      up: (props) => {
        props.handles = objectMapFromEntries(
          Object.values(props.handles).map((handle) => [
            handle.index,
            {
              x: handle.x,
              y: handle.y
            }
          ])
        );
      },
      down: (props) => {
        const handles = Object.entries(props.handles).map(([index, handle]) => ({ index, ...handle })).sort(sortByIndex);
        props.handles = Object.fromEntries(
          handles.map((handle, i) => {
            const id = i === 0 ? "start" : i === handles.length - 1 ? "end" : `handle:${handle.index}`;
            return [
              id,
              {
                id,
                type: "vertex",
                canBind: false,
                canSnap: true,
                index: handle.index,
                x: handle.x,
                y: handle.y
              }
            ];
          })
        );
      }
    },
    {
      id: lineShapeVersions.HandlesToPoints,
      up: (props) => {
        const sortedHandles = Object.entries(props.handles).map(([index, { x, y }]) => ({ x, y, index })).sort(sortByIndex);
        props.points = sortedHandles.map(({ x, y }) => ({ x, y }));
        delete props.handles;
      },
      down: (props) => {
        const indices = getIndices(props.points.length);
        props.handles = Object.fromEntries(
          props.points.map((handle, i) => {
            const index = indices[i];
            return [
              index,
              {
                x: handle.x,
                y: handle.y
              }
            ];
          })
        );
        delete props.points;
      }
    },
    {
      id: lineShapeVersions.PointIndexIds,
      up: (props) => {
        const indices = getIndices(props.points.length);
        props.points = Object.fromEntries(
          props.points.map((point, i) => {
            const id = indices[i];
            return [
              id,
              {
                id,
                index: id,
                x: point.x,
                y: point.y
              }
            ];
          })
        );
      },
      down: (props) => {
        const sortedHandles = Object.values(props.points).sort(sortByIndex);
        props.points = sortedHandles.map(({ x, y }) => ({ x, y }));
      }
    },
    {
      id: lineShapeVersions.AddScale,
      up: (props) => {
        props.scale = 1;
      },
      down: (props) => {
        delete props.scale;
      }
    }
  ]
});
export {
  LineShapeSplineStyle,
  lineShapeMigrations,
  lineShapeProps,
  lineShapeVersions
};
//# sourceMappingURL=TLLineShape.mjs.map
