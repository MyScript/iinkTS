import { createEditorMock, asEditor } from "../../../__mocks__/createEditorMock"
import { buildIIStroke } from "../../../helpers"
import { IIGestureAnnotationProcessor, DecoratorKind, StrokeOps } from "@/iink"

describe("GestureAnnotation.ts", () => {
  describe("IIGestureAnnotationProcessor.apply (decorator)", () => {
    test("waits for a still-unclassified target stroke to be recognized before giving up", async () => {
      const editor = createEditorMock()
      const processor = new IIGestureAnnotationProcessor(asEditor(editor))

      const stroke = buildIIStroke()
      StrokeOps.addPointer(stroke, { x: 10, y: 10, p: 1, t: 100 })
      StrokeOps.addPointer(stroke, { x: 20, y: 20, p: 1, t: 200 })
      // Not classified yet — mirrors a freshly-written stroke whose own recognition
      // round-trip hasn't resolved yet (jiixBlockType assigned later, asynchronously).
      editor.model.addSymbol(stroke)

      setTimeout(() => {
        stroke.jiixBlockType = "Text"
      }, 50)

      const changes = await processor.apply([stroke.id], {
        kind: "decorator",
        decoratorKind: DecoratorKind.Surround,
      })

      expect(changes?.added).toHaveLength(1)
      const decorator = editor.model.symbols.find((s) => s.type === "decorator")
      expect(decorator).toBeDefined()
      expect((decorator as { targetIds: string[] }).targetIds).toContain(stroke.id)
    })

    test("gives up if the target stroke is never classified as text", async () => {
      const editor = createEditorMock()
      const processor = new IIGestureAnnotationProcessor(asEditor(editor))

      const stroke = buildIIStroke()
      StrokeOps.addPointer(stroke, { x: 10, y: 10, p: 1, t: 100 })
      StrokeOps.addPointer(stroke, { x: 20, y: 20, p: 1, t: 200 })
      editor.model.addSymbol(stroke)

      const changes = await processor.apply([stroke.id], {
        kind: "decorator",
        decoratorKind: DecoratorKind.Surround,
      })

      expect(changes).toBeUndefined()
      expect(editor.model.symbols.find((s) => s.type === "decorator")).toBeUndefined()
    }, 10000)
  })
})
