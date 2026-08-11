(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('@tiptap/core'), require('linkifyjs'), require('@tiptap/pm/state')) :
  typeof define === 'function' && define.amd ? define(['exports', '@tiptap/core', 'linkifyjs', '@tiptap/pm/state'], factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global["@tiptap/extension-link"] = {}, global.core, global.linkifyjs, global.state));
})(this, (function (exports, core, linkifyjs, state) { 'use strict';

  // From DOMPurify
  // https://github.com/cure53/DOMPurify/blob/main/src/regexp.ts
  const UNICODE_WHITESPACE_PATTERN = '[\u0000-\u0020\u00A0\u1680\u180E\u2000-\u2029\u205F\u3000]';
  const UNICODE_WHITESPACE_REGEX = new RegExp(UNICODE_WHITESPACE_PATTERN);
  const UNICODE_WHITESPACE_REGEX_END = new RegExp(`${UNICODE_WHITESPACE_PATTERN}$`);
  const UNICODE_WHITESPACE_REGEX_GLOBAL = new RegExp(UNICODE_WHITESPACE_PATTERN, 'g');

  /**
   * Check if the provided tokens form a valid link structure, which can either be a single link token
   * or a link token surrounded by parentheses or square brackets.
   *
   * This ensures that only complete and valid text is hyperlinked, preventing cases where a valid
   * top-level domain (TLD) is immediately followed by an invalid character, like a number. For
   * example, with the `find` method from Linkify, entering `example.com1` would result in
   * `example.com` being linked and the trailing `1` left as plain text. By using the `tokenize`
   * method, we can perform more comprehensive validation on the input text.
   */
  function isValidLinkStructure(tokens) {
      if (tokens.length === 1) {
          return tokens[0].isLink;
      }
      if (tokens.length === 3 && tokens[1].isLink) {
          return ['()', '[]'].includes(tokens[0].value + tokens[2].value);
      }
      return false;
  }
  /**
   * This plugin allows you to automatically add links to your editor.
   * @param options The plugin options
   * @returns The plugin instance
   */
  function autolink(options) {
      return new state.Plugin({
          key: new state.PluginKey('autolink'),
          appendTransaction: (transactions, oldState, newState) => {
              /**
               * Does the transaction change the document?
               */
              const docChanges = transactions.some(transaction => transaction.docChanged) && !oldState.doc.eq(newState.doc);
              /**
               * Prevent autolink if the transaction is not a document change or if the transaction has the meta `preventAutolink`.
               */
              const preventAutolink = transactions.some(transaction => transaction.getMeta('preventAutolink'));
              /**
               * Prevent autolink if the transaction is not a document change
               * or if the transaction has the meta `preventAutolink`.
               */
              if (!docChanges || preventAutolink) {
                  return;
              }
              const { tr } = newState;
              const transform = core.combineTransactionSteps(oldState.doc, [...transactions]);
              const changes = core.getChangedRanges(transform);
              changes.forEach(({ newRange }) => {
                  // Now let’s see if we can add new links.
                  const nodesInChangedRanges = core.findChildrenInRange(newState.doc, newRange, node => node.isTextblock);
                  let textBlock;
                  let textBeforeWhitespace;
                  if (nodesInChangedRanges.length > 1) {
                      // Grab the first node within the changed ranges (ex. the first of two paragraphs when hitting enter).
                      textBlock = nodesInChangedRanges[0];
                      textBeforeWhitespace = newState.doc.textBetween(textBlock.pos, textBlock.pos + textBlock.node.nodeSize, undefined, ' ');
                  }
                  else if (nodesInChangedRanges.length) {
                      const endText = newState.doc.textBetween(newRange.from, newRange.to, ' ', ' ');
                      if (!UNICODE_WHITESPACE_REGEX_END.test(endText)) {
                          return;
                      }
                      textBlock = nodesInChangedRanges[0];
                      textBeforeWhitespace = newState.doc.textBetween(textBlock.pos, newRange.to, undefined, ' ');
                  }
                  if (textBlock && textBeforeWhitespace) {
                      const wordsBeforeWhitespace = textBeforeWhitespace.split(UNICODE_WHITESPACE_REGEX).filter(Boolean);
                      if (wordsBeforeWhitespace.length <= 0) {
                          return false;
                      }
                      const lastWordBeforeSpace = wordsBeforeWhitespace[wordsBeforeWhitespace.length - 1];
                      const lastWordAndBlockOffset = textBlock.pos + textBeforeWhitespace.lastIndexOf(lastWordBeforeSpace);
                      if (!lastWordBeforeSpace) {
                          return false;
                      }
                      const linksBeforeSpace = linkifyjs.tokenize(lastWordBeforeSpace).map(t => t.toObject(options.defaultProtocol));
                      if (!isValidLinkStructure(linksBeforeSpace)) {
                          return false;
                      }
                      linksBeforeSpace
                          .filter(link => link.isLink)
                          // Calculate link position.
                          .map(link => ({
                          ...link,
                          from: lastWordAndBlockOffset + link.start + 1,
                          to: lastWordAndBlockOffset + link.end + 1,
                      }))
                          // ignore link inside code mark
                          .filter(link => {
                          if (!newState.schema.marks.code) {
                              return true;
                          }
                          return !newState.doc.rangeHasMark(link.from, link.to, newState.schema.marks.code);
                      })
                          // validate link
                          .filter(link => options.validate(link.value))
                          // check whether should autolink
                          .filter(link => options.shouldAutoLink(link.value))
                          // Add link mark.
                          .forEach(link => {
                          if (core.getMarksBetween(link.from, link.to, newState.doc).some(item => item.mark.type === options.type)) {
                              return;
                          }
                          tr.addMark(link.from, link.to, options.type.create({
                              href: link.href,
                          }));
                      });
                  }
              });
              if (!tr.steps.length) {
                  return;
              }
              return tr;
          },
      });
  }

  function clickHandler(options) {
      return new state.Plugin({
          key: new state.PluginKey('handleClickLink'),
          props: {
              handleClick: (view, pos, event) => {
                  var _a, _b;
                  if (event.button !== 0) {
                      return false;
                  }
                  if (!view.editable) {
                      return false;
                  }
                  let a = event.target;
                  const els = [];
                  while (a.nodeName !== 'DIV') {
                      els.push(a);
                      a = a.parentNode;
                  }
                  if (!els.find(value => value.nodeName === 'A')) {
                      return false;
                  }
                  const attrs = core.getAttributes(view.state, options.type.name);
                  const link = event.target;
                  const href = (_a = link === null || link === void 0 ? void 0 : link.href) !== null && _a !== void 0 ? _a : attrs.href;
                  const target = (_b = link === null || link === void 0 ? void 0 : link.target) !== null && _b !== void 0 ? _b : attrs.target;
                  if (link && href) {
                      window.open(href, target);
                      return true;
                  }
                  return false;
              },
          },
      });
  }

  function pasteHandler(options) {
      return new state.Plugin({
          key: new state.PluginKey('handlePasteLink'),
          props: {
              handlePaste: (view, event, slice) => {
                  const { state } = view;
                  const { selection } = state;
                  const { empty } = selection;
                  if (empty) {
                      return false;
                  }
                  let textContent = '';
                  slice.content.forEach(node => {
                      textContent += node.textContent;
                  });
                  const link = linkifyjs.find(textContent, { defaultProtocol: options.defaultProtocol }).find(item => item.isLink && item.value === textContent);
                  if (!textContent || !link) {
                      return false;
                  }
                  return options.editor.commands.setMark(options.type, {
                      href: link.href,
                  });
              },
          },
      });
  }

  const pasteRegex = /https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z]{2,}\b(?:[-a-zA-Z0-9@:%._+~#=?!&/]*)(?:[-a-zA-Z0-9@:%._+~#=?!&/]*)/gi;
  function isAllowedUri(uri, protocols) {
      const allowedProtocols = [
          'http',
          'https',
          'ftp',
          'ftps',
          'mailto',
          'tel',
          'callto',
          'sms',
          'cid',
          'xmpp',
      ];
      if (protocols) {
          protocols.forEach(protocol => {
              const nextProtocol = typeof protocol === 'string' ? protocol : protocol.scheme;
              if (nextProtocol) {
                  allowedProtocols.push(nextProtocol);
              }
          });
      }
      return (!uri
          || uri.replace(UNICODE_WHITESPACE_REGEX_GLOBAL, '').match(new RegExp(
          // eslint-disable-next-line no-useless-escape
          `^(?:(?:${allowedProtocols.join('|')}):|[^a-z]|[a-z0-9+.\-]+(?:[^a-z+.\-:]|$))`, 'i')));
  }
  /**
   * This extension allows you to create links.
   * @see https://www.tiptap.dev/api/marks/link
   */
  const Link = core.Mark.create({
      name: 'link',
      priority: 1000,
      keepOnSplit: false,
      exitable: true,
      onCreate() {
          if (this.options.validate && !this.options.shouldAutoLink) {
              // Copy the validate function to the shouldAutoLink option
              this.options.shouldAutoLink = this.options.validate;
              console.warn('The `validate` option is deprecated. Rename to the `shouldAutoLink` option instead.');
          }
          this.options.protocols.forEach(protocol => {
              if (typeof protocol === 'string') {
                  linkifyjs.registerCustomProtocol(protocol);
                  return;
              }
              linkifyjs.registerCustomProtocol(protocol.scheme, protocol.optionalSlashes);
          });
      },
      onDestroy() {
          linkifyjs.reset();
      },
      inclusive() {
          return this.options.autolink;
      },
      addOptions() {
          return {
              openOnClick: true,
              linkOnPaste: true,
              autolink: true,
              protocols: [],
              defaultProtocol: 'http',
              HTMLAttributes: {
                  target: '_blank',
                  rel: 'noopener noreferrer nofollow',
                  class: null,
              },
              isAllowedUri: (url, ctx) => !!isAllowedUri(url, ctx.protocols),
              validate: url => !!url,
              shouldAutoLink: url => !!url,
          };
      },
      addAttributes() {
          return {
              href: {
                  default: null,
                  parseHTML(element) {
                      return element.getAttribute('href');
                  },
              },
              target: {
                  default: this.options.HTMLAttributes.target,
              },
              rel: {
                  default: this.options.HTMLAttributes.rel,
              },
              class: {
                  default: this.options.HTMLAttributes.class,
              },
          };
      },
      parseHTML() {
          return [
              {
                  tag: 'a[href]',
                  getAttrs: dom => {
                      const href = dom.getAttribute('href');
                      // prevent XSS attacks
                      if (!href
                          || !this.options.isAllowedUri(href, {
                              defaultValidate: url => !!isAllowedUri(url, this.options.protocols),
                              protocols: this.options.protocols,
                              defaultProtocol: this.options.defaultProtocol,
                          })) {
                          return false;
                      }
                      return null;
                  },
              },
          ];
      },
      renderHTML({ HTMLAttributes }) {
          // prevent XSS attacks
          if (!this.options.isAllowedUri(HTMLAttributes.href, {
              defaultValidate: href => !!isAllowedUri(href, this.options.protocols),
              protocols: this.options.protocols,
              defaultProtocol: this.options.defaultProtocol,
          })) {
              // strip out the href
              return [
                  'a',
                  core.mergeAttributes(this.options.HTMLAttributes, { ...HTMLAttributes, href: '' }),
                  0,
              ];
          }
          return ['a', core.mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0];
      },
      addCommands() {
          return {
              setLink: attributes => ({ chain }) => {
                  const { href } = attributes;
                  if (!this.options.isAllowedUri(href, {
                      defaultValidate: url => !!isAllowedUri(url, this.options.protocols),
                      protocols: this.options.protocols,
                      defaultProtocol: this.options.defaultProtocol,
                  })) {
                      return false;
                  }
                  return chain().setMark(this.name, attributes).setMeta('preventAutolink', true).run();
              },
              toggleLink: attributes => ({ chain }) => {
                  const { href } = attributes;
                  if (!this.options.isAllowedUri(href, {
                      defaultValidate: url => !!isAllowedUri(url, this.options.protocols),
                      protocols: this.options.protocols,
                      defaultProtocol: this.options.defaultProtocol,
                  })) {
                      return false;
                  }
                  return chain()
                      .toggleMark(this.name, attributes, { extendEmptyMarkRange: true })
                      .setMeta('preventAutolink', true)
                      .run();
              },
              unsetLink: () => ({ chain }) => {
                  return chain()
                      .unsetMark(this.name, { extendEmptyMarkRange: true })
                      .setMeta('preventAutolink', true)
                      .run();
              },
          };
      },
      addPasteRules() {
          return [
              core.markPasteRule({
                  find: text => {
                      const foundLinks = [];
                      if (text) {
                          const { protocols, defaultProtocol } = this.options;
                          const links = linkifyjs.find(text).filter(item => item.isLink
                              && this.options.isAllowedUri(item.value, {
                                  defaultValidate: href => !!isAllowedUri(href, protocols),
                                  protocols,
                                  defaultProtocol,
                              }));
                          if (links.length) {
                              links.forEach(link => foundLinks.push({
                                  text: link.value,
                                  data: {
                                      href: link.href,
                                  },
                                  index: link.start,
                              }));
                          }
                      }
                      return foundLinks;
                  },
                  type: this.type,
                  getAttributes: match => {
                      var _a;
                      return {
                          href: (_a = match.data) === null || _a === void 0 ? void 0 : _a.href,
                      };
                  },
              }),
          ];
      },
      addProseMirrorPlugins() {
          const plugins = [];
          const { protocols, defaultProtocol } = this.options;
          if (this.options.autolink) {
              plugins.push(autolink({
                  type: this.type,
                  defaultProtocol: this.options.defaultProtocol,
                  validate: url => this.options.isAllowedUri(url, {
                      defaultValidate: href => !!isAllowedUri(href, protocols),
                      protocols,
                      defaultProtocol,
                  }),
                  shouldAutoLink: this.options.shouldAutoLink,
              }));
          }
          if (this.options.openOnClick === true) {
              plugins.push(clickHandler({
                  type: this.type,
              }));
          }
          if (this.options.linkOnPaste) {
              plugins.push(pasteHandler({
                  editor: this.editor,
                  defaultProtocol: this.options.defaultProtocol,
                  type: this.type,
              }));
          }
          return plugins;
      },
  });

  exports.Link = Link;
  exports.default = Link;
  exports.isAllowedUri = isAllowedUri;
  exports.pasteRegex = pasteRegex;

  Object.defineProperty(exports, '__esModule', { value: true });

}));
//# sourceMappingURL=index.umd.js.map
