import {
  createMigrationIds,
  createRecordMigrationSequence,
  createRecordType
} from "@tldraw/store";
import { mapObjectMapValues, uniqueId } from "@tldraw/utils";
import { T } from "@tldraw/validate";
import { createBindingValidator } from "../bindings/TLBaseBinding.mjs";
const rootBindingVersions = createMigrationIds("com.tldraw.binding", {});
const rootBindingMigrations = createRecordMigrationSequence({
  sequenceId: "com.tldraw.binding",
  recordType: "binding",
  sequence: []
});
function isBinding(record) {
  if (!record) return false;
  return record.typeName === "binding";
}
function isBindingId(id) {
  if (!id) return false;
  return id.startsWith("binding:");
}
function createBindingId(id) {
  return `binding:${id ?? uniqueId()}`;
}
function createBindingPropsMigrationSequence(migrations) {
  return migrations;
}
function createBindingPropsMigrationIds(bindingType, ids) {
  return mapObjectMapValues(ids, (_k, v) => `com.tldraw.binding.${bindingType}/${v}`);
}
function createBindingRecordType(bindings) {
  return createRecordType("binding", {
    scope: "document",
    validator: T.model(
      "binding",
      T.union(
        "type",
        mapObjectMapValues(
          bindings,
          (type, { props, meta }) => createBindingValidator(type, props, meta)
        )
      )
    )
  }).withDefaultProperties(() => ({
    meta: {}
  }));
}
export {
  createBindingId,
  createBindingPropsMigrationIds,
  createBindingPropsMigrationSequence,
  createBindingRecordType,
  isBinding,
  isBindingId,
  rootBindingMigrations,
  rootBindingVersions
};
//# sourceMappingURL=TLBinding.mjs.map
