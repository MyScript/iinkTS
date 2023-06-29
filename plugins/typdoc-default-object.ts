// @ts-check
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { TypeScript, Converter } = require("typedoc")

exports.load = function ({ application })
{
    const defaultValues = new Map()

    const printer = TypeScript.createPrinter({
        removeComments: true,
        omitTrailingSemicolon: true,
        newLine: TypeScript.NewLineKind.LineFeed
    })

    application.converter.on(
        Converter.EVENT_CREATE_DECLARATION,
        (context, reflection) =>
        {
            const symbol = context.project.getSymbolFromReflection(reflection)
            if (!symbol) return

            const decl = symbol.getDeclarations()?.find(TypeScript.isVariableDeclaration)
            if (!decl || !decl.initializer) return

            if (decl.initializer.kind === TypeScript.SyntaxKind.ObjectLiteralExpression) {
                // Unfortunately can't just set defaultValue right here, this happens before TD sets it.
                defaultValues.set(
                    reflection,
                    printer.printNode(TypeScript.EmitHint.Expression, decl.initializer, decl.getSourceFile())
                )
            }
        }
    )

    application.converter.on(Converter.EVENT_RESOLVE_BEGIN, () =>
    {
        for (const [refl, init] of defaultValues) {
            refl.defaultValue = init.replace("/n", "<br>")
        }
        defaultValues.clear()
    })
}
