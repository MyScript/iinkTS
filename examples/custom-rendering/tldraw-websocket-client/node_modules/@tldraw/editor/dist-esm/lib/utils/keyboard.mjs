import { tlenv } from "../globals/environment.mjs";
const isAccelKey = (e) => {
  return tlenv.isDarwin ? e.metaKey : e.ctrlKey || e.metaKey;
};
export {
  isAccelKey
};
//# sourceMappingURL=keyboard.mjs.map
