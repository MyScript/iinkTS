import { T } from "@tldraw/validate";
class StyleProp {
  /** @internal */
  constructor(id, defaultValue, type) {
    this.id = id;
    this.defaultValue = defaultValue;
    this.type = type;
  }
  /**
   * Define a new {@link StyleProp}.
   *
   * @param uniqueId - Each StyleProp must have a unique ID. We recommend you prefix this with
   * your app/library name.
   * @param options -
   * - `defaultValue`: The default value for this style prop.
   *
   * - `type`: Optionally, describe what type of data you expect for this style prop.
   *
   * @example
   * ```ts
   * import {T} from '@tldraw/validate'
   * import {StyleProp} from '@tldraw/tlschema'
   *
   * const MyLineWidthProp = StyleProp.define('myApp:lineWidth', {
   *   defaultValue: 1,
   *   type: T.number,
   * })
   * ```
   * @public
   */
  static define(uniqueId, options) {
    const { defaultValue, type = T.any } = options;
    return new StyleProp(uniqueId, defaultValue, type);
  }
  /**
   * Define a new {@link StyleProp} as a list of possible values.
   *
   * @param uniqueId - Each StyleProp must have a unique ID. We recommend you prefix this with
   * your app/library name.
   * @param options -
   * - `defaultValue`: The default value for this style prop.
   *
   * - `values`: An array of possible values of this style prop.
   *
   * @example
   * ```ts
   * import {StyleProp} from '@tldraw/tlschema'
   *
   * const MySizeProp = StyleProp.defineEnum('myApp:size', {
   *   defaultValue: 'medium',
   *   values: ['small', 'medium', 'large'],
   * })
   * ```
   */
  static defineEnum(uniqueId, options) {
    const { defaultValue, values } = options;
    return new EnumStyleProp(uniqueId, defaultValue, values);
  }
  setDefaultValue(value) {
    this.defaultValue = value;
  }
  validate(value) {
    return this.type.validate(value);
  }
  validateUsingKnownGoodVersion(prevValue, newValue) {
    if (this.type.validateUsingKnownGoodVersion) {
      return this.type.validateUsingKnownGoodVersion(prevValue, newValue);
    } else {
      return this.validate(newValue);
    }
  }
}
class EnumStyleProp extends StyleProp {
  /** @internal */
  constructor(id, defaultValue, values) {
    super(id, defaultValue, T.literalEnum(...values));
    this.values = values;
  }
}
export {
  EnumStyleProp,
  StyleProp
};
//# sourceMappingURL=StyleProp.mjs.map
