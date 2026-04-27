import { MarkType } from '@tiptap/pm/model';
import { Plugin } from '@tiptap/pm/state';
type AutolinkOptions = {
    type: MarkType;
    defaultProtocol: string;
    validate: (url: string) => boolean;
    shouldAutoLink: (url: string) => boolean;
};
/**
 * This plugin allows you to automatically add links to your editor.
 * @param options The plugin options
 * @returns The plugin instance
 */
export declare function autolink(options: AutolinkOptions): Plugin;
export {};
//# sourceMappingURL=autolink.d.ts.map