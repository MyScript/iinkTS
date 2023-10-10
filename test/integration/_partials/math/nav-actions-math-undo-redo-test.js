const {
  waitForEditorWebSocket,
  write,
  getDatasFromExportedEvent,
  getExportsTypeFromEditorModel,
  getEditorConfiguration,
  setEditorConfiguration,
  getExportsFromEditorModel,
  waitEditorIdle
} = require("../../helper");
const { equation1 } = require("../../strokesDatas");

describe("Nav actions math undo/redo", () => {
  test('should undo/redo in mode "stroke" by default', async () => {
    const config = await getEditorConfiguration(page);
    expect(config.recognition.math["undo-redo"].mode).toEqual("stroke");

    config.recognition.math.customGrammarContent = undefined
    await setEditorConfiguration(page, config)
    await waitForEditorWebSocket(page)

    let latex;
    await write(page, equation1.strokes, 100, 100);
    await waitEditorIdle(page);

    const [clearExport] = await Promise.all([getDatasFromExportedEvent(page), page.click("#clear")]);
    const modelExportCleared = await getExportsFromEditorModel(page);
    if (modelExportCleared) {
      expect(modelExportCleared["application/x-latex"]).toEqual("");
      expect(clearExport["application/x-latex"]).toEqual("");
    }

    const [undo1Export] = await Promise.all([getDatasFromExportedEvent(page), page.click("#undo")]);
    latex = await getExportsTypeFromEditorModel(page, "application/x-latex");
    expect(undo1Export["application/x-latex"]).toEqual(latex);
    expect(equation1.exports.LATEX.at(-1)).toEqual(undo1Export["application/x-latex"]);

    await waitEditorIdle(page);
    const [undo2Export] = await Promise.all([getDatasFromExportedEvent(page), page.click("#undo")]);
    latex = await getExportsTypeFromEditorModel(page, "application/x-latex");
    expect(undo2Export["application/x-latex"]).toEqual(latex);
    expect(equation1.exports.LATEX.at(-2)).toEqual(undo2Export["application/x-latex"]);

    await waitEditorIdle(page);
    const [undo3Export] = await Promise.all([getDatasFromExportedEvent(page), page.click("#undo")]);
    latex = await getExportsTypeFromEditorModel(page, "application/x-latex");
    expect(undo3Export["application/x-latex"]).toEqual(latex);
    expect(equation1.exports.LATEX.at(-3)).toEqual(undo3Export["application/x-latex"]);

    await waitEditorIdle(page);
    const [redoExport] = await Promise.all([getDatasFromExportedEvent(page), page.click("#redo")]);
    latex = await getExportsTypeFromEditorModel(page, "application/x-latex");
    expect(redoExport["application/x-latex"]).toEqual(latex);
    expect(equation1.exports.LATEX.at(-2)).toEqual(redoExport["application/x-latex"]);
  });

  test('should undo/redo in mode "session"', async () => {
    const config = await getEditorConfiguration(page);
    config.recognition.math.mimeTypes = ["application/x-latex"];
    config.recognition.math["undo-redo"].mode = "session";
    // 5000 = time to write equation1
    config.recognition.math["session-time"] = 5000;

    config.recognition.math.customGrammarContent = undefined
    await setEditorConfiguration(page, config);
    await waitForEditorWebSocket(page);

    let latex;
    await write(page, equation1.strokes);
    await waitEditorIdle(page);
    latex = await getExportsTypeFromEditorModel(page, "application/x-latex");
    expect(latex).toEqual(equation1.exports.LATEX.at(-1));

    const [clearExport] = await Promise.all([getDatasFromExportedEvent(page), page.click("#clear")]);
    const modelExportCleared = await getExportsFromEditorModel(page);
    if (modelExportCleared) {
      expect(modelExportCleared["application/x-latex"]).toEqual("");
      expect(clearExport["application/x-latex"]).toEqual("");
    }

    await waitEditorIdle(page);
    const [undo1Export] = await Promise.all([getDatasFromExportedEvent(page), page.click("#undo")]);
    latex = await getExportsTypeFromEditorModel(page, "application/x-latex");
    expect(undo1Export["application/x-latex"]).toEqual(latex);
    expect(undo1Export["application/x-latex"]).toEqual(equation1.exports.LATEX.at(-1));

    await waitEditorIdle(page);
    const [undo2Export] = await Promise.all([getDatasFromExportedEvent(page), page.click("#undo")]);
    latex = await getExportsTypeFromEditorModel(page, "application/x-latex");
    expect(undo2Export["application/x-latex"]).toEqual(latex);
    expect(latex).toEqual("");

    await waitEditorIdle(page);
    const [redoExport] = await Promise.all([getDatasFromExportedEvent(page), page.click("#redo")]);
    latex = await getExportsTypeFromEditorModel(page, "application/x-latex");
    expect(redoExport["application/x-latex"]).toEqual(latex);
    expect(redoExport["application/x-latex"]).toEqual(equation1.exports.LATEX.at(-1));
  });
});
