import { DecoratorUtil } from "./decorator/DecoratorUtil"
import { EdgeUtil } from "./edge/EdgeUtil"
import { ShapeUtil } from "./shape/ShapeUtil"
import { StrokeUtil } from "./stroke/StrokeUtil"
import { symbolRegistry } from "./SymbolRegistry"
import { MathUtil } from "./typeset/MathUtil"
import { TextUtil } from "./typeset/TextUtil"

/**
 * @group SymbolUtils
 */
export function registerBuiltinSymbolUtils(): void {
  symbolRegistry
    .register(new StrokeUtil())
    .register(new TextUtil())
    .register(new MathUtil())
    .register(new ShapeUtil())
    .register(new EdgeUtil())
    .register(new DecoratorUtil())
}
