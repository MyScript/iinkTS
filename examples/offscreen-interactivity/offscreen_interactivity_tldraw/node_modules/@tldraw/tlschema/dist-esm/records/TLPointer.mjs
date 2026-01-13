import {
  createMigrationIds,
  createRecordMigrationSequence,
  createRecordType
} from "@tldraw/store";
import { T } from "@tldraw/validate";
import { idValidator } from "../misc/id-validator.mjs";
const pointerValidator = T.model(
  "pointer",
  T.object({
    typeName: T.literal("pointer"),
    id: idValidator("pointer"),
    x: T.number,
    y: T.number,
    lastActivityTimestamp: T.number,
    meta: T.jsonValue
  })
);
const pointerVersions = createMigrationIds("com.tldraw.pointer", {
  AddMeta: 1
});
const pointerMigrations = createRecordMigrationSequence({
  sequenceId: "com.tldraw.pointer",
  recordType: "pointer",
  sequence: [
    {
      id: pointerVersions.AddMeta,
      up: (record) => {
        record.meta = {};
      }
    }
  ]
});
const PointerRecordType = createRecordType("pointer", {
  validator: pointerValidator,
  scope: "session"
}).withDefaultProperties(
  () => ({
    x: 0,
    y: 0,
    lastActivityTimestamp: 0,
    meta: {}
  })
);
const TLPOINTER_ID = PointerRecordType.createId("pointer");
export {
  PointerRecordType,
  TLPOINTER_ID,
  pointerMigrations,
  pointerValidator,
  pointerVersions
};
//# sourceMappingURL=TLPointer.mjs.map
