import {
  createMigrationIds,
  createRecordMigrationSequence,
  createRecordType
} from "@tldraw/store";
import { T } from "@tldraw/validate";
const documentValidator = T.model(
  "document",
  T.object({
    typeName: T.literal("document"),
    id: T.literal("document:document"),
    gridSize: T.number,
    name: T.string,
    meta: T.jsonValue
  })
);
function isDocument(record) {
  if (!record) return false;
  return record.typeName === "document";
}
const documentVersions = createMigrationIds("com.tldraw.document", {
  AddName: 1,
  AddMeta: 2
});
const documentMigrations = createRecordMigrationSequence({
  sequenceId: "com.tldraw.document",
  recordType: "document",
  sequence: [
    {
      id: documentVersions.AddName,
      up: (document) => {
        ;
        document.name = "";
      },
      down: (document) => {
        delete document.name;
      }
    },
    {
      id: documentVersions.AddMeta,
      up: (record) => {
        ;
        record.meta = {};
      }
    }
  ]
});
const DocumentRecordType = createRecordType("document", {
  validator: documentValidator,
  scope: "document"
}).withDefaultProperties(
  () => ({
    gridSize: 10,
    name: "",
    meta: {}
  })
);
const TLDOCUMENT_ID = DocumentRecordType.createId("document");
export {
  DocumentRecordType,
  TLDOCUMENT_ID,
  documentMigrations,
  documentValidator,
  documentVersions,
  isDocument
};
//# sourceMappingURL=TLDocument.mjs.map
