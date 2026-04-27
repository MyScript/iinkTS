import { Editor } from '@tiptap/core';
import { MarkType } from '@tiptap/pm/model';
import { Plugin } from '@tiptap/pm/state';
type PasteHandlerOptions = {
    editor: Editor;
    defaultProtocol: string;
    type: MarkType;
};
export declare function pasteHandler(options: PasteHandlerOptions): Plugin;
export {};
//# sourceMappingURL=pasteHandler.d.ts.map