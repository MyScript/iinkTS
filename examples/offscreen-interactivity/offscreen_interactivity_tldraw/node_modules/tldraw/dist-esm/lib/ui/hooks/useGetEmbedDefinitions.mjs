import { useGetEmbedShapeUtil } from "./useGetEmbedDefinition.mjs";
function useGetEmbedDefinitions() {
  const embedUtil = useGetEmbedShapeUtil();
  return embedUtil ? embedUtil.getEmbedDefinitions() : [];
}
export {
  useGetEmbedDefinitions
};
//# sourceMappingURL=useGetEmbedDefinitions.mjs.map
