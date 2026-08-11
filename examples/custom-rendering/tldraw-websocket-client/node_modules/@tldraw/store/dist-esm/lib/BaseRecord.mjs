function isRecord(record) {
  return typeof record === "object" && record !== null && "id" in record && "typeName" in record;
}
export {
  isRecord
};
//# sourceMappingURL=BaseRecord.mjs.map
